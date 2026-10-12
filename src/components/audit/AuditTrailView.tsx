import React, { useState } from 'react';
import {
  History,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Clock,
  User,
  FileText,
  Lock,
} from 'lucide-react';
import { AuditTrailEntry, ReconciliationProject } from '../../types/gst';

interface AuditTrailViewProps {
  auditLog: AuditTrailEntry[];
  project: ReconciliationProject;
  onUpdateMakerChecker: (updatedProject: ReconciliationProject) => void;
  onAddAuditEntry: (action: string, category: any, details: string) => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  auditLog,
  project,
  onUpdateMakerChecker,
  onAddAuditEntry,
}) => {
  const [preparedBy, setPreparedBy] = useState(project.makerChecker.preparedBy);
  const [reviewedBy, setReviewedBy] = useState(project.makerChecker.reviewedBy || '');
  const [approvedBy, setApprovedBy] = useState(project.makerChecker.approvedBy || '');
  const [remarks, setRemarks] = useState(project.makerChecker.remarks || '');
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenModal, setShowReopenModal] = useState(false);

  const handleSaveSignOff = (newStatus: 'UNDER_REVIEW' | 'APPROVED') => {
    const updated: ReconciliationProject = {
      ...project,
      status: newStatus,
      makerChecker: {
        ...project.makerChecker,
        preparedBy,
        reviewedBy: reviewedBy || undefined,
        reviewedAt: reviewedBy ? new Date().toISOString() : undefined,
        approvedBy: newStatus === 'APPROVED' ? approvedBy || 'Partner' : undefined,
        approvedAt: newStatus === 'APPROVED' ? new Date().toISOString() : undefined,
        remarks,
      },
    };

    onUpdateMakerChecker(updated);
    onAddAuditEntry(
      `Project Status Changed to ${newStatus}`,
      'REVIEW',
      `Maker-Checker updated: Prepared by ${preparedBy}, Reviewed by ${reviewedBy || 'N/A'}, Approved by ${approvedBy || 'N/A'}. Remarks: ${remarks}`
    );
  };

  const handleReopenProject = () => {
    if (!reopenReason.trim()) return;

    const updated: ReconciliationProject = {
      ...project,
      status: 'IN_PROGRESS',
      makerChecker: {
        ...project.makerChecker,
        approvedBy: undefined,
        approvedAt: undefined,
        remarks: `Re-opened: ${reopenReason}`,
      },
    };

    onUpdateMakerChecker(updated);
    onAddAuditEntry('Project Re-opened', 'REVIEW', `Re-opened by Auditor. Reason: ${reopenReason}`);
    setShowReopenModal(false);
    setReopenReason('');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="bg-[#181818] p-5 rounded-lg border border-[#2B2B2B]">
        <div className="flex items-center gap-2 text-xs text-[#B69A61] font-mono uppercase">
          <span>Module 14</span>
          <span>•</span>
          <span>Maker-Checker Controls & Immutable Audit Trail</span>
        </div>
        <h2 className="text-lg font-semibold text-[#F5F0E6] mt-1">Audit Trail & Governance Controls</h2>
        <p className="text-xs text-[#8E877C] mt-0.5">
          Four-eyes principle: Preparation by Articled Assistant, technical review by Audit Manager, and statutory sign-off by Chartered Accountant Partner.
        </p>
      </div>

      {/* Maker-Checker Workflow Card */}
      <div className="bg-[#1C1C1C] rounded-lg border border-[#2D2D2D] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#B69A61]" />
            <h3 className="text-xs font-semibold text-[#F5F0E6] uppercase tracking-wider">
              Maker-Checker Sign-off Governance
            </h3>
          </div>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              project.status === 'APPROVED'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                : project.status === 'UNDER_REVIEW'
                ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                : 'bg-[#222222] text-[#8E877C] border-[#333333]'
            }`}
          >
            STATUS: {project.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Step 1: Prepared By */}
          <div className="bg-[#141414] p-3.5 rounded border border-[#262626] space-y-2">
            <div className="flex items-center justify-between text-[#8E877C]">
              <span className="text-[10px] uppercase font-semibold">1. Maker (Prepared By)</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <input
              type="text"
              value={preparedBy}
              onChange={(e) => setPreparedBy(e.target.value)}
              placeholder="Assistant / Article Name"
              className="w-full bg-[#1C1C1C] border border-[#2D2D2D] rounded p-2 text-xs text-[#F5F0E6] focus:outline-none focus:border-[#B69A61]"
            />
            <p className="text-[10px] text-[#706B62]">
              Logged on: {new Date(project.makerChecker.preparedAt || project.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Step 2: Reviewed By */}
          <div className="bg-[#141414] p-3.5 rounded border border-[#262626] space-y-2">
            <div className="flex items-center justify-between text-[#8E877C]">
              <span className="text-[10px] uppercase font-semibold">2. Checker (Reviewed By)</span>
              {project.makerChecker.reviewedBy ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>
            <input
              type="text"
              value={reviewedBy}
              onChange={(e) => setReviewedBy(e.target.value)}
              placeholder="CA Audit Manager Name"
              className="w-full bg-[#1C1C1C] border border-[#2D2D2D] rounded p-2 text-xs text-[#F5F0E6] focus:outline-none focus:border-[#B69A61]"
            />
            <p className="text-[10px] text-[#706B62]">
              {project.makerChecker.reviewedAt ? `Reviewed: ${new Date(project.makerChecker.reviewedAt).toLocaleString()}` : 'Pending review completion'}
            </p>
          </div>

          {/* Step 3: Approved By */}
          <div className="bg-[#141414] p-3.5 rounded border border-[#262626] space-y-2">
            <div className="flex items-center justify-between text-[#8E877C]">
              <span className="text-[10px] uppercase font-semibold">3. Partner Sign-off (Approved)</span>
              {project.status === 'APPROVED' ? (
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>
            <input
              type="text"
              value={approvedBy}
              onChange={(e) => setApprovedBy(e.target.value)}
              placeholder="Chartered Accountant Partner Name"
              className="w-full bg-[#1C1C1C] border border-[#2D2D2D] rounded p-2 text-xs text-[#F5F0E6] focus:outline-none focus:border-[#B69A61]"
            />
            <p className="text-[10px] text-[#706B62]">
              {project.makerChecker.approvedAt ? `Approved: ${new Date(project.makerChecker.approvedAt).toLocaleString()}` : 'Pending Partner approval'}
            </p>
          </div>
        </div>

        {/* Auditor Remarks */}
        <div className="space-y-1 text-xs">
          <label className="text-[11px] font-semibold text-[#8E877C] uppercase">
            Statutory Audit Notes & Conclusion Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Document reconciliation conclusions, client representation letter received, or DRC-01B risks communicated..."
            className="w-full h-20 bg-[#141414] border border-[#2D2D2D] rounded p-2.5 text-xs text-[#F5F0E6] placeholder-[#666666] focus:outline-none focus:border-[#B69A61]"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {project.status === 'APPROVED' ? (
            <button
              onClick={() => setShowReopenModal(true)}
              className="flex items-center gap-1.5 bg-[#252525] hover:bg-[#303030] text-amber-400 border border-amber-900/40 text-xs px-3.5 py-2 rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-open Completed Project</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => handleSaveSignOff('UNDER_REVIEW')}
                className="bg-[#242424] hover:bg-[#2E2E2E] text-[#F5F0E6] border border-[#383838] text-xs px-4 py-2 rounded transition-colors"
              >
                Mark Under Manager Review
              </button>
              <button
                onClick={() => handleSaveSignOff('APPROVED')}
                className="bg-[#B69A61] hover:bg-[#C8AC70] text-[#111111] font-semibold text-xs px-5 py-2 rounded transition-colors shadow-sm"
              >
                Partner Final Approval & Lock
              </button>
            </>
          )}
        </div>
      </div>

      {/* Immutable Audit Log */}
      <div className="bg-[#181818] rounded-lg border border-[#282828] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#282828] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#B69A61]" />
            <h3 className="text-xs font-semibold text-[#F5F0E6] uppercase tracking-wider">
              Project Audit Trail Register ({auditLog.length} events)
            </h3>
          </div>
          <span className="text-[10px] text-[#8E877C]">Append-only audit ledger</span>
        </div>

        <div className="divide-y divide-[#242424] max-h-96 overflow-y-auto">
          {auditLog.map((entry) => (
            <div key={entry.id} className="p-3.5 text-xs hover:bg-[#1E1E1E] transition-colors flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#F5F0E6]">{entry.action}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#242424] text-[#B69A61]">
                    {entry.category}
                  </span>
                </div>
                <p className="text-[11px] text-[#A39E93]">{entry.details}</p>
              </div>

              <div className="text-right text-[10px] text-[#706B62] shrink-0 font-mono">
                <div>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div>{new Date(entry.timestamp).toLocaleDateString()}</div>
                <div className="text-[#8E877C]">{entry.userName}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#181818] border border-[#333333] rounded-lg max-w-md w-full p-5 space-y-4 shadow-2xl text-xs text-[#F5F0E6]">
            <h3 className="text-sm font-semibold text-[#F5F0E6]">Re-open Completed Reconciliation</h3>
            <p className="text-[11px] text-[#8E877C]">
              Please state the mandatory reason for re-opening an approved audit project (e.g. Revised GSTR-1 received or vendor credit note adjustment). This will be recorded in the audit trail.
            </p>

            <div>
              <label className="text-[11px] font-semibold text-[#8E877C] uppercase block mb-1">
                Reason for Re-opening *
              </label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g. Received revised Tally purchase register with amended invoice numbers..."
                className="w-full h-24 bg-[#121212] border border-[#2D2D2D] rounded p-2 text-xs text-[#F5F0E6] focus:outline-none focus:border-[#B69A61]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#282828]">
              <button
                onClick={() => setShowReopenModal(false)}
                className="px-3 py-1.5 rounded bg-[#242424] hover:bg-[#2C2C2C] text-[#C5BDB0]"
              >
                Cancel
              </button>
              <button
                disabled={!reopenReason.trim()}
                onClick={handleReopenProject}
                className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-[#111111] font-semibold disabled:opacity-50"
              >
                Confirm & Re-open
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
