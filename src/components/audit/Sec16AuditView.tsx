import React from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  FileText,
  Clock,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';
import { ControlTotals, MatchGroup, ReconciliationProject } from '../../types/gst';
import { formatINR } from '../../utils/decimal';
import { formatDisplayDate } from '../../utils/gstValidator';

interface Sec16AuditViewProps {
  controlTotals: ControlTotals;
  matchGroups: MatchGroup[];
  project: ReconciliationProject;
  onFilterWorkbench: (filter: string) => void;
}

export const Sec16AuditView: React.FC<Sec16AuditViewProps> = ({
  controlTotals,
  matchGroups,
  project,
  onFilterWorkbench,
}) => {
  // Unmatched in GSTR-2B (In Books only - Section 16(2)(aa) risk)
  const missingIn2BGroups = matchGroups.filter((g) => g.matchStatus === 'MISSING_IN_2B');
  const missingIn2BTax = controlTotals.unmatchedBooksTax;

  // Unbooked in Books (GSTR-2B only)
  const missingInBooksGroups = matchGroups.filter((g) => g.matchStatus === 'MISSING_IN_PR');
  const missingInBooksTax = controlTotals.unmatchedPortalTax;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-[#181818] p-5 rounded-lg border border-[#2B2B2B]">
        <div className="flex items-center gap-2 text-xs text-[#B69A61] font-mono uppercase">
          <span>Statutory ITC Audit Module</span>
          <span>•</span>
          <span>CGST Act Section 16(2)(aa) & Rule 36(4) Compliance</span>
        </div>
        <h2 className="text-lg font-semibold text-[#F5F0E6] mt-1">
          Input Tax Credit (ITC) Statutory Admissibility Audit
        </h2>
        <p className="text-xs text-[#8E877C] mt-0.5">
          Finance Act 2021 amended Section 16(2) inserting clause (aa): No registered person shall be entitled to the credit of any input tax unless invoice details have been furnished by the supplier in GSTR-1 and communicated in Form GSTR-2B.
        </p>
      </div>

      {/* Statutory Risk Assessment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Risk Card 1: ITC Inadmissible under 16(2)(aa) */}
        <div className="bg-[#1C1C1C] p-4 rounded-lg border border-rose-900/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              High Risk: Missing in GSTR-2B
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-300">
            {formatINR(missingIn2BTax)}
          </div>
          <p className="text-[11px] text-[#A39E93]">
            {missingIn2BGroups.length} invoices booked in accounts but not uploaded by vendor. Claiming this in GSTR-3B invites automatic scrutiny notice under Form GST DRC-01B.
          </p>
          <button
            onClick={() => onFilterWorkbench('MISSING_IN_2B')}
            className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium pt-1"
          >
            <span>Inspect {missingIn2BGroups.length} defaulted vendor bills</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Risk Card 2: Eligible & Safe Reconciled ITC */}
        <div className="bg-[#1C1C1C] p-4 rounded-lg border border-emerald-900/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Statutorily Safe Matched ITC
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {formatINR(controlTotals.matchedTax)}
          </div>
          <p className="text-[11px] text-[#A39E93]">
            {controlTotals.matchedCount} invoices verified in both Books & GSTR-2B. Complies with Section 16(2)(a), (aa), and (c) conditions for claim in Table 4(A)(5).
          </p>
          <button
            onClick={() => onFilterWorkbench('MATCHED')}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium pt-1"
          >
            <span>View {controlTotals.matchedCount} matched invoices</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Risk Card 3: Unclaimed Inward Supplies in 2B */}
        <div className="bg-[#1C1C1C] p-4 rounded-lg border border-amber-900/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Unclaimed Credit (In 2B Only)
            </span>
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {formatINR(missingInBooksTax)}
          </div>
          <p className="text-[11px] text-[#A39E93]">
            {missingInBooksGroups.length} vendor invoices filed on portal but missing in accounts. Potential unbooked expense or missed credit before 30th November deadline.
          </p>
          <button
            onClick={() => onFilterWorkbench('MISSING_IN_PR')}
            className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium pt-1"
          >
            <span>Review unbooked bills</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Critical Defaulted Supplier Register */}
      <div className="bg-[#181818] rounded-lg border border-[#282828] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#282828] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-[#F5F0E6] uppercase tracking-wider">
              Defaulted Vendor Register (Section 16(2)(aa) Non-Compliant)
            </h3>
            <p className="text-[11px] text-[#8E877C]">
              Invoices where supplier failed to furnish GSTR-1 or file tax returns
            </p>
          </div>
          <span className="text-[10px] font-mono bg-rose-950/60 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded">
            {missingIn2BGroups.length} Defaulted Invoices
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#121212] text-[#8E877C] font-mono text-[10px] uppercase border-b border-[#282828]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Supplier GSTIN</th>
                <th className="py-2.5 px-4 font-semibold">Supplier Legal Name</th>
                <th className="py-2.5 px-4 font-semibold">Invoice No</th>
                <th className="py-2.5 px-4 font-semibold">Invoice Date</th>
                <th className="py-2.5 px-4 font-semibold text-right">Taxable Value (₹)</th>
                <th className="py-2.5 px-4 font-semibold text-right">Disallowed Tax (₹)</th>
                <th className="py-2.5 px-4 font-semibold text-center">Statutory Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424] text-[11px] font-mono">
              {missingIn2BGroups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#7E776C] font-sans">
                    ✓ Clean Audit: Zero defaulted supplier invoices found in this reconciliation.
                  </td>
                </tr>
              ) : (
                missingIn2BGroups.map((g) => {
                  const b = g.booksRecord;
                  const totalTax = (b?.igst || 0) + (b?.cgst || 0) + (b?.sgst || 0);
                  return (
                    <tr key={g.id} className="hover:bg-[#202020]">
                      <td className="py-2.5 px-4 text-[#B69A61] font-semibold">{b?.supplierGstin}</td>
                      <td className="py-2.5 px-4 text-[#F5F0E6] font-sans max-w-[200px] truncate">
                        {b?.supplierName || 'Unknown Vendor'}
                      </td>
                      <td className="py-2.5 px-4 text-[#F5F0E6]">{b?.invoiceNumber}</td>
                      <td className="py-2.5 px-4 text-[#8E877C]">{formatDisplayDate(b?.invoiceDate)}</td>
                      <td className="py-2.5 px-4 text-right text-[#C5BDB0]">{formatINR(b?.taxableValue, false)}</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-rose-400">{formatINR(totalTax, false)}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950/70 text-rose-300 border border-rose-800/60 font-sans">
                          Disallowance under 16(2)(aa)
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statutory ITC Checklist */}
      <div className="bg-[#1C1C1C] p-5 rounded-lg border border-[#2D2D2D] space-y-3">
        <h4 className="text-xs font-semibold text-[#F5F0E6] uppercase tracking-wider flex items-center gap-2">
          <span>Chartered Accountant's 4-Pillar Statutory ITC Verification Checklist</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-[#161616] p-3 rounded border border-[#262626] space-y-1">
            <div className="font-semibold text-[#E5D7B7]">1. Tax Invoice in Possession (Sec 16(2)(a))</div>
            <p className="text-[11px] text-[#8E877C]">
              Taxpayer holds valid tax invoice / debit note containing HSN, POS, recipient GSTIN, and tax components.
            </p>
          </div>
          <div className="bg-[#161616] p-3 rounded border border-[#262626] space-y-1">
            <div className="font-semibold text-[#E5D7B7]">2. Communicated in GSTR-2B (Sec 16(2)(aa))</div>
            <p className="text-[11px] text-[#8E877C]">
              Invoice details successfully auto-drafted into static statement Form GSTR-2B for the relevant filing period.
            </p>
          </div>
          <div className="bg-[#161616] p-3 rounded border border-[#262626] space-y-1">
            <div className="font-semibold text-[#E5D7B7]">3. Actual Receipt of Goods / Services (Sec 16(2)(b))</div>
            <p className="text-[11px] text-[#8E877C]">
              Verify goods received with e-Way Bill and Goods Receipt Note (GRN), or service completion certificate.
            </p>
          </div>
          <div className="bg-[#161616] p-3 rounded border border-[#262626] space-y-1">
            <div className="font-semibold text-[#E5D7B7]">4. 180-Day Payment Condition (2nd Proviso Sec 16(2))</div>
            <p className="text-[11px] text-[#8E877C]">
              Recipient must pay the supplier within 180 days from the invoice date. If unpaid, credit must be reversed with interest.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
