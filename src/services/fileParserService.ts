import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ColumnMappingDefinition, DatasetSource, RawInvoiceRecord, DocumentType } from '../types/gst';
import { standardizeDate } from '../utils/gstValidator';
import { round2 } from '../utils/decimal';

export interface ParsedWorkbookInfo {
  fileName: string;
  fileSize: number;
  fileType: 'xlsx' | 'xls' | 'csv' | 'json';
  sheetNames: string[];
  activeSheet: string;
  rawRows: any[][];
  headers: string[];
  headerRowIndex: number;
  previewRows: Record<string, any>[];
  totalRowCount: number;
}

export interface ParseResult {
  validRecords: RawInvoiceRecord[];
  rejectedRows: { rowIndex: number; reason: string; rowData: any }[];
  totalImported: number;
  duplicateRowsFound: number;
}

/**
 * Reads an uploaded file (XLSX, XLS, CSV, JSON) and returns sheet details and raw rows
 */
export const inspectUploadedFile = async (file: File): Promise<ParsedWorkbookInfo> => {
  const fileName = file.name;
  const fileSize = file.size;
  const ext = fileName.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    const text = await file.text();
    const parsed = Papa.parse(text, { skipEmptyLines: false });
    const rawRows = (parsed.data as any[][]) || [];
    const { headerRowIndex, headers } = detectHeaderRow(rawRows);
    const dataRows = rawRows.slice(headerRowIndex + 1);
    const previewRows = convertRowsToObjects(headers, dataRows.slice(0, 50));

    return {
      fileName,
      fileSize,
      fileType: 'csv',
      sheetNames: ['Sheet1'],
      activeSheet: 'Sheet1',
      rawRows,
      headers,
      headerRowIndex,
      previewRows,
      totalRowCount: dataRows.length,
    };
  }

  if (ext === 'json') {
    const text = await file.text();
    const parsedJson = JSON.parse(text);
    let rows: any[] = [];
    if (Array.isArray(parsedJson)) {
      rows = parsedJson;
    } else if (parsedJson.b2b) {
      // GST Portal standard GSTR-2B / 2A JSON payload structure
      rows = flattenGstr2bJson(parsedJson);
    } else {
      // Find first array property
      const arrKey = Object.keys(parsedJson).find((k) => Array.isArray(parsedJson[k]));
      rows = arrKey ? parsedJson[arrKey] : [parsedJson];
    }

    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
    return {
      fileName,
      fileSize,
      fileType: 'json',
      sheetNames: ['JSON_Records'],
      activeSheet: 'JSON_Records',
      rawRows: [headers, ...rows.map((r) => headers.map((h) => r[h]))],
      headers,
      headerRowIndex: 0,
      previewRows: rows.slice(0, 50),
      totalRowCount: rows.length,
    };
  }

  // Excel (XLSX, XLS)
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, raw: true });
  const sheetNames = workbook.SheetNames;
  const activeSheet = sheetNames[0] || 'Sheet1';
  const worksheet = workbook.Sheets[activeSheet];

  // Convert worksheet to raw array of rows
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true });
  const { headerRowIndex, headers } = detectHeaderRow(rawRows);
  const dataRows = rawRows.slice(headerRowIndex + 1);
  const previewRows = convertRowsToObjects(headers, dataRows.slice(0, 50));

  return {
    fileName,
    fileSize,
    fileType: (ext === 'xls' ? 'xls' : 'xlsx'),
    sheetNames,
    activeSheet,
    rawRows,
    headers,
    headerRowIndex,
    previewRows,
    totalRowCount: dataRows.length,
  };
};

/**
 * Changes active sheet on an already loaded Excel workbook
 */
export const changeExcelSheet = (
  arrayBuffer: ArrayBuffer,
  sheetName: string
): { headers: string[]; headerRowIndex: number; previewRows: Record<string, any>[]; totalRowCount: number; rawRows: any[][] } => {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, raw: true });
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true });
  const { headerRowIndex, headers } = detectHeaderRow(rawRows);
  const dataRows = rawRows.slice(headerRowIndex + 1);
  const previewRows = convertRowsToObjects(headers, dataRows.slice(0, 50));

  return {
    headers,
    headerRowIndex,
    previewRows,
    totalRowCount: dataRows.length,
    rawRows,
  };
};

/**
 * Detects the real header row by inspecting non-empty cells and GST keywords
 */
export const detectHeaderRow = (rows: any[][]): { headerRowIndex: number; headers: string[] } => {
  if (!rows || rows.length === 0) return { headerRowIndex: 0, headers: [] };

  const gstKeywords = ['gstin', 'invoice', 'date', 'taxable', 'igst', 'cgst', 'sgst', 'party', 'voucher', 'amount', 'total'];
  let bestIndex = 0;
  let maxScore = -1;

  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    let score = 0;
    const nonEmptyCells = row.filter((c) => c !== undefined && c !== null && String(c).trim() !== '').length;
    if (nonEmptyCells < 3) continue;

    for (const cell of row) {
      const cellStr = String(cell || '').toLowerCase().trim();
      for (const kw of gstKeywords) {
        if (cellStr.includes(kw)) {
          score += 2;
        }
      }
    }
    // Weight by number of filled columns
    score += nonEmptyCells;

    if (score > maxScore) {
      maxScore = score;
      bestIndex = i;
    }
  }

  const rawHeaderRow = rows[bestIndex] || [];
  const headers = rawHeaderRow.map((col, idx) => {
    const colStr = String(col || '').trim();
    return colStr !== '' ? colStr : `Column_${idx + 1}`;
  });

  return { headerRowIndex: bestIndex, headers };
};

const convertRowsToObjects = (headers: string[], rows: any[][]): Record<string, any>[] => {
  return rows.map((row) => {
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] !== undefined ? row[i] : '';
    });
    return obj;
  });
};

/**
 * Converts raw rows into validated RawInvoiceRecords using the confirmed mapping
 */
export const parseAndValidateRecords = (
  rawRows: any[][],
  headerRowIndex: number,
  headers: string[],
  mapping: ColumnMappingDefinition,
  sourceDataset: DatasetSource,
  fileName: string,
  sheetName: string
): ParseResult => {
  const dataRows = rawRows.slice(headerRowIndex + 1);
  const validRecords: RawInvoiceRecord[] = [];
  const rejectedRows: { rowIndex: number; reason: string; rowData: any }[] = [];
  const seenRecordKeys = new Map<string, number>();
  let duplicateRowsFound = 0;

  const headerColIndexMap: Record<string, number> = {};
  headers.forEach((h, idx) => {
    headerColIndexMap[h] = idx;
  });

  const getColVal = (row: any[], colName?: string): any => {
    if (!colName) return undefined;
    const idx = headerColIndexMap[colName];
    if (idx === undefined) return undefined;
    return row[idx];
  };

  dataRows.forEach((row, i) => {
    const actualRowNumber = headerRowIndex + 1 + i + 1; // 1-indexed

    // Skip entirely blank rows
    const isBlank = row.every((c) => c === undefined || c === null || String(c).trim() === '');
    if (isBlank) return;

    const rawGstin = getColVal(row, mapping.supplierGstinCol);
    const rawInvNo = getColVal(row, mapping.invoiceNumberCol);
    const rawDate = getColVal(row, mapping.invoiceDateCol);
    const rawTaxable = getColVal(row, mapping.taxableValueCol);

    // Validation checks
    if (!rawInvNo || String(rawInvNo).trim() === '') {
      rejectedRows.push({
        rowIndex: actualRowNumber,
        reason: 'Missing Invoice/Document Number',
        rowData: row,
      });
      return;
    }

    if (!rawGstin || String(rawGstin).trim() === '') {
      rejectedRows.push({
        rowIndex: actualRowNumber,
        reason: 'Missing Supplier/Party GSTIN',
        rowData: row,
      });
      return;
    }

    // Clean numbers
    const cleanNumber = (val: any): number => {
      if (val === undefined || val === null || val === '') return 0;
      if (typeof val === 'number') return isNaN(val) ? 0 : round2(val);
      const str = String(val).replace(/,/g, '').trim();
      const num = parseFloat(str);
      return isNaN(num) ? 0 : round2(num);
    };

    const taxableValue = cleanNumber(rawTaxable);
    const igst = cleanNumber(getColVal(row, mapping.igstCol));
    const cgst = cleanNumber(getColVal(row, mapping.cgstCol));
    const sgst = cleanNumber(getColVal(row, mapping.sgstCol));
    const cess = cleanNumber(getColVal(row, mapping.cessCol));
    
    let totalValue = cleanNumber(getColVal(row, mapping.totalValueCol));
    if (totalValue === 0 && taxableValue !== 0) {
      totalValue = round2(taxableValue + igst + cgst + sgst + cess);
    }

    // Document Type determination
    const rawType = String(getColVal(row, mapping.docTypeCol) || '').toUpperCase();
    let docType: DocumentType = 'INV';
    if (rawType.includes('CR') || rawType.includes('CREDIT') || rawType.includes('C/N')) {
      docType = 'CRN';
    } else if (rawType.includes('DB') || rawType.includes('DEBIT') || rawType.includes('D/N')) {
      docType = 'DBN';
    }

    const gstin = String(rawGstin).trim().toUpperCase();
    const invoiceNumber = String(rawInvNo).trim(); // Keep exact verbatim string (e.g., preserves leading zeros)
    const invoiceDate = standardizeDate(rawDate);

    // Duplicate detection inside same file
    const uniqueKey = `${gstin}_${invoiceNumber.toUpperCase()}_${docType}`;
    const seenCount = seenRecordKeys.get(uniqueKey) || 0;
    let isDuplicate = false;
    if (seenCount > 0) {
      isDuplicate = true;
      duplicateRowsFound++;
    }
    seenRecordKeys.set(uniqueKey, seenCount + 1);

    const recordId = `REC-${sourceDataset}-${actualRowNumber}-${Date.now().toString(36)}`;

    // Build raw attributes dictionary
    const rawAttributes: Record<string, any> = {};
    headers.forEach((h, hIdx) => {
      rawAttributes[h] = row[hIdx];
    });

    const record: RawInvoiceRecord = {
      id: recordId,
      sourceDataset,
      sourceFileName: fileName,
      sourceSheetName: sheetName,
      sourceRowNumber: actualRowNumber,
      importTimestamp: new Date().toISOString(),
      supplierGstin: gstin,
      supplierName: String(getColVal(row, mapping.supplierNameCol) || '').trim() || undefined,
      invoiceNumber,
      invoiceDate,
      docType,
      taxableValue,
      igst,
      cgst,
      sgst,
      cess,
      totalValue,
      placeOfSupply: String(getColVal(row, mapping.placeOfSupplyCol) || '').trim() || undefined,
      returnPeriod: String(getColVal(row, mapping.returnPeriodCol) || '').trim() || undefined,
      reverseCharge: getColVal(row, mapping.reverseChargeCol),
      itcEligibility: String(getColVal(row, mapping.itcEligibilityCol) || '').trim() || undefined,
      isDuplicate,
      duplicateGroupKey: isDuplicate ? uniqueKey : undefined,
      rawAttributes,
    };

    validRecords.push(record);
  });

  return {
    validRecords,
    rejectedRows,
    totalImported: validRecords.length,
    duplicateRowsFound,
  };
};

/**
 * Handles official GSTN Portal GSTR-2B JSON format
 */
const flattenGstr2bJson = (data: any): Record<string, any>[] => {
  const rows: Record<string, any>[] = [];
  try {
    const doclist = data.b2b || [];
    for (const supplier of doclist) {
      const ctin = supplier.ctin;
      const cname = supplier.cname || '';
      for (const inv of supplier.inv || []) {
        rows.push({
          'GSTIN of supplier': ctin,
          'Trade/Legal name': cname,
          'Invoice number': inv.inum,
          'Invoice date': inv.dt,
          'Invoice Value(₹)': inv.val,
          'Place of supply': inv.pos,
          'Reverse Charge': inv.rev || 'N',
          'Invoice type': inv.typ || 'R',
          'Taxable Value (₹)': inv.items?.[0]?.itval?.txval || 0,
          'Integrated Tax(₹)': inv.items?.[0]?.itval?.iamt || 0,
          'Central Tax(₹)': inv.items?.[0]?.itval?.camt || 0,
          'State/UT Tax(₹)': inv.items?.[0]?.itval?.samt || 0,
          'Cess(₹)': inv.items?.[0]?.itval?.csamt || 0,
          'ITC Availability': inv.itc_elg || 'Y',
        });
      }
    }
  } catch (e) {
    console.error('Error flattening GSTR-2B JSON', e);
  }
  return rows;
};
