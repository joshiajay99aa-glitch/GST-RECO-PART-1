import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  Mail,
  Shield,
  Loader2,
  Copy,
  Check,
  Download,
  AlertCircle,
  HelpCircle,
  Building,
} from 'lucide-react';
import { ClientProfile, MatchGroup, ReconciliationProject } from '../../types/gst';

interface AiAssistantViewProps {
  client: ClientProfile;
  project: ReconciliationProject;
  matchGroups: MatchGroup[];
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  client,
  project,
  matchGroups,
}) => {
  const [activeTab, setActiveTab] = useState<'EXCEPTIONS' | 'CLIENT_QUERY' | 'NOTICE_REPLY'>('EXCEPTIONS');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(matchGroups[0]?.id || '');
  const [additionalAuditorNotes, setAdditionalAuditorNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Exception groups (unmatched or tax mismatches)
  const exceptionGroups = matchGroups.filter(
    (g) =>
      g.matchStatus !== 'EXACT_MATCH' &&
      g.matchStatus !== 'MATCHED_NORMALIZED_INV'
  );

  const handleGenerateInvestigation = async () => {
    const targetGroup = matchGroups.find((g) => g.id === selectedGroupId) || matchGroups[0];
    if (!targetGroup) return;

    setIsGenerating(true);
    setGeneratedOutput('');
    try {
      const res = await fetch('/api/ai/analyze-exception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchGroup: targetGroup,
          clientInfo: client,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Server error generating analysis');
      }

      const data = await res.json();
      setGeneratedOutput(data.text);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error contacting Gemini AI backend service');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCommunication = async (commType: 'client_query' | 'notice_reply') => {
    setIsGenerating(true);
    setGeneratedOutput('');
    try {
      // Send top exceptions summary
      const topExceptions = exceptionGroups.slice(0, 10).map((g) => ({
        GroupId: g.id,
        Status: g.matchStatus,
        SupplierGSTIN: g.booksRecord?.supplierGstin || g.portalRecord?.supplierGstin,
        SupplierName: g.booksRecord?.supplierName || g.portalRecord?.supplierName,
        BooksInvoiceNo: g.booksRecord?.invoiceNumber,
        PortalInvoiceNo: g.portalRecord?.invoiceNumber,
        TaxableDiff: g.diffTaxable,
        TotalTaxDiff: (g.diffIgst || 0) + (g.diffCgst || 0) + (g.diffSgst || 0),
        DateDiffDays: g.dateDiffDays,
        ReasonApplied: g.matchingRuleApplied,
      }));

      const res = await fetch('/api/ai/draft-communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: commType,
          records: topExceptions,
          clientInfo: client,
          additionalNotes: additionalAuditorNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Server error drafting communication');
      }

      const data = await res.json();
      setGeneratedOutput(data.text);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error drafting communication with Gemini AI');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedOutput) return;
    navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsTextFile = () => {
    if (!generatedOutput) return;
    const blob = new Blob([generatedOutput], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GST_Recon_${activeTab}_${client.gstin}_${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-[#181818] p-5 rounded-lg border border-[#2B2B2B]">
        <div className="flex items-center gap-2 text-xs text-[#B69A61] font-mono uppercase">
          <span>Module 10</span>
          <span>•</span>
          <span>AI-Assisted CA Audit & Legal Draftsman</span>
        </div>
        <h2 className="text-lg font-semibold text-[#F5F0E6] mt-1 flex items-center gap-2">
          <span>Gemini 3.8 Flash GST Intelligence Engine</span>
          <span className="text-[10px] font-mono bg-[#B69A61]/15 text-[#B69A61] px-2 py-0.5 rounded border border-[#B69A61]/30">
            SECURE SERVER-SIDE
          </span>
        </h2>
        <p className="text-xs text-[#8E877C] mt-0.5">
          Diagnose invoice discrepancy root causes, draft official client audit query memorandums, and draft replies to GST officer notices (ASMT-10 / DRC-01) strictly grounded on actual reconciled numbers.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#262626] text-xs">
        <button
          onClick={() => {
            setActiveTab('EXCEPTIONS');
            setGeneratedOutput('');
          }}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'EXCEPTIONS'
              ? 'border-[#B69A61] text-[#B69A61] bg-[#1A1A1A]'
              : 'border-transparent text-[#8E877C] hover:text-[#F5F0E6]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Exception Root-Cause Investigator</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('CLIENT_QUERY');
            setGeneratedOutput('');
          }}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'CLIENT_QUERY'
              ? 'border-[#B69A61] text-[#B69A61] bg-[#1A1A1A]'
              : 'border-transparent text-[#8E877C] hover:text-[#F5F0E6]'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Draft Client AP Query Memo</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('NOTICE_REPLY');
            setGeneratedOutput('');
          }}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'NOTICE_REPLY'
              ? 'border-[#B69A61] text-[#B69A61] bg-[#1A1A1A]'
              : 'border-transparent text-[#8E877C] hover:text-[#F5F0E6]'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Draft GST Notice Reply (ASMT-10 / DRC-01)</span>
        </button>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Column */}
        <div className="lg:col-span-5 space-y-4">
          {activeTab === 'EXCEPTIONS' && (
            <div className="bg-[#1C1C1C] p-4 rounded-lg border border-[#2D2D2D] space-y-3 text-xs">
              <label className="text-[11px] font-semibold text-[#8E877C] uppercase block">
                Select Discrepancy Record to Diagnose
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full bg-[#121212] border border-[#2D2D2D] rounded p-2 text-xs text-[#F5F0E6] focus:outline-none focus:border-[#B69A61]"
              >
                {exceptionGroups.map((g) => {
                  const inv = g.booksRecord?.invoiceNumber || g.portalRecord?.invoiceNumber || 'N/A';
                  const gstin = g.booksRecord?.supplierGstin || g.portalRecord?.supplierGstin || 'N/A';
                  return (
                    <option key={g.id} value={g.id}>
                      {g.id} • {inv} ({g.matchStatus})
                    </option>
                  );
                })}
              </select>

              <button
                onClick={handleGenerateInvestigation}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-[#B69A61] hover:bg-[#C8AC70] text-[#111111] font-semibold py-2.5 rounded transition-all disabled:opacity-50 shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Deterministic Evidence...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Exception Audit Memo</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'CLIENT_QUERY' && (
            <div className="bg-[#1C1C1C] p-4 rounded-lg border border-[#2D2D2D] space-y-3 text-xs">
              <h4 className="font-semibold text-[#F5F0E6]">Audit Query Memorandum Parameters</h4>
              <p className="text-[11px] text-[#8E877C]">
                Drafts a formal query list from Statutory Auditors to the client management covering {exceptionGroups.length} reconciliation discrepancies.
              </p>

              <div>
                <label className="text-[11px] font-semibold text-[#8E877C] uppercase block mb-1">
                  Additional Auditor Instructions / Context
                </label>
                <textarea
                  value={additionalAuditorNotes}
                  onChange={(e) => setAdditionalAuditorNotes(e.target.value)}
                  placeholder="e.g. Request physical copy of vendor tax invoices and proof of bank payment within 180 days..."
                  className="w-full h-24 bg-[#121212] border border-[#2D2D2D] rounded p-2.5 text-xs text-[#F5F0E6] placeholder-[#666666] focus:outline-none focus:border-[#B69A61]"
                />
              </div>

              <button
                onClick={() => handleGenerateCommunication('client_query')}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-[#B69A61] hover:bg-[#C8AC70] text-[#111111] font-semibold py-2.5 rounded transition-all disabled:opacity-50 shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Drafting Professional Memorandum...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Draft Client Query Memo</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'NOTICE_REPLY' && (
            <div className="bg-[#1C1C1C] p-4 rounded-lg border border-[#2D2D2D] space-y-3 text-xs">
              <h4 className="font-semibold text-[#F5F0E6]">GST Notice Defense Submissions</h4>
              <p className="text-[11px] text-[#8E877C]">
                Drafts an official reply to Form GST ASMT-10 or DRC-01 notice citing CBIC Circulars 183/2022 & 193/2023, bona fide compliance, and reconciliation schedules.
              </p>

              <div>
                <label className="text-[11px] font-semibold text-[#8E877C] uppercase block mb-1">
                  Notice Details / Officer Observations
                </label>
                <textarea
                  value={additionalAuditorNotes}
                  onChange={(e) => setAdditionalAuditorNotes(e.target.value)}
                  placeholder="e.g. Notice Reference: ZD271024001928A date 05-Oct-2024 alleging ITC mismatch under Table 4(A)(5)..."
                  className="w-full h-24 bg-[#121212] border border-[#2D2D2D] rounded p-2.5 text-xs text-[#F5F0E6] placeholder-[#666666] focus:outline-none focus:border-[#B69A61]"
                />
              </div>

              <button
                onClick={() => handleGenerateCommunication('notice_reply')}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-[#B69A61] hover:bg-[#C8AC70] text-[#111111] font-semibold py-2.5 rounded transition-all disabled:opacity-50 shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Drafting Legal Written Submissions...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Draft Notice Defense Reply</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* CA Professional Guardrails Box */}
          <div className="bg-[#141414] p-3.5 rounded border border-[#262626] text-[11px] text-[#8E877C] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#B69A61] font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Statutory Guardrails Enforced</span>
            </div>
            <p>• Grounded solely on uploaded invoice numbers and calculated variance values.</p>
            <p>• Clearly separates verified facts from possible root-causes.</p>
            <p>• AI never autonomously approves or reverses ITC.</p>
            <p>• All submissions require authorized Chartered Accountant review & signature.</p>
          </div>
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-7 bg-[#161616] border border-[#282828] rounded-lg p-5 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#B69A61]" />
              <h3 className="text-xs font-semibold text-[#F5F0E6] uppercase tracking-wider">
                Generated Legal & Audit Memorandum
              </h3>
            </div>

            {generatedOutput && (
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 text-[11px] text-[#C5BDB0] hover:text-[#F5F0E6] bg-[#222222] hover:bg-[#2A2A2A] px-2.5 py-1 rounded border border-[#333333] transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  onClick={downloadAsTextFile}
                  className="flex items-center gap-1 text-[11px] text-[#C5BDB0] hover:text-[#F5F0E6] bg-[#222222] hover:bg-[#2A2A2A] px-2.5 py-1 rounded border border-[#333333] transition-colors"
                  title="Download as Markdown"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 mt-4">
            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center text-[#8E877C] space-y-3 py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#B69A61]" />
                <p className="text-xs">Reasoning with Gemini 3.8 Flash across tax provisions & invoice facts...</p>
              </div>
            ) : generatedOutput ? (
              <div className="bg-[#121212] p-4 rounded border border-[#222222] text-xs text-[#E5D7B7] leading-relaxed whitespace-pre-wrap font-sans max-h-[600px] overflow-y-auto">
                {generatedOutput}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#666666] space-y-2 py-16 text-center">
                <Sparkles className="w-8 h-8 text-[#333333]" />
                <p className="text-xs">Select parameters on the left and click Generate to run AI analysis.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
