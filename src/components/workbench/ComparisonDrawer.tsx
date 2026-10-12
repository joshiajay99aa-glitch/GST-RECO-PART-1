import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Building,
  HelpCircle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { MatchGroup, ClientProfile } from '../../types/gst';
import { formatINR } from '../../utils/decimal';
import { formatDisplayDate } from '../../utils/gstValidator';

interface ComparisonDrawerProps {
  matchGroup: MatchGroup | null;
  client: ClientProfile;
  onClose: () => void;
  onUpdateReviewStatus: (groupId: string, status: 'ACCEPTED' | 'FLAGGED_FOR_CLIENT' | 'REJECTED', notes: string) => void;
  onUnmatchGroup?: (groupId: string) => void;
}

export const ComparisonDrawer: React.FC<ComparisonDrawerProps> = ({
  matchGroup,
  client,
  onClose,
  onUpdateReviewStatus,
  onUnmatchGroup,
}) => {
  const [reviewNotes, setReviewNotes] = useState(matchGroup?.reviewNotes || '');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(matchGroup?.aiExplanation || null);
  const [copied, setCopied] = useState(false);

  if (!matchGroup) return null;

  const b = matchGroup.booksRecord;
  const p = matchGroup.portalRecord;

  const handleGenerateAiAnalysis = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/analyze-exception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchGroup,
          clientInfo: client,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to call AI service');
      }

      const data = await res.json();
      setAiAnalysis(data.text);
      matchGroup.aiExplanation = data.text;
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error generating AI analysis. Please verify your GEMINI_API_KEY.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const copyAiText = () => {
    if (!aiAnalysis) return;
    navigator.clipboard.writeText(aiAnalysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[620px] bg-[#161616] border-l border-[#2B2B2B] shadow-2xl z-50 flex flex-col text-xs text-[#F5F0E6] animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#191919]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#B69A61] font-semibold">{matchGroup.id}</span>
            <span className="bg-[#242424] text-[#C5BDB0] px-2 py-0.5 rounded text-[10px] font-mono">
              Confidence: {matchGroup.confidenceScore}%
            </span>
          </div>
          <h3 className="text-sm font-semibold text-[#F5F0E6] mt-0.5">{matchGroup.matchStatus.replace(/_/g, ' ')}</h3>
        </div>

        <button
          onClick={onClose}
          className="text-[#8E877C] hover:text-[#F5F0E6] p-1.5 rounded hover:bg-[#252525] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Rule Applied */}
        <div className="bg-[#1D1D1D] p-3 rounded border border-[#2D2D2D]">
          <div className="text-[10px] uppercase font-semibold text-[#8E877C]">Matching Rule Applied</div>
          <p className="text-xs text-[#E5D7B7] mt-0.5">{matchGroup.matchingRuleApplied}</p>
          {matchGroup.dateDiffDays !== undefined && (
            <p className="text-[11px] text-[#8E877C] mt-1 font-mono">
              Date Difference: <span className="text-[#F5F0E6]">{matchGroup.dateDiffDays} days</span>
            </p>
          )}
        </div>

        {/* Side by Side Inspection Table */}
        <div className="border border-[#2D2D2D] rounded overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#141414] text-[10px] font-mono uppercase text-[#8E877C] border-b border-[#282828]">
              <tr>
                <th className="py-2 px-3">Field / Attribute</th>
                <th className="py-2 px-3 text-right">Books (Purchase Reg)</th>
                <th className="py-2 px-3 text-right">Portal (GSTR-2B)</th>
                <th className="py-2 px-3 text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242424] text-[11px]">
              <tr>
                <td className="py-1.5 px-3 text-[#8E877C]">Invoice Number</td>
                <td className="py-1.5 px-3 text-right font-mono text-[#F5F0E6]">{b?.invoiceNumber || '-'}</td>
                <td className="py-1.5 px-3 text-right font-mono text-[#F5F0E6]">{p?.invoiceNumber || '-'}</td>
                <td className="py-1.5 px-3 text-right text-[#8E877C] font-mono">-</td>
              </tr>
              <tr>
                <td className="py-1.5 px-3 text-[#8E877C]">Invoice Date</td>
                <td className="py-1.5 px-3 text-right font-mono">{formatDisplayDate(b?.invoiceDate)}</td>
                <td className="py-1.5 px-3 text-right font-mono">{formatDisplayDate(p?.invoiceDate)}</td>
                <td className="py-1.5 px-3 text-right font-mono text-[#8E877C]">
                  {matchGroup.dateDiffDays !== undefined ? `${matchGroup.dateDiffDays} d` : '-'}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 px-3 text-[#8E877C]">Taxable Value (₹)</td>
                <td className="py-1.5 px-3 text-right font-mono">{formatINR(b?.taxableValue, false)}</td>
                <td className="py-1.5 px-3 text-right font-mono">{formatINR(p?.taxableValue, false)}</td>
                <td className={`py-1.5 px-3 text-right font-mono font-semibold ${
                  matchGroup.diffTaxable !== 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {formatINR(matchGroup.diffTaxable, false)}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 px-3 text-[#8E877C]">IGST (Integrated)</td>
                <td className="py-1.5 px-3 text-right font-mono">{formatINR(b?.igst, false)}</td>
                <td className="py-1.5 px-3 text-right font-mono">{formatINR(p?.igst, false)}</td>
                <td className={`py-1.5 px-3 text-right font-mono font-semibold ${
                  matchGroup.diffIgst !== 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {formatINR(matchGroup.diffIgst, false)}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 px-3 text-[#8E877C]">CGST (Central)</td>
                <td className="py-1.5 px-3 text-right font-mono">{formatINR(b?.cgst, false)}</td>
                <td className="py-1.5 px-3 text-right font-mono">{formatINR(p?.cgst, false)}</td>
                <td className={`py-1.5 px-3 text-right font-mono font-semibold ${
                  matchGroup.diffCgst !== 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {formatINR(matchGroup.diffCgst, false)}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 px-3 text-[#8E877C]">SGST (State)</td>
                <td className="py-1.5 px-3 text-right font-mono">{formatINR(b?.sgst, false)}</td>
                <td className="py-1.5 px-3 text-right font-mono">{formatINR(p?.sgst, false)}</td>
                <td className={`py-1.5 px-3 text-right font-mono font-semibold ${
                  matchGroup.diffSgst !== 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {formatINR(matchGroup.diffSgst, false)}
                </td>
              </tr>
              <tr className="bg-[#1C1C1C] font-semibold">
                <td className="py-2 px-3 text-[#B69A61]">Total Invoice Value</td>
                <td className="py-2 px-3 text-right font-mono text-[#F5F0E6]">{formatINR(b?.totalValue, true)}</td>
                <td className="py-2 px-3 text-right font-mono text-[#F5F0E6]">{formatINR(p?.totalValue, true)}</td>
                <td className={`py-2 px-3 text-right font-mono ${
                  matchGroup.diffTotal !== 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {formatINR(matchGroup.diffTotal, true)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Source File and Metadata Audit Reference */}
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div className="bg-[#1A1A1A] p-2.5 rounded border border-[#262626]">
            <div className="text-[10px] text-[#8E877C] font-semibold uppercase">Books File Reference</div>
            {b ? (
              <div className="mt-1 space-y-0.5 text-[#C5BDB0]">
                <p className="truncate" title={b.sourceFileName}>File: {b.sourceFileName}</p>
                <p>Row: <span className="font-mono text-[#F5F0E6]">{b.sourceRowNumber}</span> (Sheet: {b.sourceSheetName || 'Default'})</p>
                <p className="font-mono text-[#B69A61]">{b.supplierGstin}</p>
              </div>
            ) : (
              <p className="text-rose-400 mt-1 italic">Missing from Purchase Register</p>
            )}
          </div>

          <div className="bg-[#1A1A1A] p-2.5 rounded border border-[#262626]">
            <div className="text-[10px] text-[#8E877C] font-semibold uppercase">Portal Return Reference</div>
            {p ? (
              <div className="mt-1 space-y-0.5 text-[#C5BDB0]">
                <p className="truncate" title={p.sourceFileName}>File: {p.sourceFileName}</p>
                <p>Row: <span className="font-mono text-[#F5F0E6]">{p.sourceRowNumber}</span> (Sheet: {p.sourceSheetName || 'B2B'})</p>
                <p className="font-mono text-[#B69A61]">{p.supplierGstin}</p>
              </div>
            ) : (
              <p className="text-rose-400 mt-1 italic">Missing from GSTR-2B</p>
            )}
          </div>
        </div>

        {/* AI-Assisted Discrepancy Analysis Box */}
        <div className="bg-[#191919] p-3.5 rounded border border-[#2D2D2D] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E5D7B7]">
              <Sparkles className="w-3.5 h-3.5 text-[#B69A61]" />
              <span>AI CA Exception Analysis (Gemini 3.8 Flash)</span>
            </div>
            {aiAnalysis && (
              <button
                onClick={copyAiText}
                className="flex items-center gap-1 text-[11px] text-[#8E877C] hover:text-[#F5F0E6] px-1.5 py-0.5 rounded border border-[#333333]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          {aiAnalysis ? (
            <div className="bg-[#121212] p-3 rounded text-[11px] text-[#C5BDB0] leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap font-sans border border-[#222222]">
              {aiAnalysis}
            </div>
          ) : (
            <p className="text-[11px] text-[#8E877C]">
              Generate a structured legal observation explaining why this discrepancy occurred, whether Sec 16(2)(aa) is violated, and specific verification steps for accounts payable.
            </p>
          )}

          <button
            onClick={handleGenerateAiAnalysis}
            disabled={isAiLoading}
            className="w-full flex items-center justify-center gap-1.5 bg-[#252525] hover:bg-[#2F2F2F] text-[#F5F0E6] border border-[#383838] hover:border-[#B69A61]/50 py-2 rounded font-medium transition-colors disabled:opacity-50"
          >
            {isAiLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B69A61]" />
                <span>Generating Deterministic CA Findings...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#B69A61]" />
                <span>{aiAnalysis ? 'Regenerate AI Analysis' : 'Run AI Exception Analysis'}</span>
              </>
            )}
          </button>
        </div>

        {/* Auditor Review Action & Notes */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-[#8E877C] uppercase">Auditor Review Notes</label>
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Add internal remarks, client query reference, or justification for manual override..."
            className="w-full h-20 bg-[#121212] border border-[#2B2B2B] rounded p-2.5 text-xs text-[#F5F0E6] placeholder-[#666666] focus:outline-none focus:border-[#B69A61]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => onUpdateReviewStatus(matchGroup.id, 'ACCEPTED', reviewNotes)}
            className="flex-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 py-2 rounded font-medium transition-colors"
          >
            Approve / Accept Match
          </button>
          <button
            onClick={() => onUpdateReviewStatus(matchGroup.id, 'FLAGGED_FOR_CLIENT', reviewNotes)}
            className="flex-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700/60 py-2 rounded font-medium transition-colors"
          >
            Flag for Client Query
          </button>
        </div>

        {onUnmatchGroup && (b && p) && (
          <button
            onClick={() => onUnmatchGroup(matchGroup.id)}
            className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/40 py-1.5 rounded transition-colors text-[11px]"
          >
            Unlink / Unmatch This Pair
          </button>
        )}
      </div>
    </div>
  );
};
