import * as XLSX from 'xlsx';
import {
  AuditTrailEntry,
  ClientProfile,
  ControlTotals,
  MatchGroup,
  ReconciliationProject,
} from '../types/gst';
import { calculateGstinSummary, calculatePeriodSummary } from './controlTotalsService';
import { formatDisplayDate } from '../utils/gstValidator';
import { formatINR } from '../utils/decimal';

export const exportReconciliationToExcel = (
  project: ReconciliationProject,
  client: ClientProfile,
  controlTotals: ControlTotals,
  matchGroups: MatchGroup[],
  auditLog: AuditTrailEntry[]
) => {
  const wb = XLSX.utils.book_new();

  // ==========================================
  // SHEET 1: Summary & Control Totals
  // ==========================================
  const summaryRows = [
    ['GST RECONCILIATION PRO - AUDIT SUMMARY & CONTROL TOTALS'],
    ['Generated On', new Date().toLocaleString('en-IN')],
    ['Client Legal Name', client.legalName],
    ['Trade Name', client.tradeName || '-'],
    ['Client GSTIN', client.gstin],
    ['State', `${client.stateCode} - ${client.stateName}`],
    ['Reconciliation Type', project.reconciliationType],
    ['Financial Year', project.financialYear],
    ['Return Period', project.returnPeriod],
    ['Project Status', project.status],
    ['Prepared By', project.makerChecker.preparedBy],
    ['Reviewed By', project.makerChecker.reviewedBy || 'Pending'],
    ['Approved By', project.makerChecker.approvedBy || 'Pending'],
    [],
    ['METRIC / HEAD', 'BOOKS (PURCHASE REGISTER)', 'PORTAL (GSTR-2B / 2A)', 'VARIANCE (BOOKS - PORTAL)'],
    ['Total Invoices Count', controlTotals.booksTotalRecords, controlTotals.portalTotalRecords, controlTotals.booksTotalRecords - controlTotals.portalTotalRecords],
    ['Total Taxable Value (₹)', controlTotals.booksTotalTaxable, controlTotals.portalTotalTaxable, controlTotals.booksTotalTaxable - controlTotals.portalTotalTaxable],
    ['Total IGST (₹)', controlTotals.booksTotalIgst, controlTotals.portalTotalIgst, controlTotals.booksTotalIgst - controlTotals.portalTotalIgst],
    ['Total CGST (₹)', controlTotals.booksTotalCgst, controlTotals.portalTotalCgst, controlTotals.booksTotalCgst - controlTotals.portalTotalCgst],
    ['Total SGST / UTGST (₹)', controlTotals.booksTotalSgst, controlTotals.portalTotalSgst, controlTotals.booksTotalSgst - controlTotals.portalTotalSgst],
    ['Total Cess (₹)', controlTotals.booksTotalCess, controlTotals.portalTotalCess, controlTotals.booksTotalCess - controlTotals.portalTotalCess],
    ['Total ITC / Tax Amount (₹)', controlTotals.booksTotalTax, controlTotals.portalTotalTax, controlTotals.booksTotalTax - controlTotals.portalTotalTax],
    ['Total Gross Invoice Value (₹)', controlTotals.booksTotalValue, controlTotals.portalTotalValue, controlTotals.booksTotalValue - controlTotals.portalTotalValue],
    [],
    ['RECONCILIATION STATUS BREAKDOWN', 'COUNT', 'TAXABLE AMOUNT (₹)', 'TAX AMOUNT (₹)'],
    ['Matched Invoices (Exact & Near)', controlTotals.matchedCount, controlTotals.matchedTaxable, controlTotals.matchedTax],
    ['Unmatched in Books (In GSTR-2B only)', controlTotals.unmatchedPortalCount, controlTotals.unmatchedPortalTaxable, controlTotals.unmatchedPortalTax],
    ['Unmatched in Portal (Books only - Ineligible under Sec 16(2)(aa))', controlTotals.unmatchedBooksCount, controlTotals.unmatchedBooksTaxable, controlTotals.unmatchedBooksTax],
    ['Tax Component Mismatches', controlTotals.taxMismatchCount, '-', controlTotals.taxMismatchDiffTax],
    ['Duplicate Bills in Books', controlTotals.duplicateCount, '-', '-'],
    ['Pending Manual CA Reviews', controlTotals.pendingReviewCount, '-', '-'],
    ['Control Totals Balanced?', controlTotals.isBalanced ? 'YES - RECONCILED' : 'WARNING - CHECK VARIANCES', '-', '-'],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Audit_Summary');

  // Helper to map MatchGroups to standard Excel table rows
  const mapGroupToRow = (g: MatchGroup) => ({
    'Match Group ID': g.id,
    'Status': g.matchStatus,
    'Supplier GSTIN': g.booksRecord?.supplierGstin || g.portalRecord?.supplierGstin || '',
    'Supplier Name': g.booksRecord?.supplierName || g.portalRecord?.supplierName || '',
    'Books Invoice No': g.booksRecord?.invoiceNumber || '-',
    'Portal Invoice No': g.portalRecord?.invoiceNumber || '-',
    'Books Date': formatDisplayDate(g.booksRecord?.invoiceDate),
    'Portal Date': formatDisplayDate(g.portalRecord?.invoiceDate),
    'Date Diff (Days)': g.dateDiffDays ?? '-',
    'Books Taxable (₹)': g.booksRecord?.taxableValue ?? 0,
    'Portal Taxable (₹)': g.portalRecord?.taxableValue ?? 0,
    'Taxable Diff (₹)': g.diffTaxable,
    'Books IGST (₹)': g.booksRecord?.igst ?? 0,
    'Portal IGST (₹)': g.portalRecord?.igst ?? 0,
    'Diff IGST (₹)': g.diffIgst,
    'Books CGST (₹)': g.booksRecord?.cgst ?? 0,
    'Portal CGST (₹)': g.portalRecord?.cgst ?? 0,
    'Diff CGST (₹)': g.diffCgst,
    'Books SGST (₹)': g.booksRecord?.sgst ?? 0,
    'Portal SGST (₹)': g.portalRecord?.sgst ?? 0,
    'Diff SGST (₹)': g.diffSgst,
    'Books Cess (₹)': g.booksRecord?.cess ?? 0,
    'Portal Cess (₹)': g.portalRecord?.cess ?? 0,
    'Diff Cess (₹)': g.diffCess,
    'Matching Rule / Reason': g.matchingRuleApplied,
    'Review Status': g.reviewStatus,
    'Review Notes': g.reviewNotes || '',
    'Books File & Row': g.booksRecord ? `${g.booksRecord.sourceFileName} (Row ${g.booksRecord.sourceRowNumber})` : '-',
    'Portal File & Row': g.portalRecord ? `${g.portalRecord.sourceFileName} (Row ${g.portalRecord.sourceRowNumber})` : '-',
  });

  // ==========================================
  // SHEET 2: Matched Invoices
  // ==========================================
  const matchedGroups = matchGroups.filter(
    (g) =>
      g.matchStatus === 'EXACT_MATCH' ||
      g.matchStatus === 'MATCHED_NORMALIZED_INV' ||
      g.matchStatus === 'MATCHED_DATE_DIFF' ||
      g.matchStatus === 'MATCHED_ROUNDING_DIFF' ||
      g.matchStatus === 'MANUAL_MATCHED'
  );
  const wsMatched = XLSX.utils.json_to_sheet(matchedGroups.map(mapGroupToRow));
  XLSX.utils.book_append_sheet(wb, wsMatched, 'Matched_Invoices');

  // ==========================================
  // SHEET 3: Unmatched in Portal (Books only - ITC at risk)
  // ==========================================
  const unmatchedBooks = matchGroups.filter(
    (g) =>
      g.matchStatus === 'MISSING_IN_2B' ||
      g.matchStatus === 'MISSING_IN_2A' ||
      g.matchStatus === 'MISSING_IN_3B'
  );
  const wsUnmatchedBooks = XLSX.utils.json_to_sheet(unmatchedBooks.map(mapGroupToRow));
  XLSX.utils.book_append_sheet(wb, wsUnmatchedBooks, 'Unmatched_In_Books');

  // ==========================================
  // SHEET 4: Invoices Missing in Books (Portal only)
  // ==========================================
  const unmatchedPortal = matchGroups.filter((g) => g.matchStatus === 'MISSING_IN_PR');
  const wsUnmatchedPortal = XLSX.utils.json_to_sheet(unmatchedPortal.map(mapGroupToRow));
  XLSX.utils.book_append_sheet(wb, wsUnmatchedPortal, 'Missing_In_Books');

  // ==========================================
  // SHEET 5: Tax Mismatches
  // ==========================================
  const taxMismatches = matchGroups.filter(
    (g) =>
      g.matchStatus === 'TAXABLE_VALUE_MISMATCH' ||
      g.matchStatus === 'IGST_MISMATCH' ||
      g.matchStatus === 'CGST_MISMATCH' ||
      g.matchStatus === 'SGST_MISMATCH' ||
      g.matchStatus === 'CESS_MISMATCH'
  );
  const wsTaxMismatches = XLSX.utils.json_to_sheet(taxMismatches.map(mapGroupToRow));
  XLSX.utils.book_append_sheet(wb, wsTaxMismatches, 'Tax_Mismatches');

  // ==========================================
  // SHEET 6: Duplicate Invoices
  // ==========================================
  const duplicates = matchGroups.filter((g) => g.matchStatus === 'DUPLICATE_INVOICE');
  const wsDuplicates = XLSX.utils.json_to_sheet(duplicates.map(mapGroupToRow));
  XLSX.utils.book_append_sheet(wb, wsDuplicates, 'Duplicate_Invoices');

  // ==========================================
  // SHEET 7: GSTIN-wise Supplier Summary
  // ==========================================
  const gstinSummary = calculateGstinSummary(matchGroups);
  const wsGstin = XLSX.utils.json_to_sheet(
    gstinSummary.map((s) => ({
      'Supplier GSTIN': s.gstin,
      'Supplier Name': s.supplierName,
      'Total Bills': s.totalInvoices,
      'Matched Count': s.matchedCount,
      'Unmatched Count': s.unmatchedCount,
      'Tax Mismatches': s.taxMismatchCount,
      'Books Taxable (₹)': s.booksTaxable,
      'Portal Taxable (₹)': s.portalTaxable,
      'Books Tax (₹)': s.booksTax,
      'Portal Tax (₹)': s.portalTax,
      'Net Tax Difference (₹)': s.taxDifference,
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsGstin, 'GSTIN_Summary');

  // ==========================================
  // SHEET 8: Period-wise Summary
  // ==========================================
  const periodSummary = calculatePeriodSummary(matchGroups);
  const wsPeriod = XLSX.utils.json_to_sheet(
    periodSummary.map((p) => ({
      'Return Period': p.period,
      'Invoice Count': p.invoiceCount,
      'Books Taxable (₹)': p.booksTaxable,
      'Portal Taxable (₹)': p.portalTaxable,
      'Books Tax (₹)': p.booksTax,
      'Portal Tax (₹)': p.portalTax,
      'Net Tax Difference (₹)': p.netDifference,
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsPeriod, 'Period_Summary');

  // ==========================================
  // SHEET 9: Audit Trail & Maker-Checker Log
  // ==========================================
  const wsAudit = XLSX.utils.json_to_sheet(
    auditLog.map((a) => ({
      'Timestamp': a.timestamp,
      'User': a.userName,
      'Category': a.category,
      'Action': a.action,
      'Details': a.details,
    }))
  );
  XLSX.utils.book_append_sheet(wb, wsAudit, 'Audit_Trail');

  // ==========================================
  // SHEET 10: Methodology & Assumptions
  // ==========================================
  const methodologyRows = [
    ['GST RECONCILIATION PRO - METHODOLOGY & STATUTORY FRAMEWORK'],
    [],
    ['1. Legal Grounding', 'Section 16(2)(aa) of CGST Act requires ITC to be availed only if invoice details have been furnished by supplier in GSTR-1 and communicated in GSTR-2B.'],
    ['2. Difference Formula', 'Variance = Books (Purchase Register) Value minus Portal (GSTR-2B / GSTR-2A) Value. Positive variance indicates excess booked in accounts over portal.'],
    ['3. Decimal Arithmetic', 'All arithmetic uses round2() banker-grade decimal operations to prevent IEEE 754 floating-point artifacts.'],
    ['4. Invoice Normalization', 'Leading/trailing whitespace and punctuation (/ - .) are stripped for fuzzy matching while retaining verbatim text for audit reporting.'],
    ['5. AI-Assisted Explanations', 'AI observations are diagnostic aids based solely on uploaded facts and do not constitute autonomous statutory adjudication.'],
    ['6. Maker-Checker Controls', 'Prepared and reviewed by authorized chartered accountancy staff prior to client sign-off.'],
  ];
  const wsMethodology = XLSX.utils.aoa_to_sheet(methodologyRows);
  XLSX.utils.book_append_sheet(wb, wsMethodology, 'Methodology_&_Notes');

  // Trigger download in browser
  const fileName = `GST_Recon_${client.gstin}_${project.financialYear}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const exportReconciliationToCSV = (matchGroups: MatchGroup[], filenamePrefix: string) => {
  const rows = matchGroups.map((g) => ({
    'Match_Group_ID': g.id,
    'Status': g.matchStatus,
    'Supplier_GSTIN': g.booksRecord?.supplierGstin || g.portalRecord?.supplierGstin || '',
    'Supplier_Name': g.booksRecord?.supplierName || g.portalRecord?.supplierName || '',
    'Books_Invoice_No': g.booksRecord?.invoiceNumber || '',
    'Portal_Invoice_No': g.portalRecord?.invoiceNumber || '',
    'Books_Date': g.booksRecord?.invoiceDate || '',
    'Portal_Date': g.portalRecord?.invoiceDate || '',
    'Books_Taxable': g.booksRecord?.taxableValue ?? 0,
    'Portal_Taxable': g.portalRecord?.taxableValue ?? 0,
    'Diff_Taxable': g.diffTaxable,
    'Books_IGST': g.booksRecord?.igst ?? 0,
    'Portal_IGST': g.portalRecord?.igst ?? 0,
    'Diff_IGST': g.diffIgst,
    'Books_CGST': g.booksRecord?.cgst ?? 0,
    'Portal_CGST': g.portalRecord?.cgst ?? 0,
    'Diff_CGST': g.diffCgst,
    'Books_SGST': g.booksRecord?.sgst ?? 0,
    'Portal_SGST': g.portalRecord?.sgst ?? 0,
    'Diff_SGST': g.diffSgst,
    'Matching_Rule': g.matchingRuleApplied,
    'Review_Status': g.reviewStatus,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const csvData = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
