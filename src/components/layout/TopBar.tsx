import React, { useState } from 'react';
import {
  Building2,
  Copy,
  Check,
  FileSpreadsheet,
  Play,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { ClientProfile, ControlTotals, ReconciliationProject } from '../../types/gst';

interface TopBarProps {
  activeClient: ClientProfile;
  clients: ClientProfile[];
  onSelectClient: (client: ClientProfile) => void;
  activeProject: ReconciliationProject;
  projects: ReconciliationProject[];
  onSelectProject: (proj: ReconciliationProject) => void;
  onUpdateFinancialYear: (fy: string) => void;
  controlTotals: ControlTotals;
  onRunReconciliation: () => void;
  onExportExcel: () => void;
  onOpenAuditSignOff: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeClient,
  clients,
  onSelectClient,
  activeProject,
  projects,
  onSelectProject,
  onUpdateFinancialYear,
  controlTotals,
  onRunReconciliation,
  onExportExcel,
  onOpenAuditSignOff,
}) => {
  const [copied, setCopied] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const copyGstin = () => {
    navigator.clipboard.writeText(activeClient.gstin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const financialYears = [
    '2024-25',
    '2023-24',
    '2022-23',
    '2021-22',
    '2020-21',
    '2019-20',
    '2018-19',
    '2017-18',
  ];

  return (
    <header className="h-14 bg-[#141414] border-b border-[#262626] px-5 flex items-center justify-between text-xs text-[#F5F0E6] shrink-0 z-20">
      {/* Left Context: Client & GSTIN */}
      <div className="flex items-center gap-3">
        {/* Client Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowClientDropdown(!showClientDropdown)}
            className="flex items-center gap-2 bg-[#1C1C1C] hover:bg-[#242424] px-2.5 py-1.5 rounded border border-[#333333] transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-[#B69A61]" />
            <span className="font-semibold max-w-[180px] truncate">{activeClient.legalName}</span>
            <ChevronDown className="w-3 h-3 text-[#8E877C]" />
          </button>

          {showClientDropdown && (
            <div className="absolute left-0 mt-1 w-64 bg-[#1C1C1C] border border-[#333333] rounded shadow-xl py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-[#8E877C] border-b border-[#2B2B2B]">
                Switch Client Entity
              </div>
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelectClient(c);
                    setShowClientDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-[#282828] transition-colors ${
                    c.id === activeClient.id ? 'bg-[#B69A61]/10 text-[#B69A61]' : 'text-[#C5BDB0]'
                  }`}
                >
                  <span className="font-medium truncate">{c.legalName}</span>
                  <span className="text-[10px] font-mono text-[#8E877C]">{c.gstin}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GSTIN Badge with Copy */}
        <div className="flex items-center gap-1.5 bg-[#1C1C1C] px-2 py-1 rounded border border-[#2D2D2D]">
          <span className="text-[#8E877C] text-[10px]">GSTIN:</span>
          <span className="font-mono text-[#B69A61] font-medium">{activeClient.gstin}</span>
          <button
            onClick={copyGstin}
            className="text-[#8E877C] hover:text-[#F5F0E6] p-0.5 rounded transition-colors"
            title="Copy GSTIN"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        {/* Financial Year Selector */}
        <div className="flex items-center gap-1.5 bg-[#1C1C1C] px-2 py-1 rounded border border-[#2D2D2D]">
          <span className="text-[#8E877C] text-[10px]">FY:</span>
          <select
            value={activeProject.financialYear}
            onChange={(e) => onUpdateFinancialYear(e.target.value)}
            className="bg-transparent text-[#F5F0E6] font-mono font-medium focus:outline-none cursor-pointer"
          >
            {financialYears.map((fy) => (
              <option key={fy} value={fy} className="bg-[#1C1C1C] text-[#F5F0E6]">
                {fy}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Controls: Balance Status, Maker-Checker & Actions */}
      <div className="flex items-center gap-3">
        {/* Control Balance Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border ${
            controlTotals.isBalanced
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
              : 'bg-amber-950/40 text-amber-300 border-amber-800/60'
          }`}
          title={controlTotals.varianceMessage || 'Control totals fully balanced across all categories'}
        >
          {controlTotals.isBalanced ? (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>{controlTotals.isBalanced ? 'Control Balanced' : 'Variance Warning'}</span>
        </div>

        {/* Maker-Checker Status */}
        <button
          onClick={onOpenAuditSignOff}
          className="flex items-center gap-1.5 bg-[#1C1C1C] hover:bg-[#252525] px-2.5 py-1 rounded border border-[#333333] transition-colors"
          title="Maker-Checker Review & Audit Sign-off Workflow"
        >
          <UserCheck className="w-3.5 h-3.5 text-[#B69A61]" />
          <span className="text-[11px] text-[#C5BDB0]">
            Status: <span className="text-[#F5F0E6] font-medium">{activeProject.status}</span>
          </span>
        </button>

        {/* Run Reconciliation Engine Button */}
        <button
          onClick={onRunReconciliation}
          className="flex items-center gap-1.5 bg-[#B69A61] hover:bg-[#C8AC70] text-[#111111] font-semibold px-3 py-1.5 rounded transition-all shadow-sm active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Run Recon Engine</span>
        </button>

        {/* Download Excel Report */}
        <button
          onClick={onExportExcel}
          className="flex items-center gap-1.5 bg-[#222222] hover:bg-[#2C2C2C] text-[#F5F0E6] border border-[#383838] hover:border-[#B69A61]/50 px-3 py-1.5 rounded transition-colors"
          title="Export 10-sheet CA Reconciliation Report to Excel"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#B69A61]" />
          <span>Export Excel</span>
        </button>
      </div>
    </header>
  );
};
