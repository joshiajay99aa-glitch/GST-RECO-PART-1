import React from 'react';
import {
  LayoutDashboard,
  Building2,
  UploadCloud,
  TableProperties,
  ShieldCheck,
  FileSpreadsheet,
  TrendingUp,
  Sparkles,
  History,
  Download,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { ClientProfile, ReconciliationProject } from '../../types/gst';

export type NavTab =
  | 'dashboard'
  | 'clients'
  | 'upload'
  | 'workbench'
  | 'sec16'
  | 'gstr3b'
  | 'sales'
  | 'ai_assistant'
  | 'audit_trail'
  | 'export';

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  activeClient: ClientProfile;
  activeProject: ReconciliationProject;
  matchedCount: number;
  unmatchedCount: number;
  taxMismatchCount: number;
  onLoadSampleData: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  activeClient,
  activeProject,
  matchedCount,
  unmatchedCount,
  taxMismatchCount,
  onLoadSampleData,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients' as NavTab, label: 'Client & GSTIN', icon: Building2 },
    { id: 'upload' as NavTab, label: 'Upload & Map', icon: UploadCloud },
    {
      id: 'workbench' as NavTab,
      label: 'Reconciliation Workbench',
      icon: TableProperties,
      badge: unmatchedCount + taxMismatchCount > 0 ? `${unmatchedCount + taxMismatchCount}` : undefined,
    },
    { id: 'sec16' as NavTab, label: 'Sec 16(2)(aa) ITC Audit', icon: ShieldCheck },
    { id: 'gstr3b' as NavTab, label: 'GSTR-3B Comparison', icon: FileSpreadsheet },
    { id: 'sales' as NavTab, label: 'Sales & GSTR-1', icon: TrendingUp },
    { id: 'ai_assistant' as NavTab, label: 'AI CA Assistant', icon: Sparkles, highlight: true },
    { id: 'audit_trail' as NavTab, label: 'Audit Trail & Sign-off', icon: History },
    { id: 'export' as NavTab, label: 'Download Reports', icon: Download },
  ];

  return (
    <aside className="w-64 bg-[#141414] border-r border-[#262626] flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#262626] flex items-center gap-3">
        <div className="w-9 h-9 rounded bg-[#B69A61]/15 border border-[#B69A61]/40 flex items-center justify-center text-[#B69A61] font-bold text-lg shadow-sm">
          ⚖️
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-wide text-[#F5F0E6] flex items-center gap-1.5">
            GST Recon <span className="text-[#B69A61] text-xs font-mono uppercase bg-[#B69A61]/10 px-1.5 py-0.5 rounded border border-[#B69A61]/30">PRO</span>
          </h1>
          <p className="text-[11px] text-[#8E877C] font-sans">CA Audit & Tax Platform</p>
        </div>
      </div>

      {/* Active Context Card */}
      <div className="p-3 mx-2 mt-2 bg-[#1C1C1C] rounded border border-[#2D2D2D] text-xs">
        <div className="flex items-center justify-between text-[#8E877C] mb-1">
          <span className="uppercase text-[10px] tracking-wider font-semibold">Active Client</span>
          <span className="text-[10px] bg-[#B69A61]/15 text-[#B69A61] px-1.5 py-0.2 rounded font-mono">
            FY {activeProject.financialYear}
          </span>
        </div>
        <p className="font-medium text-[#F5F0E6] truncate" title={activeClient.legalName}>
          {activeClient.legalName}
        </p>
        <p className="text-[11px] text-[#B69A61] font-mono mt-0.5">{activeClient.gstin}</p>
        <p className="text-[10px] text-[#8E877C] mt-1 truncate">
          Period: <span className="text-[#C5BDB0]">{activeProject.returnPeriod}</span>
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#B69A61]/15 text-[#B69A61] border border-[#B69A61]/30 shadow-inner'
                  : item.highlight
                  ? 'text-[#E5D7B7] hover:bg-[#222222] hover:text-[#F5F0E6]'
                  : 'text-[#A39E93] hover:bg-[#1E1E1E] hover:text-[#F5F0E6]'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#B69A61]' : item.highlight ? 'text-[#B69A61]' : 'text-[#8E877C]'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-amber-950/80 text-amber-300 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border border-amber-800/60">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Test Dataset Loader */}
      <div className="p-3 border-t border-[#262626] bg-[#141414]">
        <button
          onClick={onLoadSampleData}
          className="w-full flex items-center justify-center gap-2 bg-[#222222] hover:bg-[#2A2A2A] text-[#C5BDB0] hover:text-[#F5F0E6] border border-[#333333] hover:border-[#B69A61]/50 text-xs py-2 px-3 rounded transition-all shadow-sm"
          title="Reload realistic CA test dataset with known matches, mismatches, and duplicates"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#B69A61]" />
          <span>Load Sample CA Dataset</span>
        </button>
        <div className="mt-2 text-center text-[10px] text-[#706B62]">
          Deterministic Rule Engine • Gemini 3.8 Flash
        </div>
      </div>
    </aside>
  );
};
