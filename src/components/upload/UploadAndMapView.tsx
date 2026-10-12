import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  ArrowRight,
  RefreshCw,
  Table,
  Check,
  Info,
} from 'lucide-react';
import {
  ColumnMappingDefinition,
  DatasetSource,
  RawInvoiceRecord,
} from '../../types/gst';
import {
  changeExcelSheet,
  inspectUploadedFile,
  parseAndValidateRecords,
  ParsedWorkbookInfo,
} from '../../services/fileParserService';
import {
  autoDetectColumnMapping,
  MAPPING_FIELDS,
  PRESET_TEMPLATES,
} from '../../services/columnMappingService';

interface UploadAndMapViewProps {
  onImportRecords: (
    records: RawInvoiceRecord[],
    datasetSource: DatasetSource,
    fileName: string,
    sheetName: string
  ) => void;
  onNavigateToWorkbench: () => void;
}

export const UploadAndMapView: React.FC<UploadAndMapViewProps> = ({
  onImportRecords,
  onNavigateToWorkbench,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetDataset, setTargetDataset] = useState<DatasetSource>('PURCHASE_REGISTER');
  const [workbookInfo, setWorkbookInfo] = useState<ParsedWorkbookInfo | null>(null);
  const [fileArrayBuffer, setFileArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingDefinition>({});
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    validCount: number;
    rejectedCount: number;
    duplicatesCount: number;
    rejectedRows: any[];
  } | null>(null);

  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);
    setImportSummary(null);
    try {
      setSelectedFile(file);
      const buffer = await file.arrayBuffer();
      setFileArrayBuffer(buffer);

      const info = await inspectUploadedFile(file);
      setWorkbookInfo(info);
      setActiveSheet(info.activeSheet);

      // Auto-detect column mapping from headers
      const detected = autoDetectColumnMapping(info.headers);
      setColumnMapping(detected);
    } catch (err: any) {
      console.error(err);
      alert('Error reading workbook: ' + (err.message || 'Malformed file'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    if (!fileArrayBuffer || !workbookInfo) return;
    setActiveSheet(sheetName);
    const newSheetData = changeExcelSheet(fileArrayBuffer, sheetName);
    setWorkbookInfo({
      ...workbookInfo,
      activeSheet: sheetName,
      headers: newSheetData.headers,
      headerRowIndex: newSheetData.headerRowIndex,
      previewRows: newSheetData.previewRows,
      totalRowCount: newSheetData.totalRowCount,
      rawRows: newSheetData.rawRows,
    });
    // Re-detect mapping for new sheet
    const detected = autoDetectColumnMapping(newSheetData.headers);
    setColumnMapping(detected);
  };

  const applyPresetTemplate = (templateName: string) => {
    const template = PRESET_TEMPLATES.find((t) => t.name === templateName);
    if (!template || !workbookInfo) return;

    // Apply template mapping if columns exist in workbook headers
    const newMapping: ColumnMappingDefinition = { ...columnMapping };
    for (const [key, colName] of Object.entries(template.mapping)) {
      if (workbookInfo.headers.includes(colName)) {
        (newMapping as any)[key] = colName;
      }
    }
    setColumnMapping(newMapping);
  };

  const handleConfirmImport = () => {
    if (!workbookInfo) return;

    // Validate that mandatory columns are mapped
    if (!columnMapping.invoiceNumberCol || !columnMapping.supplierGstinCol || !columnMapping.taxableValueCol) {
      alert('Please map mandatory columns: Supplier GSTIN, Invoice Number, and Taxable Value.');
      return;
    }

    const result = parseAndValidateRecords(
      workbookInfo.rawRows,
      workbookInfo.headerRowIndex,
      workbookInfo.headers,
      columnMapping,
      targetDataset,
      workbookInfo.fileName,
      activeSheet
    );

    setImportSummary({
      validCount: result.validRecords.length,
      rejectedCount: result.rejectedRows.length,
      duplicatesCount: result.duplicateRowsFound,
      rejectedRows: result.rejectedRows,
    });

    onImportRecords(result.validRecords, targetDataset, workbookInfo.fileName, activeSheet);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="bg-[#181818] p-5 rounded-lg border border-[#2B2B2B]">
        <div className="flex items-center gap-2 text-xs text-[#B69A61] font-mono uppercase">
          <span>Module C & D</span>
          <span>•</span>
          <span>Multi-Format File Import & Column Mapping</span>
        </div>
        <h2 className="text-lg font-semibold text-[#F5F0E6] mt-1">Spreadsheet & Document Ingestion</h2>
        <p className="text-xs text-[#8E877C] mt-0.5">
          Upload real Excel (XLSX/XLS), CSV, or JSON files from Tally, Zoho Books, SAP, or official GST Portal returns.
        </p>
      </div>

      {/* Target Dataset Selector */}
      <div className="bg-[#1C1C1C] p-4 rounded-lg border border-[#2D2D2D] space-y-3">
        <label className="text-xs font-semibold text-[#8E877C] uppercase">Select Target Dataset Source</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          {[
            { id: 'PURCHASE_REGISTER', label: 'Purchase Register (Books)' },
            { id: 'GSTR_2B', label: 'GSTR-2B (Portal Return)' },
            { id: 'GSTR_2A', label: 'GSTR-2A (Dynamic Return)' },
            { id: 'GSTR_3B', label: 'GSTR-3B (Return Summary)' },
            { id: 'SALES_REGISTER', label: 'Sales Register (Books)' },
            { id: 'GSTR_1', label: 'GSTR-1 (Outward Return)' },
          ].map((ds) => (
            <button
              key={ds.id}
              onClick={() => setTargetDataset(ds.id as DatasetSource)}
              className={`p-2.5 rounded border text-left font-medium transition-colors ${
                targetDataset === ds.id
                  ? 'bg-[#B69A61]/15 text-[#B69A61] border-[#B69A61]/50'
                  : 'bg-[#141414] text-[#A39E93] border-[#2B2B2B] hover:bg-[#202020]'
              }`}
            >
              {ds.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[#333333] hover:border-[#B69A61]/60 bg-[#161616] hover:bg-[#1A1A1A] p-8 rounded-lg text-center cursor-pointer transition-all space-y-3"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.json"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
          }}
          className="hidden"
        />
        <div className="w-12 h-12 rounded-full bg-[#B69A61]/10 border border-[#B69A61]/30 text-[#B69A61] flex items-center justify-center mx-auto">
          <UploadCloud className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F5F0E6]">
            {selectedFile ? selectedFile.name : 'Click or drop spreadsheet here to inspect and import'}
          </p>
          <p className="text-xs text-[#8E877C] mt-1">
            Supports XLSX, XLS, CSV, and GST Portal JSON (Files parsed client-side with zero data leakage)
          </p>
        </div>
      </div>

      {/* Workbook Inspection & Worksheet Selector */}
      {workbookInfo && (
        <div className="space-y-6 animate-in fade-in">
          {/* Worksheet Selector & Meta */}
          <div className="bg-[#1C1C1C] p-4 rounded-lg border border-[#2D2D2D] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-[#B69A61]" />
              <div>
                <h4 className="text-xs font-semibold text-[#F5F0E6]">{workbookInfo.fileName}</h4>
                <p className="text-[11px] text-[#8E877C]">
                  Detected {workbookInfo.totalRowCount} data rows • Header row index: #{workbookInfo.headerRowIndex + 1}
                </p>
              </div>
            </div>

            {workbookInfo.sheetNames.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8E877C]">Active Worksheet:</span>
                <select
                  value={activeSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="bg-[#121212] border border-[#333333] text-[#F5F0E6] text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-[#B69A61]"
                >
                  {workbookInfo.sheetNames.map((sheet) => (
                    <option key={sheet} value={sheet}>
                      {sheet}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Preset Templates */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
            <span className="text-[#8E877C] shrink-0">Auto-Map Presets:</span>
            {PRESET_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                onClick={() => applyPresetTemplate(tmpl.name)}
                className="bg-[#222222] hover:bg-[#2A2A2A] text-[#C5BDB0] hover:text-[#F5F0E6] border border-[#333333] px-2.5 py-1 rounded text-[11px] transition-colors shrink-0"
              >
                {tmpl.name}
              </button>
            ))}
          </div>

          {/* Column Mapping Grid */}
          <div className="bg-[#181818] rounded-lg border border-[#2B2B2B] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#282828] flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#F5F0E6] uppercase tracking-wider">
                Column Header Mapping Configuration
              </h3>
              <span className="text-[11px] text-[#8E877C]">
                Auto-detected {Object.keys(columnMapping).length} columns
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {MAPPING_FIELDS.map((field) => {
                const currentVal = (columnMapping as any)[field.key] || '';
                return (
                  <div key={field.key} className="bg-[#141414] p-3 rounded border border-[#262626] space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-[#F5F0E6]">
                        {field.label} {field.required && <span className="text-rose-400">*</span>}
                      </label>
                      {currentVal && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <select
                      value={currentVal}
                      onChange={(e) =>
                        setColumnMapping({
                          ...columnMapping,
                          [field.key]: e.target.value || undefined,
                        })
                      }
                      className="w-full bg-[#1C1C1C] border border-[#2D2D2D] text-[#F5F0E6] text-xs p-1.5 rounded focus:outline-none focus:border-[#B69A61]"
                    >
                      <option value="">-- Not Mapped --</option>
                      {workbookInfo.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-[#7E776C]">{field.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 50-Row Preview Grid */}
          <div className="bg-[#181818] rounded-lg border border-[#2B2B2B] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#282828] flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#F5F0E6] uppercase tracking-wider">
                First 50 Rows Preview ({activeSheet})
              </h3>
              <span className="text-[11px] text-[#8E877C]">Verbatim source data as read from file</span>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#121212] text-[#8E877C] font-mono text-[10px] uppercase sticky top-0 border-b border-[#262626]">
                  <tr>
                    <th className="py-2 px-3"># Row</th>
                    {workbookInfo.headers.map((h) => (
                      <th key={h} className="py-2 px-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242424] text-[11px] font-mono text-[#C5BDB0]">
                  {workbookInfo.previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#1E1E1E]">
                      <td className="py-1.5 px-3 text-[#706B62]">{idx + 1}</td>
                      {workbookInfo.headers.map((h) => (
                        <td key={h} className="py-1.5 px-3 whitespace-nowrap">
                          {row[h] !== undefined ? String(row[h]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Validation Warnings & Import Confirmation */}
          <div className="p-4 bg-[#1C1C1C] rounded-lg border border-[#2D2D2D] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-semibold text-[#F5F0E6]">Ready to Ingest Into Reconciliation Dataset</h4>
              <p className="text-[11px] text-[#8E877C]">
                Import will normalize invoice numbers, validate GSTIN checksums, and prepare records for matching without overwriting source values.
              </p>
            </div>

            <button
              onClick={handleConfirmImport}
              className="flex items-center justify-center gap-2 bg-[#B69A61] hover:bg-[#C8AC70] text-[#111111] font-semibold text-xs px-5 py-2.5 rounded transition-all shadow-md active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Import Records</span>
            </button>
          </div>

          {/* Import Summary Results */}
          {importSummary && (
            <div className="bg-[#161616] p-4 rounded-lg border border-emerald-900/40 text-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Import Succeeded for {targetDataset}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#1F1F1F] p-2.5 rounded border border-[#2B2B2B]">
                  <div className="text-[#8E877C] text-[10px]">Valid Imported Rows</div>
                  <div className="text-lg font-bold font-mono text-emerald-400">{importSummary.validCount}</div>
                </div>
                <div className="bg-[#1F1F1F] p-2.5 rounded border border-[#2B2B2B]">
                  <div className="text-[#8E877C] text-[10px]">Duplicate Keys Flagged</div>
                  <div className="text-lg font-bold font-mono text-amber-400">{importSummary.duplicatesCount}</div>
                </div>
                <div className="bg-[#1F1F1F] p-2.5 rounded border border-[#2B2B2B]">
                  <div className="text-[#8E877C] text-[10px]">Rejected Corrupt Rows</div>
                  <div className="text-lg font-bold font-mono text-rose-400">{importSummary.rejectedCount}</div>
                </div>
              </div>

              {importSummary.rejectedRows.length > 0 && (
                <div className="bg-[#1F1F1F] p-3 rounded border border-rose-900/40 text-[11px] space-y-1 text-rose-300">
                  <div className="font-semibold">Rejected Rows Details:</div>
                  {importSummary.rejectedRows.slice(0, 5).map((rej, i) => (
                    <div key={i}>
                      • Row #{rej.rowIndex}: {rej.reason}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={onNavigateToWorkbench}
                  className="flex items-center gap-1.5 bg-[#B69A61] hover:bg-[#C8AC70] text-[#111111] font-semibold text-xs px-4 py-2 rounded transition-all"
                >
                  <span>Go to Reconciliation Workbench</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
