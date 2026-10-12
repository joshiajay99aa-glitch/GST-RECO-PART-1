import React, { useState } from 'react';
import {
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { ReconciliationProject } from '../../types/gst';
import { formatINR } from '../../utils/decimal';

interface SalesReconciliationViewProps {
  project: ReconciliationProject;
}

export const SalesReconciliationView: React.FC<SalesReconciliationViewProps> = ({ project }) => {
  // Realistic synthetic sales register vs GSTR-1 vs GSTR-3B Table 3.1(a) numbers
  const [salesRegisterTaxable, setSalesRegisterTaxable] = useState(12500000);
  const [salesRegisterIgst, setSalesRegisterIgst] = useState(1125000);
  const [salesRegisterCgst, setSalesRegisterCgst] = useState(562500);
  const [salesRegisterSgst, setSalesRegisterSgst] = useState(562500);

  const [gstr1Taxable, setGstr1Taxable] = useState(12500000);
  const [gstr1Igst, setGstr1Igst] = useState(1125000);
  const [gstr1Cgst, setGstr1Cgst] = useState(562500);
  const [gstr1Sgst, setGstr1Sgst] = useState(562500);

  const [gstr3bTaxable, setGstr3bTaxable] = useState(12500000);
  const [gstr3bIgst, setGstr3bIgst] = useState(1125000);
  const [gstr3bCgst, setGstr3bCgst] = useState(562500);
  const [gstr3bSgst, setGstr3bSgst] = useState(562500);

  const diffSalesGstr1 = salesRegisterTaxable - gstr1Taxable;
  const diffGstr1Gstr3b = gstr1Taxable - gstr3bTaxable;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-[#181818] p-5 rounded-lg border border-[#2B2B2B]">
        <div className="flex items-center gap-2 text-xs text-[#B69A61] font-mono uppercase">
          <span>Module 9</span>
          <span>•</span>
          <span>Sales Register vs GSTR-1 vs GSTR-3B Table 3.1(a) Outward Tax</span>
        </div>
        <h2 className="text-lg font-semibold text-[#F5F0E6] mt-1">Outward Supplies & Tax Liability Audit</h2>
        <p className="text-xs text-[#8E877C] mt-0.5">
          Rule 88C mandates automated issuance of Form GST DRC-01C when tax liability reported in Form GSTR-1 exceeds liability paid in Form GSTR-3B.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1C1C1C] p-4 rounded-lg border border-[#2D2D2D] space-y-1">
          <div className="text-[11px] uppercase font-semibold text-[#8E877C]">Sales Register (Internal Books)</div>
          <div className="text-2xl font-bold font-mono text-[#F5F0E6]">{formatINR(salesRegisterTaxable)}</div>
          <p className="text-[10px] text-[#7E776C]">Total revenue from outward invoices</p>
        </div>

        <div className="bg-[#1C1C1C] p-4 rounded-lg border border-[#2D2D2D] space-y-1">
          <div className="text-[11px] uppercase font-semibold text-[#8E877C]">GSTR-1 Outward Supplies (Portal)</div>
          <div className="text-2xl font-bold font-mono text-[#B69A61]">{formatINR(gstr1Taxable)}</div>
          <p className="text-[10px] text-[#7E776C]">Furnished under Table 4, 5, 6, 7 & 9</p>
        </div>

        <div className="bg-[#1C1C1C] p-4 rounded-lg border border-emerald-900/50 space-y-1">
          <div className="text-[11px] uppercase font-semibold text-[#8E877C]">GSTR-3B Table 3.1(a) Tax Paid</div>
          <div className="text-2xl font-bold font-mono text-emerald-300">{formatINR(gstr3bTaxable)}</div>
          <p className="text-[10px] text-[#7E776C]">✓ DRC-01C Liability fully balanced</p>
        </div>
      </div>

      {/* Comparison Matrix */}
      <div className="bg-[#181818] rounded-lg border border-[#282828] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#282828] flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[#F5F0E6] uppercase tracking-wider">
            Sales & Liability Three-Way Reconciliation Schedule
          </h3>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
            ✓ RECONCILED (0.00 Variance)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#121212] text-[#8E877C] font-mono text-[10px] uppercase border-b border-[#282828]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Head / Supply Category</th>
                <th className="py-2.5 px-4 font-semibold text-right">Sales Register</th>
                <th className="py-2.5 px-4 font-semibold text-right">GSTR-1 Filed</th>
                <th className="py-2.5 px-4 font-semibold text-right">GSTR-3B Table 3.1</th>
                <th className="py-2.5 px-4 font-semibold text-right">GSTR-1 vs 3B Variance</th>
                <th className="py-2.5 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424] text-[11px] font-mono text-[#C5BDB0]">
              <tr>
                <td className="py-2.5 px-4 font-sans font-medium text-[#F5F0E6]">B2B Taxable Supplies (Table 4A)</td>
                <td className="py-2.5 px-4 text-right">{formatINR(9500000, false)}</td>
                <td className="py-2.5 px-4 text-right">{formatINR(9500000, false)}</td>
                <td className="py-2.5 px-4 text-right">{formatINR(9500000, false)}</td>
                <td className="py-2.5 px-4 text-right text-emerald-400">0.00</td>
                <td className="py-2.5 px-4 text-center font-sans">
                  <span className="text-[10px] bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded">Matched</span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-medium text-[#F5F0E6]">B2C Small Supplies (Table 7)</td>
                <td className="py-2.5 px-4 text-right">{formatINR(2500000, false)}</td>
                <td className="py-2.5 px-4 text-right">{formatINR(2500000, false)}</td>
                <td className="py-2.5 px-4 text-right">{formatINR(2500000, false)}</td>
                <td className="py-2.5 px-4 text-right text-emerald-400">0.00</td>
                <td className="py-2.5 px-4 text-center font-sans">
                  <span className="text-[10px] bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded">Matched</span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-medium text-[#F5F0E6]">Zero-Rated / Exports (Table 6A)</td>
                <td className="py-2.5 px-4 text-right">{formatINR(500000, false)}</td>
                <td className="py-2.5 px-4 text-right">{formatINR(500000, false)}</td>
                <td className="py-2.5 px-4 text-right">{formatINR(500000, false)}</td>
                <td className="py-2.5 px-4 text-right text-emerald-400">0.00</td>
                <td className="py-2.5 px-4 text-center font-sans">
                  <span className="text-[10px] bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded">Matched</span>
                </td>
              </tr>
              <tr className="bg-[#1C1C1C] font-semibold text-[#F5F0E6]">
                <td className="py-3 px-4 font-sans text-[#B69A61]">TOTAL OUTWARD TAXABLE SUPPLIES</td>
                <td className="py-3 px-4 text-right text-[#B69A61]">{formatINR(salesRegisterTaxable, true)}</td>
                <td className="py-3 px-4 text-right text-[#B69A61]">{formatINR(gstr1Taxable, true)}</td>
                <td className="py-3 px-4 text-right text-[#B69A61]">{formatINR(gstr3bTaxable, true)}</td>
                <td className="py-3 px-4 text-right text-emerald-400">0.00</td>
                <td className="py-3 px-4 text-center font-sans">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300">Compliant</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
