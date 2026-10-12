import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Table,
  Layers,
  ShieldCheck,
  Building,
} from 'lucide-react';
import {
  AuditTrailEntry,
  ClientProfile,
  ControlTotals,
  MatchGroup,
  ReconciliationProject,
} from '../../types/gst';
import {
  exportReconciliationToCSV,
  exportReconciliationToExcel,
} from '../../services/excelExportService';

interface ExportReportsViewProps {
  project: ReconciliationProject;
  client: ClientProfile;
  controlTotals: ControlTotals;
  matchGroups: MatchGroup[];
  auditLog: AuditTrailEntry[];
}

export const ExportReportsView: React.FC<ExportReportsViewProps> = ({
  project,
  client,
  controlTotals,
  matchGroups,
  auditLog,
}) => {
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleDownloadExcel = () => {
    setIsExportingExcel(true);
    try {
      exportReconciliationToExcel(project, client, controlTotals, matchGroups, auditLog);
    } catch (err: any) {
      console.error(err);
      alert('Error exporting Excel: ' + err.message);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const reportsList = [
    {
      id: 'summary',
      title: 'Sheet 1: Audit Summary & Control Totals',
      description: 'Executive dashboard totals, formula definitions, and reconciled status control checks.',
    },
    {
      id: 'matched',
      title: 'Sheet 2: Matched Invoices Register',
      description: 'All exact and near-matched invoices with dates, amounts, and match rule references.',
    },
    {
      id: 'unmatched_books',
      title: 'Sheet 3: Unmatched in Books (Missing in GSTR-2B)',
      description: 'High risk invoices claimed in accounts where vendor failed to file GSTR-1. Ineligible under Sec 16(2)(aa).',
    },
    {
      id: 'unmatched_portal',
      title: 'Sheet 4: Missing in Purchase Register (2B Only)',
      description: 'Inward supplies reflected on portal but not booked in accounting records. Potential unbooked purchases.',
    },
    {
      id: 'tax_mismatches',
      title: 'Sheet 5: Tax Component Mismatch Register',
      description: 'Detailed discrepancies across Taxable Value, IGST, CGST, SGST, and Cess with direction formulas.',
    },
    {
      id: 'duplicates',
      title: 'Sheet 6: Duplicate Invoices Register',
      description: 'Duplicate bill keys punched multiple times in ERP purchase registers.',
    },
    {
      id: 'gstin_summary',
      title: 'Sheet 7: GSTIN-wise Counterparty Summary',
      description: 'Aggregated invoice counts, taxable amounts, and tax differences grouped by supplier GSTIN.',
    },
    {
      id: 'period_summary',
      title: 'Sheet 8: Return Period-wise Breakdown',
      description: 'Monthly and quarterly tax breakdowns with cross-period reflection variance analysis.',
    },
    {
      id: 'audit_trail',
      title: 'Sheet 9: Immutable Audit Trail & Maker-Checker Log',
      description: 'Timestamped log of imports, manual matches, AI analyses, and partner sign-off records.',
    },
    {
      id: 'methodology',
      title: 'Sheet 10: Statutory Methodology & Assumptions',
      description: 'Statutory citations (Section 16(2), Section 38, Rule 36(4)) and banker-grade rounding rules.',
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-[#181818] p-5 rounded-lg border border-[#2B2B2B]">
        <div className="flex items-center gap-2 text-xs text-[#B69A61] font-mono uppercase">
          <span>Module 13</span>
          <span>•</span>
          <span>Downloadable CA Audit Reports & Workpapers</span>
        </div>
        <h2 className="text-lg font-semibold text-[#F5F0E6] mt-1">Audit Report Workpaper Generator</h2>
        <p className="text-xs text-[#8E877C] mt-0.5">
          Generate professional multi-sheet Excel workbooks formatted for statutory audit files, tax filings, and client management presentation.
        </p>
      </div>

      {/* Main Download Callout */}
      <div className="bg-[#1C1C1C] p-6 rounded-lg border border-[#2D2D2D] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#F5F0E6]">Complete 10-Sheet Audit Reconciliation Workbook</span>
            <span className="text-[10px] font-mono text-[#B69A61] bg-[#B69A61]/15 px-2 py-0.5 rounded border border-[#B69A61]/30">
              .XLSX FORMAT
            </span>
          </div>
          <p className="text-xs text-[#8E877C]">
            Includes all matched registers, variance breakdowns, vendor-wise summaries, and methodology notes.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-[#A39E93] pt-1 font-mono">
            <span>Client: {client.gstin}</span>
            <span>•</span>
            <span>FY: {project.financialYear}</span>
            <span>•</span>
            <span>Total Bills: {controlTotals.booksTotalRecords + controlTotals.portalTotalRecords}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => exportReconciliationToCSV(matchGroups, `GST_Recon_${client.gstin}`)}
            className="flex items-center gap-2 bg-[#252525] hover:bg-[#2F2F2F] text-[#F5F0E6] border border-[#383838] px-4 py-2.5 rounded text-xs transition-colors font-medium"
          >
            <FileText className="w-4 h-4 text-[#B69A61]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            disabled={isExportingExcel}
            className="flex items-center gap-2 bg-[#B69A61] hover:bg-[#C8AC70] text-[#111111] font-semibold px-5 py-2.5 rounded text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExportingExcel ? 'Generating Workbook...' : 'Download Full 10-Sheet Excel'}</span>
          </button>
        </div>
      </div>

      {/* Worksheets Manifest Table */}
      <div className="bg-[#181818] rounded-lg border border-[#282828] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#282828] flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[#F5F0E6] uppercase tracking-wider">
            Excel Workbook Structure & Sheet Contents
          </h3>
          <span className="text-[11px] text-[#8E877C]">Compliant with ICAI Guidance Note on GST Audit</span>
        </div>

        <div className="divide-y divide-[#242424]">
          {reportsList.map((r, i) => (
            <div key={r.id} className="p-4 flex items-start gap-4 hover:bg-[#1E1E1E] transition-colors">
              <div className="w-7 h-7 rounded bg-[#242424] text-[#B69A61] flex items-center justify-center font-mono text-xs font-semibold shrink-0">
                {i + 1}
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-[#F5F0E6]">{r.title}</h4>
                <p className="text-[11px] text-[#8E877C]">{r.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
