import React, { useState } from 'react';
import {
  Building2,
  Plus,
  FolderKanban,
  Trash2,
  Archive,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Shield,
  Edit3,
} from 'lucide-react';
import { ClientProfile, ReconciliationProject, ReconciliationType } from '../../types/gst';
import { validateGSTIN } from '../../utils/gstValidator';

interface ClientManagerViewProps {
  clients: ClientProfile[];
  projects: ReconciliationProject[];
  activeClient: ClientProfile;
  activeProject: ReconciliationProject;
  onSelectClient: (client: ClientProfile) => void;
  onSelectProject: (proj: ReconciliationProject) => void;
  onCreateClient: (newClient: ClientProfile) => void;
  onCreateProject: (newProject: ReconciliationProject) => void;
  onDeleteProject: (projectId: string) => void;
  onArchiveProject: (projectId: string) => void;
}

export const ClientManagerView: React.FC<ClientManagerViewProps> = ({
  clients,
  projects,
  activeClient,
  activeProject,
  onSelectClient,
  onSelectProject,
  onCreateClient,
  onCreateProject,
  onDeleteProject,
  onArchiveProject,
}) => {
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // New Client Form State
  const [legalName, setLegalName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [gstinInput, setGstinInput] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [gstinValidation, setGstinValidation] = useState<{ isValid: boolean; stateName?: string; error?: string } | null>(null);

  // New Project Form State
  const [projectName, setProjectName] = useState('');
  const [reconType, setReconType] = useState<ReconciliationType>('PR_VS_2B');
  const [financialYear, setFinancialYear] = useState('2024-25');
  const [returnPeriod, setReturnPeriod] = useState('Q3 (Oct-Dec 2024)');

  const handleGstinChange = (val: string) => {
    const uppercase = val.toUpperCase().trim();
    setGstinInput(uppercase);
    if (uppercase.length === 15) {
      setGstinValidation(validateGSTIN(uppercase));
    } else {
      setGstinValidation(null);
    }
  };

  const submitCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateGSTIN(gstinInput);
    if (!validation.isValid) {
      alert(`Invalid GSTIN: ${validation.error}`);
      return;
    }

    const stateCode = gstinInput.substring(0, 2);
    const newClient: ClientProfile = {
      id: `client_${Date.now()}`,
      legalName: legalName.trim(),
      tradeName: tradeName.trim() || undefined,
      gstin: gstinInput,
      stateCode,
      stateName: validation.stateName || 'Unknown State',
      contactPerson: contactPerson.trim() || undefined,
      email: email.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onCreateClient(newClient);
    setShowNewClientModal(false);
    setLegalName('');
    setTradeName('');
    setGstinInput('');
    setContactPerson('');
    setEmail('');
    setGstinValidation(null);
  };

  const submitCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    const newProject: ReconciliationProject = {
      id: `proj_${Date.now()}`,
      clientId: activeClient.id,
      projectName: projectName.trim(),
      reconciliationType: reconType,
      financialYear,
      returnPeriod,
      createdAt: new Date().toISOString(),
      status: 'IN_PROGRESS',
      makerChecker: {
        preparedBy: 'Current Auditor',
        preparedAt: new Date().toISOString(),
      },
      matchingConfig: {
        dateToleranceDays: 30,
        amountToleranceRupees: 2.0,
        ignoreCaseAndSpecialChars: true,
        preserveLeadingZeroes: true,
        allowComponentShiftCheck: true,
      },
    };

    onCreateProject(newProject);
    setShowNewProjectModal(false);
    setProjectName('');
  };

  const clientProjects = projects.filter((p) => p.clientId === activeClient.id);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181818] p-5 rounded-lg border border-[#2B2B2B]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#B69A61] font-mono uppercase">
            <span>Module B</span>
            <span>•</span>
            <span>Client Profiles & Multi-Entity GSTIN Management</span>
          </div>
          <h2 className="text-lg font-semibold text-[#F5F0E6] mt-1">Clients & Reconciliation Projects</h2>
          <p className="text-xs text-[#8E877C] mt-0.5">
            Strict client and GSTIN data isolation. Manage multiple clients and financial year audit workspaces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewClientModal(true)}
            className="flex items-center gap-1.5 bg-[#252525] hover:bg-[#2F2F2F] text-[#F5F0E6] border border-[#383838] px-3.5 py-2 rounded text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#B69A61]" />
            <span>Add New Client</span>
          </button>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center gap-1.5 bg-[#B69A61] hover:bg-[#C8AC70] text-[#111111] font-semibold px-3.5 py-2 rounded text-xs transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* Client Entities Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-[#8E877C] uppercase tracking-wider">
          Registered Client Tax Entities ({clients.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => {
            const isActive = c.id === activeClient.id;
            const projectCount = projects.filter((p) => p.clientId === c.id).length;

            return (
              <div
                key={c.id}
                onClick={() => onSelectClient(c)}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1C1C1C] border-[#B69A61] shadow-md shadow-[#B69A61]/5'
                    : 'bg-[#161616] border-[#282828] hover:border-[#383838]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded bg-[#B69A61]/15 border border-[#B69A61]/30 flex items-center justify-center text-[#B69A61] shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-mono bg-[#B69A61]/20 text-[#B69A61] px-2 py-0.5 rounded border border-[#B69A61]/40">
                      ACTIVE ENTITY
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <h4 className="text-xs font-semibold text-[#F5F0E6] truncate" title={c.legalName}>
                    {c.legalName}
                  </h4>
                  {c.tradeName && <p className="text-[11px] text-[#8E877C] truncate">{c.tradeName}</p>}
                </div>

                <div className="mt-3 pt-3 border-t border-[#262626] flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-[#8E877C] text-[10px] block">GSTIN:</span>
                    <span className="font-mono text-[#B69A61] font-semibold">{c.gstin}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#8E877C] text-[10px] block">Jurisdiction:</span>
                    <span className="text-[#C5BDB0]">{c.stateName}</span>
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-[#706B62] flex items-center justify-between">
                  <span>{projectCount} Audit Project{projectCount === 1 ? '' : 's'}</span>
                  <span>Created {new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Projects List for Active Client */}
      <div className="bg-[#181818] rounded-lg border border-[#282828] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#282828] flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-[#F5F0E6] uppercase tracking-wider">
              Reconciliation Projects for {activeClient.legalName}
            </h3>
            <p className="text-[11px] text-[#8E877C]">
              Isolated project datasets and maker-checker sign-off history
            </p>
          </div>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center gap-1 text-xs text-[#B69A61] hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Audit Project</span>
          </button>
        </div>

        <div className="divide-y divide-[#242424]">
          {clientProjects.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#7E776C]">
              No reconciliation projects created for this client yet.
            </div>
          ) : (
            clientProjects.map((p) => {
              const isActive = p.id === activeProject.id;
              return (
                <div
                  key={p.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#1E1E1E] transition-colors ${
                    isActive ? 'bg-[#1C1C1C]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-[#242424] flex items-center justify-center text-[#8E877C] shrink-0 mt-0.5">
                      <FolderKanban className="w-4 h-4 text-[#B69A61]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-[#F5F0E6]">{p.projectName}</h4>
                        {isActive && (
                          <span className="text-[10px] font-mono text-[#B69A61] bg-[#B69A61]/15 px-1.5 py-0.2 rounded">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8E877C] mt-1 font-mono">
                        <span>FY: <strong className="text-[#C5BDB0]">{p.financialYear}</strong></span>
                        <span>•</span>
                        <span>Period: <strong className="text-[#C5BDB0]">{p.returnPeriod}</strong></span>
                        <span>•</span>
                        <span>Type: <strong className="text-[#B69A61]">{p.reconciliationType}</strong></span>
                        <span>•</span>
                        <span>Status: <strong className="text-[#F5F0E6]">{p.status}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isActive && (
                      <button
                        onClick={() => onSelectProject(p)}
                        className="bg-[#262626] hover:bg-[#303030] text-[#F5F0E6] text-xs px-3 py-1.5 rounded transition-colors"
                      >
                        Switch Project
                      </button>
                    )}
                    <button
                      onClick={() => onArchiveProject(p.id)}
                      className="p-1.5 text-[#8E877C] hover:text-[#C5BDB0] hover:bg-[#282828] rounded transition-colors"
                      title="Archive Project"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete project "${p.projectName}"? All reconciled data will be deleted.`)) {
                          onDeleteProject(p.id);
                        }
                      }}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded transition-colors"
                      title="Delete Project with confirmation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* New Client Modal */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form
            onSubmit={submitCreateClient}
            className="bg-[#181818] border border-[#333333] rounded-lg max-w-lg w-full p-5 space-y-4 shadow-2xl text-xs text-[#F5F0E6]"
          >
            <div className="flex items-center justify-between border-b border-[#282828] pb-3">
              <h3 className="text-sm font-semibold text-[#F5F0E6]">Add New Client Profile</h3>
              <button
                type="button"
                onClick={() => setShowNewClientModal(false)}
                className="text-[#8E877C] hover:text-[#F5F0E6]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#8E877C] uppercase block mb-1">
                  Legal Name of Business / Company *
                </label>
                <input
                  type="text"
                  required
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. Apex Global Logistics Private Limited"
                  className="w-full bg-[#121212] border border-[#2D2D2D] rounded p-2 text-xs text-[#F5F0E6] focus:outline-none focus:border-[#B69A61]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#8E877C] uppercase block mb-1">
                  Trade Name (Optional)
                </label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  placeholder="e.g. Apex Cargo"
                  className="w-full bg-[#121212] border border-[#2D2D2D] rounded p-2 text-xs text-[#F5F0E6] focus:outline-none focus:border-[#B69A61]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#8E877C] uppercase block mb-1">
                  15-Digit GSTIN *
                </label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={gstinInput}
                  onChange={(e) => handleGstinChange(e.target.value)}
                  placeholder="e.g. 27AABCA1234F1ZQ"
                  className="w-full bg-[#121212] border border-[#2D2D2D] rounded p-2 text-xs font-mono text-[#B69A61] focus:outline-none focus:border-[#B69A61]"
                />
                {gstinValidation && (
                  <p
                    className={`text-[11px] mt-1 ${
                      gstinValidation.isValid ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {gstinValidation.isValid
                      ? `✓ Valid GSTIN (State: ${gstinValidation.stateName})`
                      : `✗ ${gstinValidation.error}`}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#8E877C] uppercase block mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Finance Head"
                    className="w-full bg-[#121212] border border-[#2D2D2D] rounded p-2 text-xs text-[#F5F0E6] focus:outline-none focus:border-[#B69A61]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#8E877C] uppercase block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. accounts@client.in"
                    className="w-full bg-[#121212] border border-[#2D2D2D] rounded p-2 text-xs text-[#F5F0E6] focus:outline-none focus:border-[#B69A61]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#282828]">
              <button
                type="button"
                onClick={() => setShowNewClientModal(false)}
                className="px-3 py-1.5 rounded bg-[#242424] hover:bg-[#2C2C2C] text-[#C5BDB0]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#B69A61] hover:bg-[#C8AC70] text-[#111111] font-semibold"
              >
                Save Client Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form
            onSubmit={submitCreateProject}
            className="bg-[#181818] border border-[#333333] rounded-lg max-w-lg w-full p-5 space-y-4 shadow-2xl text-xs text-[#F5F0E6]"
          >
            <div className="flex items-center justify-between border-b border-[#282828] pb-3">
              <h3 className="text-sm font-semibold text-[#F5F0E6]">Create New Reconciliation Project</h3>
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="text-[#8E877C] hover:text-[#F5F0E6]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#8E877C] uppercase block mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. FY 2024-25 Q4 - Purchase Register vs GSTR-2B Audit"
                  className="w-full bg-[#121212] border border-[#2D2D2D] rounded p-2 text-xs text-[#F5F0E6] focus:outline-none focus:border-[#B69A61]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#8E877C] uppercase block mb-1">
                  Reconciliation Type *
                </label>
                <select
                  value={reconType}
                  onChange={(e) => setReconType(e.target.value as ReconciliationType)}
                  className="w-full bg-[#121212] border border-[#2D2D2D] rounded p-2 text-xs text-[#F5F0E6] focus:outline-none focus:border-[#B69A61]"
                >
                  <option value="PR_VS_2B">Purchase Register vs GSTR-2B (Primary ITC Audit)</option>
                  <option value="PR_VS_2A">Purchase Register vs GSTR-2A</option>
                  <option value="2A_VS_2B">GSTR-2A vs GSTR-2B (Static vs Dynamic)</option>
                  <option value="PR_VS_3B">Purchase Register vs GSTR-3B ITC Claimed</option>
                  <option value="2B_VS_3B">GSTR-2B vs GSTR-3B ITC Claimed</option>
                  <option value="SR_VS_GSTR1">Sales Register vs GSTR-1</option>
                  <option value="SR_VS_3B">Sales Register vs GSTR-3B Outward Tax</option>
                  <option value="GSTR1_VS_3B">GSTR-1 vs GSTR-3B Tax Liability</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#8E877C] uppercase block mb-1">
                    Financial Year
                  </label>
                  <select
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2D2D2D] rounded p-2 text-xs text-[#F5F0E6] focus:outline-none focus:border-[#B69A61]"
                  >
                    {['2024-25', '2023-24', '2022-23', '2021-22', '2020-21', '2019-20', '2018-19', '2017-18'].map(
                      (fy) => (
                        <option key={fy} value={fy}>
                          FY {fy}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#8E877C] uppercase block mb-1">
                    Return Period
                  </label>
                  <input
                    type="text"
                    value={returnPeriod}
                    onChange={(e) => setReturnPeriod(e.target.value)}
                    placeholder="e.g. October 2024 or Q3"
                    className="w-full bg-[#121212] border border-[#2D2D2D] rounded p-2 text-xs text-[#F5F0E6] focus:outline-none focus:border-[#B69A61]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#282828]">
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="px-3 py-1.5 rounded bg-[#242424] hover:bg-[#2C2C2C] text-[#C5BDB0]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#B69A61] hover:bg-[#C8AC70] text-[#111111] font-semibold"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
