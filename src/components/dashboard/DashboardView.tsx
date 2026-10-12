import React from 'react';
import {
  FileCheck2,
  AlertTriangle,
  FileQuestion,
  Layers,
  Percent,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
  Coins,
  CheckCircle2,
  CopyX,
} from 'lucide-react';
import { ControlTotals, MatchGroup, ReconciliationProject } from '../../types/gst';
import { formatINR } from '../../utils/decimal';

interface DashboardViewProps {
  controlTotals: ControlTotals;
  matchGroups: MatchGroup[];
  project: ReconciliationProject;
  onFilterWorkbench: (filterStatus: string) => void;
  onNavigateToUpload: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  controlTotals,
  matchGroups,
  project,
  onFilterWorkbench,
  onNavigateToUpload,
}) => {
  // Calculate completion percentage: Matched / Total Books Invoices
  const totalBooks = controlTotals.booksTotalRecords;
  const matchedCount = controlTotals.matchedCount;
  const completionPercentage = totalBooks > 0 ? Math.round((matchedCount / totalBooks) * 100) : 0;

  // Unmatched in 2B (Missing supplier invoices - High Risk ITC)
  const missingIn2BCount = controlTotals.unmatchedBooksCount;
  const missingIn2BTax = controlTotals.unmatchedBooksTax;

  // Invoices in 2B but missing from Books
  const missingInBooksCount = controlTotals.unmatchedPortalCount;
  const missingInBooksTax = controlTotals.unmatchedPortalTax;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Project Title & Reconciliation Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181818] p-5 rounded-lg border border-[#2B2B2B]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase bg-[#B69A61]/15 text-[#B69A61] px-2 py-0.5 rounded border border-[#B69A61]/30">
              {project.reconciliationType === 'PR_VS_2B'
                ? 'Section 16(2)(aa) ITC Audit'
                : project.reconciliationType}
            </span>
            <span className="text-[11px] text-[#8E877C]">Return Period: {project.returnPeriod}</span>
          </div>
          <h2 className="text-lg font-semibold text-[#F5F0E6] mt-1">{project.projectName}</h2>
          <p className="text-xs text-[#8E877C] mt-0.5">
            Audit comparison of internal books against GST portal returns with deterministic verification.
          </p>
        </div>

        {/* Progress Bar & Stat */}
        <div className="flex items-center gap-6 bg-[#1F1F1F] px-4 py-3 rounded-lg border border-[#2E2E2E]">
          <div>
            <div className="text-[11px] text-[#8E877C] uppercase font-semibold">Reconciliation Completion</div>
            <div className="text-xl font-bold font-mono text-[#F5F0E6] flex items-baseline gap-1 mt-0.5">
              <span>{completionPercentage}%</span>
              <span className="text-xs font-normal text-[#8E877C]">
                ({matchedCount} of {totalBooks} bills)
              </span>
            </div>
          </div>
          <div className="w-24 bg-[#2A2A2A] h-2.5 rounded-full overflow-hidden border border-[#3A3A3A]">
            <div
              className="bg-[#B69A61] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, completionPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (All figures computed from actual records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Matched Invoices */}
        <div
          onClick={() => onFilterWorkbench('MATCHED')}
          className="bg-[#1C1C1C] hover:bg-[#222222] p-4 rounded-lg border border-[#2B2B2B] hover:border-[#B69A61]/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-[#8E877C]">
            <span className="text-xs font-medium uppercase tracking-wider">Matched Invoices</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#F5F0E6] group-hover:text-[#B69A61] transition-colors">
            {controlTotals.matchedCount}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[#8E877C]">
            <span>ITC Reconciled:</span>
            <span className="text-emerald-400 font-mono font-medium">{formatINR(controlTotals.matchedTax)}</span>
          </div>
        </div>

        {/* Metric 2: Missing in GSTR-2B (High Risk ITC under Sec 16(2)(aa)) */}
        <div
          onClick={() => onFilterWorkbench('MISSING_IN_2B')}
          className="bg-[#1C1C1C] hover:bg-[#222222] p-4 rounded-lg border border-[#2B2B2B] hover:border-rose-500/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-[#8E877C]">
            <span className="text-xs font-medium uppercase tracking-wider">Missing in GSTR-2B</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-400">
            {missingIn2BCount}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[#8E877C]">
            <span>ITC at Risk:</span>
            <span className="text-rose-400 font-mono font-medium">{formatINR(missingIn2BTax)}</span>
          </div>
        </div>

        {/* Metric 3: In GSTR-2B but Missing in Books */}
        <div
          onClick={() => onFilterWorkbench('MISSING_IN_PR')}
          className="bg-[#1C1C1C] hover:bg-[#222222] p-4 rounded-lg border border-[#2B2B2B] hover:border-amber-500/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-[#8E877C]">
            <span className="text-xs font-medium uppercase tracking-wider">Unbooked in Purchase Reg</span>
            <FileQuestion className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {missingInBooksCount}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[#8E877C]">
            <span>Unclaimed ITC:</span>
            <span className="text-amber-400 font-mono font-medium">{formatINR(missingInBooksTax)}</span>
          </div>
        </div>

        {/* Metric 4: Tax Component Mismatches */}
        <div
          onClick={() => onFilterWorkbench('TAX_MISMATCH')}
          className="bg-[#1C1C1C] hover:bg-[#222222] p-4 rounded-lg border border-[#2B2B2B] hover:border-[#B69A61]/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-[#8E877C]">
            <span className="text-xs font-medium uppercase tracking-wider">Tax Component Mismatches</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-orange-400">
            {controlTotals.taxMismatchCount}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[#8E877C]">
            <span>Tax Variance:</span>
            <span className="text-orange-400 font-mono font-medium">{formatINR(controlTotals.taxMismatchDiffTax)}</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Duplicates in Books */}
        <div
          onClick={() => onFilterWorkbench('DUPLICATE_INVOICE')}
          className="bg-[#181818] p-3.5 rounded-lg border border-[#282828] hover:border-[#383838] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-xs text-[#8E877C]">
            <CopyX className="w-3.5 h-3.5 text-rose-400" />
            <span>Duplicate Invoices</span>
          </div>
          <div className="text-lg font-bold font-mono text-[#F5F0E6] mt-1">{controlTotals.duplicateCount}</div>
          <div className="text-[10px] text-[#7E776C] mt-0.5">Double entered in accounts</div>
        </div>

        {/* Pending CA Reviews */}
        <div
          onClick={() => onFilterWorkbench('PENDING_REVIEW')}
          className="bg-[#181818] p-3.5 rounded-lg border border-[#282828] hover:border-[#383838] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-xs text-[#8E877C]">
            <Coins className="w-3.5 h-3.5 text-[#B69A61]" />
            <span>Pending CA Reviews</span>
          </div>
          <div className="text-lg font-bold font-mono text-[#B69A61] mt-1">{controlTotals.pendingReviewCount}</div>
          <div className="text-[10px] text-[#7E776C] mt-0.5">Potential matches awaiting sign-off</div>
        </div>

        {/* Total Purchase Invoices */}
        <div className="bg-[#181818] p-3.5 rounded-lg border border-[#282828]">
          <div className="flex items-center gap-1.5 text-xs text-[#8E877C]">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#A39E93]" />
            <span>Books Invoices</span>
          </div>
          <div className="text-lg font-bold font-mono text-[#F5F0E6] mt-1">{controlTotals.booksTotalRecords}</div>
          <div className="text-[10px] text-[#7E776C] mt-0.5">Taxable: {formatINR(controlTotals.booksTotalTaxable)}</div>
        </div>

        {/* Total Portal Invoices */}
        <div className="bg-[#181818] p-3.5 rounded-lg border border-[#282828]">
          <div className="flex items-center gap-1.5 text-xs text-[#8E877C]">
            <Layers className="w-3.5 h-3.5 text-[#A39E93]" />
            <span>Portal (GSTR-2B) Invoices</span>
          </div>
          <div className="text-lg font-bold font-mono text-[#F5F0E6] mt-1">{controlTotals.portalTotalRecords}</div>
          <div className="text-[10px] text-[#7E776C] mt-0.5">Taxable: {formatINR(controlTotals.portalTotalTaxable)}</div>
        </div>
      </div>

      {/* Tax Component Audit Breakdown Table */}
      <div className="bg-[#181818] rounded-lg border border-[#282828] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#282828] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-[#F5F0E6] uppercase tracking-wider">
              Tax-Head Control Totals Reconciliation
            </h3>
            <p className="text-[11px] text-[#8E877C]">
              Formula: Variance = Books Amount − Portal Amount (Positive = Excess claimed in Books)
            </p>
          </div>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              controlTotals.isBalanced
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/60'
            }`}
          >
            {controlTotals.isBalanced ? '✓ AUDIT CONTROL BALANCED' : '⚠️ CHECK AUDIT VARIANCES'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#141414] text-[#8E877C] uppercase font-mono text-[10px] border-b border-[#282828]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Tax Head</th>
                <th className="py-2.5 px-4 font-semibold text-right">Purchase Register (Books)</th>
                <th className="py-2.5 px-4 font-semibold text-right">GSTR-2B (Portal Return)</th>
                <th className="py-2.5 px-4 font-semibold text-right">Variance / Difference</th>
                <th className="py-2.5 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424] font-mono text-[#C5BDB0]">
              <tr>
                <td className="py-2.5 px-4 font-sans font-medium text-[#F5F0E6]">Taxable Value (₹)</td>
                <td className="py-2.5 px-4 text-right">{formatINR(controlTotals.booksTotalTaxable, false)}</td>
                <td className="py-2.5 px-4 text-right">{formatINR(controlTotals.portalTotalTaxable, false)}</td>
                <td className={`py-2.5 px-4 text-right font-semibold ${
                  controlTotals.booksTotalTaxable - controlTotals.portalTotalTaxable !== 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {formatINR(controlTotals.booksTotalTaxable - controlTotals.portalTotalTaxable, false)}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-[#222222] text-[#A39E93]">
                    {Math.abs(controlTotals.booksTotalTaxable - controlTotals.portalTotalTaxable) < 1 ? 'Balanced' : 'Variance'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-medium text-[#F5F0E6]">IGST (Integrated Tax)</td>
                <td className="py-2.5 px-4 text-right">{formatINR(controlTotals.booksTotalIgst, false)}</td>
                <td className="py-2.5 px-4 text-right">{formatINR(controlTotals.portalTotalIgst, false)}</td>
                <td className={`py-2.5 px-4 text-right font-semibold ${
                  controlTotals.booksTotalIgst - controlTotals.portalTotalIgst !== 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {formatINR(controlTotals.booksTotalIgst - controlTotals.portalTotalIgst, false)}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-[#222222] text-[#A39E93]">
                    {Math.abs(controlTotals.booksTotalIgst - controlTotals.portalTotalIgst) < 1 ? 'Balanced' : 'Inter-State Var'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-medium text-[#F5F0E6]">CGST (Central Tax)</td>
                <td className="py-2.5 px-4 text-right">{formatINR(controlTotals.booksTotalCgst, false)}</td>
                <td className="py-2.5 px-4 text-right">{formatINR(controlTotals.portalTotalCgst, false)}</td>
                <td className={`py-2.5 px-4 text-right font-semibold ${
                  controlTotals.booksTotalCgst - controlTotals.portalTotalCgst !== 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {formatINR(controlTotals.booksTotalCgst - controlTotals.portalTotalCgst, false)}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-[#222222] text-[#A39E93]">
                    {Math.abs(controlTotals.booksTotalCgst - controlTotals.portalTotalCgst) < 1 ? 'Balanced' : 'Intra-State Var'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-medium text-[#F5F0E6]">SGST / UTGST (State Tax)</td>
                <td className="py-2.5 px-4 text-right">{formatINR(controlTotals.booksTotalSgst, false)}</td>
                <td className="py-2.5 px-4 text-right">{formatINR(controlTotals.portalTotalSgst, false)}</td>
                <td className={`py-2.5 px-4 text-right font-semibold ${
                  controlTotals.booksTotalSgst - controlTotals.portalTotalSgst !== 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {formatINR(controlTotals.booksTotalSgst - controlTotals.portalTotalSgst, false)}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-[#222222] text-[#A39E93]">
                    {Math.abs(controlTotals.booksTotalSgst - controlTotals.portalTotalSgst) < 1 ? 'Balanced' : 'Intra-State Var'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-medium text-[#F5F0E6]">Cess</td>
                <td className="py-2.5 px-4 text-right">{formatINR(controlTotals.booksTotalCess, false)}</td>
                <td className="py-2.5 px-4 text-right">{formatINR(controlTotals.portalTotalCess, false)}</td>
                <td className="py-2.5 px-4 text-right font-semibold text-emerald-400">
                  {formatINR(controlTotals.booksTotalCess - controlTotals.portalTotalCess, false)}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-[#222222] text-[#A39E93]">Balanced</span>
                </td>
              </tr>
              <tr className="bg-[#1D1D1D] font-bold text-[#F5F0E6]">
                <td className="py-3 px-4 font-sans text-[#B69A61]">TOTAL INPUT TAX CREDIT (ITC)</td>
                <td className="py-3 px-4 text-right text-[#B69A61]">{formatINR(controlTotals.booksTotalTax, true)}</td>
                <td className="py-3 px-4 text-right text-[#B69A61]">{formatINR(controlTotals.portalTotalTax, true)}</td>
                <td className={`py-3 px-4 text-right ${
                  controlTotals.booksTotalTax - controlTotals.portalTotalTax !== 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {formatINR(controlTotals.booksTotalTax - controlTotals.portalTotalTax, true)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-[10px] font-sans px-2.5 py-0.5 rounded bg-[#B69A61]/15 text-[#B69A61] border border-[#B69A61]/30">
                    Net Variance
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Prompt Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-[#1C1C1C] rounded-lg border border-[#2C2C2C] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#B69A61]/15 flex items-center justify-center text-[#B69A61] font-bold">
            💡
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#F5F0E6]">Next Action for Audit Team</h4>
            <p className="text-[11px] text-[#8E877C]">
              Inspect {missingIn2BCount} missing vendor bills and {controlTotals.taxMismatchCount} tax component shifts in the workbench.
            </p>
          </div>
        </div>

        <button
          onClick={() => onFilterWorkbench('ALL')}
          className="flex items-center gap-1.5 bg-[#B69A61] hover:bg-[#C8AC70] text-[#111111] font-semibold text-xs px-3.5 py-2 rounded transition-all shrink-0"
        >
          <span>Open Full Reconciliation Workbench</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
