import React, { useState } from 'react';
import {
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { ControlTotals, ReconciliationProject } from '../../types/gst';
import { formatINR } from '../../utils/decimal';

interface Gstr3bComparisonViewProps {
  controlTotals: ControlTotals;
  project: ReconciliationProject;
  onFilterWorkbench: (filter: string) => void;
}

export const Gstr3bComparisonView: React.FC<Gstr3bComparisonViewProps> = ({
  controlTotals,
  project,
  onFilterWorkbench,
}) => {
  // Configurable GSTR-3B Table 4 claimed numbers (defaults to Books or simulated return claim)
  const [claimedIgst, setClaimedIgst] = useState<number>(controlTotals.booksTotalIgst);
  const [claimedCgst, setClaimedCgst] = useState<number>(controlTotals.booksTotalCgst);
  const [claimedSgst, setClaimedSgst] = useState<number>(controlTotals.booksTotalSgst);
  const [reversedTax, setReversedTax] = useState<number>(0);

  const total3bClaimed = claimedIgst + claimedCgst + claimedSgst - reversedTax;
  const portalAvailableTax = controlTotals.portalTotalTax;
  const varianceWithPortal = total3bClaimed - portalAvailableTax;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="bg-[#181818] p-5 rounded-lg border border-[#2B2B2B]">
        <div className="flex items-center gap-2 text-xs text-[#B69A61] font-mono uppercase">
          <span>Module 8</span>
          <span>•</span>
          <span>GSTR-3B Table 4 ITC Claimed vs GSTR-2B Portal Available</span>
        </div>
        <h2 className="text-lg font-semibold text-[#F5F0E6] mt-1">GSTR-3B Return Comparison & DRC-01B Risk</h2>
        <p className="text-xs text-[#8E877C] mt-0.5">
          Rule 88D mandates automated issuance of Form GST DRC-01B when ITC availed in Form GSTR-3B exceeds ITC available in Form GSTR-2B by a specified percentage.
        </p>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1C1C1C] p-4 rounded-lg border border-[#2D2D2D] space-y-1">
          <div className="text-[11px] uppercase font-semibold text-[#8E877C]">GSTR-2B ITC Available (Portal)</div>
          <div className="text-2xl font-bold font-mono text-[#F5F0E6]">{formatINR(portalAvailableTax)}</div>
          <p className="text-[10px] text-[#7E776C]">Auto-drafted from filed vendor GSTR-1s</p>
        </div>

        <div className="bg-[#1C1C1C] p-4 rounded-lg border border-[#2D2D2D] space-y-1">
          <div className="text-[11px] uppercase font-semibold text-[#8E877C]">GSTR-3B ITC Claimed (Return)</div>
          <div className="text-2xl font-bold font-mono text-[#B69A61]">{formatINR(total3bClaimed)}</div>
          <p className="text-[10px] text-[#7E776C]">Net credit availed in Table 4(C)</p>
        </div>

        <div className={`bg-[#1C1C1C] p-4 rounded-lg border space-y-1 ${
          varianceWithPortal > 10 ? 'border-rose-900/50' : 'border-emerald-900/50'
        }`}>
          <div className="text-[11px] uppercase font-semibold text-[#8E877C]">Variance (3B Claimed − 2B Available)</div>
          <div className={`text-2xl font-bold font-mono ${
            varianceWithPortal > 10 ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {formatINR(varianceWithPortal)}
          </div>
          <p className="text-[10px] text-[#7E776C]">
            {varianceWithPortal > 10 ? '⚠️ High risk of Form GST DRC-01B Intimation' : '✓ Credit within permissible GSTR-2B limits'}
          </p>
        </div>
      </div>

      {/* GSTR-3B Table 4 Breakdown Form & Table */}
      <div className="bg-[#181818] rounded-lg border border-[#282828] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#282828] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-[#F5F0E6] uppercase tracking-wider">
              GSTR-3B Table 4 Eligible ITC Reconciliation Schedule
            </h3>
            <p className="text-[11px] text-[#8E877C]">
              Compare tax components across Table 4(A)(5) All other ITC, Table 4(B) Reversals, and GSTR-2B
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#B69A61] bg-[#B69A61]/15 px-2 py-0.5 rounded border border-[#B69A61]/30">
            FY {project.financialYear}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#121212] text-[#8E877C] font-mono text-[10px] uppercase border-b border-[#282828]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Table 4 Return Description</th>
                <th className="py-2.5 px-4 font-semibold text-right">GSTR-3B Claimed (₹)</th>
                <th className="py-2.5 px-4 font-semibold text-right">GSTR-2B Auto-Drafted (₹)</th>
                <th className="py-2.5 px-4 font-semibold text-right">Variance / Difference</th>
                <th className="py-2.5 px-4 font-semibold text-center">DRC-01B Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424] text-[11px] font-mono text-[#C5BDB0]">
              <tr>
                <td className="py-2.5 px-4 font-sans font-medium text-[#F5F0E6]">Integrated Tax (IGST)</td>
                <td className="py-2.5 px-4 text-right">{formatINR(claimedIgst, false)}</td>
                <td className="py-2.5 px-4 text-right">{formatINR(controlTotals.portalTotalIgst, false)}</td>
                <td className={`py-2.5 px-4 text-right font-semibold ${
                  claimedIgst - controlTotals.portalTotalIgst !== 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {formatINR(claimedIgst - controlTotals.portalTotalIgst, false)}
                </td>
                <td className="py-2.5 px-4 text-center font-sans">
                  {claimedIgst > controlTotals.portalTotalIgst ? (
                    <span className="text-[10px] bg-rose-950/60 text-rose-300 px-2 py-0.5 rounded border border-rose-800/60">Excess Claim</span>
                  ) : (
                    <span className="text-[10px] bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded">Compliant</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-medium text-[#F5F0E6]">Central Tax (CGST)</td>
                <td className="py-2.5 px-4 text-right">{formatINR(claimedCgst, false)}</td>
                <td className="py-2.5 px-4 text-right">{formatINR(controlTotals.portalTotalCgst, false)}</td>
                <td className={`py-2.5 px-4 text-right font-semibold ${
                  claimedCgst - controlTotals.portalTotalCgst !== 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {formatINR(claimedCgst - controlTotals.portalTotalCgst, false)}
                </td>
                <td className="py-2.5 px-4 text-center font-sans">
                  {claimedCgst > controlTotals.portalTotalCgst ? (
                    <span className="text-[10px] bg-rose-950/60 text-rose-300 px-2 py-0.5 rounded border border-rose-800/60">Excess Claim</span>
                  ) : (
                    <span className="text-[10px] bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded">Compliant</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-medium text-[#F5F0E6]">State Tax (SGST / UTGST)</td>
                <td className="py-2.5 px-4 text-right">{formatINR(claimedSgst, false)}</td>
                <td className="py-2.5 px-4 text-right">{formatINR(controlTotals.portalTotalSgst, false)}</td>
                <td className={`py-2.5 px-4 text-right font-semibold ${
                  claimedSgst - controlTotals.portalTotalSgst !== 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {formatINR(claimedSgst - controlTotals.portalTotalSgst, false)}
                </td>
                <td className="py-2.5 px-4 text-center font-sans">
                  {claimedSgst > controlTotals.portalTotalSgst ? (
                    <span className="text-[10px] bg-rose-950/60 text-rose-300 px-2 py-0.5 rounded border border-rose-800/60">Excess Claim</span>
                  ) : (
                    <span className="text-[10px] bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded">Compliant</span>
                  )}
                </td>
              </tr>
              <tr className="bg-[#1C1C1C] font-semibold text-[#F5F0E6]">
                <td className="py-3 px-4 font-sans text-[#B69A61]">TOTAL NET ITC (Table 4(C))</td>
                <td className="py-3 px-4 text-right text-[#B69A61]">{formatINR(total3bClaimed, true)}</td>
                <td className="py-3 px-4 text-right text-[#B69A61]">{formatINR(portalAvailableTax, true)}</td>
                <td className={`py-3 px-4 text-right ${
                  varianceWithPortal > 10 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {formatINR(varianceWithPortal, true)}
                </td>
                <td className="py-3 px-4 text-center font-sans">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#2B2B2B] text-[#A39E93]">
                    {varianceWithPortal > 0 ? 'Excess ITC' : 'Matched'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
