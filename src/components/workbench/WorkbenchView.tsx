import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Link as LinkIcon,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ClientProfile,
  MatchGroup,
  MatchStatus,
  NormalisedInvoiceRecord,
  ReconciliationProject,
} from '../../types/gst';
import { formatINR } from '../../utils/decimal';
import { formatDisplayDate } from '../../utils/gstValidator';
import { ComparisonDrawer } from './ComparisonDrawer';
import { exportReconciliationToCSV } from '../../services/excelExportService';

interface WorkbenchViewProps {
  matchGroups: MatchGroup[];
  booksRecords: NormalisedInvoiceRecord[];
  portalRecords: NormalisedInvoiceRecord[];
  client: ClientProfile;
  project: ReconciliationProject;
  initialFilter?: string;
  onUpdateReviewStatus: (groupId: string, status: 'ACCEPTED' | 'FLAGGED_FOR_CLIENT' | 'REJECTED', notes: string) => void;
  onManualMatch: (booksRecordId: string, portalRecordId: string, reason: string) => void;
  onUnmatchGroup: (groupId: string) => void;
}

export const WorkbenchView: React.FC<WorkbenchViewProps> = ({
  matchGroups,
  booksRecords,
  portalRecords,
  client,
  project,
  initialFilter = 'ALL',
  onUpdateReviewStatus,
  onManualMatch,
  onUnmatchGroup,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<MatchGroup | null>(null);
  const [sortBy, setSortBy] = useState<'DIFF_DESC' | 'DATE_DESC' | 'GSTIN_ASC'>('DIFF_DESC');
  const [showManualMatchModal, setShowManualMatchModal] = useState(false);

  // Manual Match State
  const [manualBooksId, setManualBooksId] = useState('');
  const [manualPortalId, setManualPortalId] = useState('');
  const [manualReason, setManualReason] = useState('Vendor used shortened invoice numbering prefix');

  // Filter tabs definition
  const filterTabs = [
    { id: 'ALL', label: 'All Records', count: matchGroups.length },
    {
      id: 'MATCHED',
      label: 'Exact Matched',
      count: matchGroups.filter(
        (g) => g.matchStatus === 'EXACT_MATCH' || g.matchStatus === 'MATCHED_NORMALIZED_INV'
      ).length,
    },
    {
      id: 'NEAR_MATCH',
      label: 'Near Matched',
      count: matchGroups.filter(
        (g) => g.matchStatus === 'MATCHED_DATE_DIFF' || g.matchStatus === 'MATCHED_ROUNDING_DIFF'
      ).length,
    },
    {
      id: 'MISSING_IN_2B',
      label: 'Missing in 2B (Books Only)',
      count: matchGroups.filter((g) => g.matchStatus === 'MISSING_IN_2B').length,
    },
    {
      id: 'MISSING_IN_PR',
      label: 'Unbooked (2B Only)',
      count: matchGroups.filter((g) => g.matchStatus === 'MISSING_IN_PR').length,
    },
    {
      id: 'TAX_MISMATCH',
      label: 'Tax Mismatches',
      count: matchGroups.filter(
        (g) =>
          g.matchStatus === 'TAXABLE_VALUE_MISMATCH' ||
          g.matchStatus === 'IGST_MISMATCH' ||
          g.matchStatus === 'CGST_MISMATCH' ||
          g.matchStatus === 'SGST_MISMATCH'
      ).length,
    },
    {
      id: 'DUPLICATE_INVOICE',
      label: 'Duplicates',
      count: matchGroups.filter((g) => g.matchStatus === 'DUPLICATE_INVOICE').length,
    },
    {
      id: 'PENDING_REVIEW',
      label: 'Pending CA Review',
      count: matchGroups.filter(
        (g) => g.reviewStatus === 'PENDING' || g.matchStatus === 'POTENTIAL_MATCH_REVIEW'
      ).length,
    },
  ];

  // Filtered & Sorted Records
  const filteredRecords = useMemo(() => {
    return matchGroups.filter((g) => {
      // Tab filter
      if (activeTab === 'MATCHED') {
        if (g.matchStatus !== 'EXACT_MATCH' && g.matchStatus !== 'MATCHED_NORMALIZED_INV') return false;
      } else if (activeTab === 'NEAR_MATCH') {
        if (g.matchStatus !== 'MATCHED_DATE_DIFF' && g.matchStatus !== 'MATCHED_ROUNDING_DIFF') return false;
      } else if (activeTab === 'MISSING_IN_2B') {
        if (g.matchStatus !== 'MISSING_IN_2B') return false;
      } else if (activeTab === 'MISSING_IN_PR') {
        if (g.matchStatus !== 'MISSING_IN_PR') return false;
      } else if (activeTab === 'TAX_MISMATCH') {
        if (
          g.matchStatus !== 'TAXABLE_VALUE_MISMATCH' &&
          g.matchStatus !== 'IGST_MISMATCH' &&
          g.matchStatus !== 'CGST_MISMATCH' &&
          g.matchStatus !== 'SGST_MISMATCH'
        )
          return false;
      } else if (activeTab === 'DUPLICATE_INVOICE') {
        if (g.matchStatus !== 'DUPLICATE_INVOICE') return false;
      } else if (activeTab === 'PENDING_REVIEW') {
        if (g.reviewStatus !== 'PENDING' && g.matchStatus !== 'POTENTIAL_MATCH_REVIEW') return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const bInv = g.booksRecord?.invoiceNumber.toLowerCase() || '';
        const pInv = g.portalRecord?.invoiceNumber.toLowerCase() || '';
        const gstin = (g.booksRecord?.supplierGstin || g.portalRecord?.supplierGstin || '').toLowerCase();
        const sName = (g.booksRecord?.supplierName || g.portalRecord?.supplierName || '').toLowerCase();
        const gId = g.id.toLowerCase();
        if (!bInv.includes(q) && !pInv.includes(q) && !gstin.includes(q) && !sName.includes(q) && !gId.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'DIFF_DESC') {
        const diffA = Math.abs(a.diffTaxable) + Math.abs(a.diffIgst) + Math.abs(a.diffCgst) + Math.abs(a.diffSgst);
        const diffB = Math.abs(b.diffTaxable) + Math.abs(b.diffIgst) + Math.abs(b.diffCgst) + Math.abs(b.diffSgst);
        return diffB - diffA;
      }
      if (sortBy === 'DATE_DESC') {
        const dateA = a.booksRecord?.standardDate || a.portalRecord?.standardDate || '';
        const dateB = b.booksRecord?.standardDate || b.portalRecord?.standardDate || '';
        return dateB.localeCompare(dateA);
      }
      if (sortBy === 'GSTIN_ASC') {
        const gstinA = a.booksRecord?.supplierGstin || a.portalRecord?.supplierGstin || '';
        const gstinB = b.booksRecord?.supplierGstin || b.portalRecord?.supplierGstin || '';
        return gstinA.localeCompare(gstinB);
      }
      return 0;
    });
  }, [matchGroups, activeTab, searchQuery, sortBy]);

  // Unmatched records for manual linking
  const unmatchedBooksRecords = useMemo(() => {
    return booksRecords.filter((b) => {
      const g = matchGroups.find((mg) => mg.booksRecord?.id === b.id);
      return g && (g.matchStatus === 'MISSING_IN_2B' || g.matchStatus === 'MISSING_IN_2A');
    });
  }, [booksRecords, matchGroups]);

  const unmatchedPortalRecords = useMemo(() => {
    return portalRecords.filter((p) => {
      const g = matchGroups.find((mg) => mg.portalRecord?.id === p.id);
      return g && g.matchStatus === 'MISSING_IN_PR';
    });
  }, [portalRecords, matchGroups]);

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'EXACT_MATCH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">Exact Match</span>;
      case 'MATCHED_NORMALIZED_INV':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">Norm Inv Match</span>;
      case 'MATCHED_DATE_DIFF':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-950/40 text-teal-300 border border-teal-800/40">Date Diff Match</span>;
      case 'MATCHED_ROUNDING_DIFF':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">Rounding Match</span>;
      case 'MISSING_IN_2B':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/70 text-rose-300 border border-rose-800/60">Missing in 2B</span>;
      case 'MISSING_IN_PR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/70 text-amber-300 border border-amber-800/60">Unbooked in PR</span>;
      case 'IGST_MISMATCH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-orange-950/70 text-orange-300 border border-orange-800/60">IGST Head Shift</span>;
      case 'CGST_MISMATCH':
      case 'SGST_MISMATCH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-orange-950/70 text-orange-300 border border-orange-800/60">CGST/SGST Shift</span>;
      case 'TAXABLE_VALUE_MISMATCH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-orange-950/70 text-orange-300 border border-orange-800/60">Taxable Diff</span>;
      case 'DUPLICATE_INVOICE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/70 text-rose-300 border border-rose-800/60">Duplicate Bill</span>;
      case 'POTENTIAL_MATCH_REVIEW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-yellow-950/70 text-yellow-300 border border-yellow-800/60">Review Required</span>;
      case 'MANUAL_MATCHED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/60 text-blue-300 border border-blue-800/60">Manual Linked</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#262626] text-[#A39E93]">{status}</span>;
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#181818] p-4 rounded-lg border border-[#2B2B2B]">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8E877C] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice number, GSTIN, vendor name, or group ID..."
            className="w-full bg-[#121212] border border-[#2D2D2D] rounded pl-9 pr-3 py-2 text-xs text-[#F5F0E6] placeholder-[#666666] focus:outline-none focus:border-[#B69A61]"
          />
        </div>

        {/* Sort & Action Controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[#141414] px-2.5 py-1.5 rounded border border-[#2B2B2B] text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8E877C]" />
            <span className="text-[#8E877C] text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-[#F5F0E6] focus:outline-none cursor-pointer"
            >
              <option value="DIFF_DESC" className="bg-[#181818]">Mismatch Amount (High → Low)</option>
              <option value="DATE_DESC" className="bg-[#181818]">Invoice Date (Latest First)</option>
              <option value="GSTIN_ASC" className="bg-[#181818]">Supplier GSTIN (A → Z)</option>
            </select>
          </div>

          {/* Manual Link Modal Trigger */}
          <button
            onClick={() => setShowManualMatchModal(true)}
            className="flex items-center gap-1.5 bg-[#242424] hover:bg-[#2C2C2C] text-[#F5F0E6] border border-[#383838] px-3 py-1.5 rounded text-xs transition-colors"
            title="Manually link an unmatched Books bill with an unmatched Portal invoice"
          >
            <LinkIcon className="w-3.5 h-3.5 text-[#B69A61]" />
            <span>Manual Match</span>
          </button>

          {/* Export Filtered CSV */}
          <button
            onClick={() => exportReconciliationToCSV(filteredRecords, `Workbench_${activeTab}`)}
            className="flex items-center gap-1.5 bg-[#242424] hover:bg-[#2C2C2C] text-[#F5F0E6] border border-[#383838] px-3 py-1.5 rounded text-xs transition-colors"
            title="Download currently filtered records as CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#B69A61]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-[#262626]">
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t font-medium transition-colors shrink-0 ${
                isActive
                  ? 'bg-[#1E1E1E] text-[#B69A61] border-t-2 border-t-[#B69A61] border-x border-[#2E2E2E]'
                  : 'text-[#8E877C] hover:text-[#F5F0E6] hover:bg-[#181818]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isActive ? 'bg-[#B69A61]/20 text-[#B69A61]' : 'bg-[#222222] text-[#8E877C]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* High Density CA Spreadsheet Table */}
      <div className="bg-[#161616] border border-[#2B2B2B] rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[680px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#121212] text-[#8E877C] uppercase font-mono text-[10px] sticky top-0 z-10 border-b border-[#282828] select-none">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Match ID</th>
                <th className="py-2.5 px-3 font-semibold">Supplier GSTIN & Legal Name</th>
                <th className="py-2.5 px-3 font-semibold">Books Inv No / Date</th>
                <th className="py-2.5 px-3 font-semibold">Portal Inv No / Date</th>
                <th className="py-2.5 px-3 font-semibold text-right">Books Taxable</th>
                <th className="py-2.5 px-3 font-semibold text-right">Portal Taxable</th>
                <th className="py-2.5 px-3 font-semibold text-right">Taxable Diff</th>
                <th className="py-2.5 px-3 font-semibold text-right">IGST Diff</th>
                <th className="py-2.5 px-3 font-semibold text-right">CGST Diff</th>
                <th className="py-2.5 px-3 font-semibold text-right">SGST Diff</th>
                <th className="py-2.5 px-3 font-semibold text-center">Match Status</th>
                <th className="py-2.5 px-3 font-semibold text-center">Audit Review</th>
                <th className="py-2.5 px-2 font-semibold text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222] text-[11px] font-mono">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-[#7E776C] font-sans">
                    No reconciliation records found matching current filter & search criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((g) => {
                  const b = g.booksRecord;
                  const p = g.portalRecord;
                  const gstin = b?.supplierGstin || p?.supplierGstin || '';
                  const supplierName = b?.supplierName || p?.supplierName || '';

                  return (
                    <tr
                      key={g.id}
                      onClick={() => setSelectedGroup(g)}
                      className="hover:bg-[#202020] transition-colors cursor-pointer group"
                    >
                      {/* Match Group ID */}
                      <td className="py-2 px-3 text-[#B69A61] font-semibold whitespace-nowrap">
                        {g.id}
                      </td>

                      {/* Supplier GSTIN & Legal Name */}
                      <td className="py-2 px-3 max-w-[220px]">
                        <div className="font-semibold text-[#F5F0E6] truncate">{gstin}</div>
                        <div className="text-[10px] text-[#8E877C] font-sans truncate" title={supplierName}>
                          {supplierName || 'Unknown Vendor'}
                        </div>
                      </td>

                      {/* Books Inv No & Date */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        {b ? (
                          <>
                            <div className="text-[#F5F0E6] font-medium">{b.invoiceNumber}</div>
                            <div className="text-[10px] text-[#8E877C]">{formatDisplayDate(b.invoiceDate)}</div>
                          </>
                        ) : (
                          <span className="text-rose-400 italic text-[10px]">Missing</span>
                        )}
                      </td>

                      {/* Portal Inv No & Date */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        {p ? (
                          <>
                            <div className="text-[#F5F0E6] font-medium">{p.invoiceNumber}</div>
                            <div className="text-[10px] text-[#8E877C]">{formatDisplayDate(p.invoiceDate)}</div>
                          </>
                        ) : (
                          <span className="text-rose-400 italic text-[10px]">Missing</span>
                        )}
                      </td>

                      {/* Books Taxable */}
                      <td className="py-2 px-3 text-right text-[#C5BDB0] whitespace-nowrap">
                        {formatINR(b?.taxableValue, false)}
                      </td>

                      {/* Portal Taxable */}
                      <td className="py-2 px-3 text-right text-[#C5BDB0] whitespace-nowrap">
                        {formatINR(p?.taxableValue, false)}
                      </td>

                      {/* Taxable Diff */}
                      <td
                        className={`py-2 px-3 text-right font-semibold whitespace-nowrap ${
                          g.diffTaxable !== 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {formatINR(g.diffTaxable, false)}
                      </td>

                      {/* IGST Diff */}
                      <td
                        className={`py-2 px-3 text-right whitespace-nowrap ${
                          g.diffIgst !== 0 ? 'text-amber-400 font-semibold' : 'text-[#8E877C]'
                        }`}
                      >
                        {formatINR(g.diffIgst, false)}
                      </td>

                      {/* CGST Diff */}
                      <td
                        className={`py-2 px-3 text-right whitespace-nowrap ${
                          g.diffCgst !== 0 ? 'text-amber-400 font-semibold' : 'text-[#8E877C]'
                        }`}
                      >
                        {formatINR(g.diffCgst, false)}
                      </td>

                      {/* SGST Diff */}
                      <td
                        className={`py-2 px-3 text-right whitespace-nowrap ${
                          g.diffSgst !== 0 ? 'text-amber-400 font-semibold' : 'text-[#8E877C]'
                        }`}
                      >
                        {formatINR(g.diffSgst, false)}
                      </td>

                      {/* Matching Status */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(g.matchStatus)}
                      </td>

                      {/* Audit Review Status */}
                      <td className="py-2 px-3 text-center whitespace-nowrap font-sans">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            g.reviewStatus === 'ACCEPTED'
                              ? 'bg-emerald-950/40 text-emerald-300'
                              : g.reviewStatus === 'FLAGGED_FOR_CLIENT'
                              ? 'bg-amber-950/40 text-amber-300'
                              : 'bg-[#222222] text-[#8E877C]'
                          }`}
                        >
                          {g.reviewStatus}
                        </span>
                      </td>

                      {/* Drawer Inspect Trigger */}
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGroup(g);
                          }}
                          className="p-1 rounded hover:bg-[#2D2D2D] text-[#8E877C] group-hover:text-[#B69A61] transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="p-3 bg-[#131313] border-t border-[#262626] flex items-center justify-between text-[11px] text-[#8E877C]">
          <div>
            Showing <span className="font-mono text-[#F5F0E6]">{filteredRecords.length}</span> of{' '}
            <span className="font-mono text-[#F5F0E6]">{matchGroups.length}</span> total reconciliation items
          </div>
          <div className="flex items-center gap-3">
            <span>Click any invoice row to view side-by-side comparison & AI diagnosis</span>
          </div>
        </div>
      </div>

      {/* Manual Match Modal */}
      {showManualMatchModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#181818] border border-[#333333] rounded-lg max-w-2xl w-full p-5 space-y-4 shadow-2xl text-xs text-[#F5F0E6]">
            <div className="flex items-center justify-between border-b border-[#282828] pb-3">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#B69A61]" />
                <h3 className="text-sm font-semibold text-[#F5F0E6]">Manual Match Record Linker</h3>
              </div>
              <button onClick={() => setShowManualMatchModal(false)} className="text-[#8E877C] hover:text-[#F5F0E6]">
                ✕
              </button>
            </div>

            <p className="text-[11px] text-[#8E877C]">
              Pair an invoice from your Purchase Register with an invoice in GSTR-2B that could not be matched by deterministic rules (e.g., custom vendor billing code or manual correction).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-[#8E877C] uppercase block mb-1">
                  1. Unmatched Purchase Register Bill ({unmatchedBooksRecords.length} available)
                </label>
                <select
                  value={manualBooksId}
                  onChange={(e) => setManualBooksId(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2D2D2D] rounded p-2 text-xs text-[#F5F0E6] focus:outline-none focus:border-[#B69A61]"
                >
                  <option value="">-- Select Books Bill --</option>
                  {unmatchedBooksRecords.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.invoiceNumber} | {b.supplierGstin} (₹{b.taxableValue})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#8E877C] uppercase block mb-1">
                  2. Unmatched GSTR-2B Invoice ({unmatchedPortalRecords.length} available)
                </label>
                <select
                  value={manualPortalId}
                  onChange={(e) => setManualPortalId(e.target.value)}
                  className="w-full bg-[#121212] border border-[#2D2D2D] rounded p-2 text-xs text-[#F5F0E6] focus:outline-none focus:border-[#B69A61]"
                >
                  <option value="">-- Select Portal Invoice --</option>
                  {unmatchedPortalRecords.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.invoiceNumber} | {p.supplierGstin} (₹{p.taxableValue})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#8E877C] uppercase block mb-1">
                Auditor Justification / Reason (Recorded in Immutable Audit Trail)
              </label>
              <input
                type="text"
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                className="w-full bg-[#121212] border border-[#2D2D2D] rounded p-2 text-xs text-[#F5F0E6] focus:outline-none focus:border-[#B69A61]"
                placeholder="e.g., Confirmed with vendor accounts department via email date 12-Oct"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#282828]">
              <button
                onClick={() => setShowManualMatchModal(false)}
                className="px-3 py-1.5 rounded bg-[#242424] hover:bg-[#2C2C2C] text-[#C5BDB0]"
              >
                Cancel
              </button>
              <button
                disabled={!manualBooksId || !manualPortalId || !manualReason}
                onClick={() => {
                  onManualMatch(manualBooksId, manualPortalId, manualReason);
                  setShowManualMatchModal(false);
                }}
                className="px-4 py-1.5 rounded bg-[#B69A61] hover:bg-[#C8AC70] text-[#111111] font-semibold disabled:opacity-50"
              >
                Link & Reconcile Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Drawer */}
      {selectedGroup && (
        <ComparisonDrawer
          matchGroup={selectedGroup}
          client={client}
          onClose={() => setSelectedGroup(null)}
          onUpdateReviewStatus={onUpdateReviewStatus}
          onUnmatchGroup={(groupId) => {
            onUnmatchGroup(groupId);
            setSelectedGroup(null);
          }}
        />
      )}
    </div>
  );
};
