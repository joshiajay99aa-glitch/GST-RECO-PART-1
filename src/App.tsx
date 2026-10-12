/**
 * GST Reconciliation Pro - Main Application Entrypoint
 * Indian CA Firm Financial & Tax Audit Platform
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  AuditTrailEntry,
  ClientProfile,
  DatasetSource,
  MatchGroup,
  NormalisedInvoiceRecord,
  RawInvoiceRecord,
  ReconciliationProject,
} from './types/gst';
import {
  getSyntheticGstr2bRecords,
  getSyntheticPurchaseRegister,
  SAMPLE_CLIENT,
  SAMPLE_PROJECT,
} from './data/syntheticSampleData';
import { runGSTReconciliationEngine } from './services/matchingEngine';
import { calculateControlTotals } from './services/controlTotalsService';
import { exportReconciliationToExcel } from './services/excelExportService';
import { normaliseInvoiceRecords } from './services/normalisationService';

import { Sidebar, NavTab } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ClientManagerView } from './components/clients/ClientManagerView';
import { UploadAndMapView } from './components/upload/UploadAndMapView';
import { WorkbenchView } from './components/workbench/WorkbenchView';
import { Sec16AuditView } from './components/audit/Sec16AuditView';
import { Gstr3bComparisonView } from './components/comparison/Gstr3bComparisonView';
import { SalesReconciliationView } from './components/comparison/SalesReconciliationView';
import { AiAssistantView } from './components/ai/AiAssistantView';
import { AuditTrailView } from './components/audit/AuditTrailView';
import { ExportReportsView } from './components/export/ExportReportsView';

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [workbenchInitialFilter, setWorkbenchInitialFilter] = useState<string>('ALL');

  // Client & Project State
  const [clients, setClients] = useState<ClientProfile[]>([SAMPLE_CLIENT]);
  const [activeClient, setActiveClient] = useState<ClientProfile>(SAMPLE_CLIENT);
  const [projects, setProjects] = useState<ReconciliationProject[]>([SAMPLE_PROJECT]);
  const [activeProject, setActiveProject] = useState<ReconciliationProject>(SAMPLE_PROJECT);

  // Inward Datasets (Purchase Register & Portal Returns)
  const [booksRecords, setBooksRecords] = useState<NormalisedInvoiceRecord[]>(() =>
    getSyntheticPurchaseRegister()
  );
  const [portalRecords, setPortalRecords] = useState<NormalisedInvoiceRecord[]>(() =>
    getSyntheticGstr2bRecords()
  );

  // Audit Trail Ledger
  const [auditLog, setAuditLog] = useState<AuditTrailEntry[]>([
    {
      id: 'audit_01',
      timestamp: '2024-10-12T09:30:00Z',
      action: 'Initial File Import',
      category: 'IMPORT',
      details: 'Imported 12 purchase bills from Tally_PR_Oct_Dec_2024.xlsx',
      userName: 'Aditi Varma (Articled Assistant)',
    },
    {
      id: 'audit_02',
      timestamp: '2024-10-12T09:35:00Z',
      action: 'Portal File Ingestion',
      category: 'IMPORT',
      details: 'Ingested 10 invoices from official portal GSTR2B_27AABCZ1234D1ZP_Q3_2024.xlsx',
      userName: 'Aditi Varma (Articled Assistant)',
    },
    {
      id: 'audit_03',
      timestamp: '2024-10-12T09:40:00Z',
      action: 'Reconciliation Execution',
      category: 'MATCHING',
      details: 'Executed 5-stage deterministic matching engine (Amount tol: ₹2.00, Date tol: 30 days)',
      userName: 'System Rule Engine',
    },
  ]);

  const addAuditEntry = (action: string, category: any, details: string) => {
    const entry: AuditTrailEntry = {
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      category,
      details,
      userName: 'Chartered Accountant / Audit Team',
    };
    setAuditLog((prev) => [entry, ...prev]);
  };

  // Reconciled Match Groups State
  const [matchGroups, setMatchGroups] = useState<MatchGroup[]>(() => {
    const res = runGSTReconciliationEngine(
      getSyntheticPurchaseRegister(),
      getSyntheticGstr2bRecords(),
      SAMPLE_PROJECT.reconciliationType,
      SAMPLE_PROJECT.matchingConfig
    );
    return res.matchGroups;
  });

  // Recompute Control Totals Deterministically
  const controlTotals = useMemo(() => {
    return calculateControlTotals(booksRecords, portalRecords, matchGroups);
  }, [booksRecords, portalRecords, matchGroups]);

  // Run or re-run reconciliation engine
  const handleRunReconciliation = () => {
    const result = runGSTReconciliationEngine(
      booksRecords,
      portalRecords,
      activeProject.reconciliationType,
      activeProject.matchingConfig
    );
    setMatchGroups(result.matchGroups);
    addAuditEntry(
      'Reconciliation Re-run',
      'MATCHING',
      `Reconciled ${booksRecords.length} books bills against ${portalRecords.length} portal records. Found ${result.summary.exactMatches} exact matches, ${result.summary.taxMismatches} tax mismatches, and ${result.summary.missingInPortal} unfiled vendor bills.`
    );
  };

  // Reset to realistic synthetic CA test dataset
  const handleLoadSampleData = () => {
    const samplePR = getSyntheticPurchaseRegister();
    const sample2B = getSyntheticGstr2bRecords();
    setBooksRecords(samplePR);
    setPortalRecords(sample2B);
    setActiveClient(SAMPLE_CLIENT);
    setActiveProject(SAMPLE_PROJECT);

    const result = runGSTReconciliationEngine(
      samplePR,
      sample2B,
      SAMPLE_PROJECT.reconciliationType,
      SAMPLE_PROJECT.matchingConfig
    );
    setMatchGroups(result.matchGroups);
    addAuditEntry(
      'Synthetic Sample Audit Dataset Loaded',
      'IMPORT',
      'Loaded complete CA Firm test scenario for M/s Zenith Infotech Solutions Pvt Ltd (FY 2024-25 Q3) with known matches, date offsets, rounding differences, tax head shifts, duplicates, and missing invoices.'
    );
    setCurrentTab('dashboard');
  };

  // Ingest newly parsed records from upload view
  const handleImportRecords = (
    rawRecords: RawInvoiceRecord[],
    datasetSource: DatasetSource,
    fileName: string,
    sheetName: string
  ) => {
    const normalised = normaliseInvoiceRecords(rawRecords, activeProject.matchingConfig);

    if (datasetSource === 'PURCHASE_REGISTER') {
      setBooksRecords(normalised);
      const res = runGSTReconciliationEngine(
        normalised,
        portalRecords,
        activeProject.reconciliationType,
        activeProject.matchingConfig
      );
      setMatchGroups(res.matchGroups);
    } else {
      setPortalRecords(normalised);
      const res = runGSTReconciliationEngine(
        booksRecords,
        normalised,
        activeProject.reconciliationType,
        activeProject.matchingConfig
      );
      setMatchGroups(res.matchGroups);
    }

    addAuditEntry(
      `File Imported: ${fileName}`,
      'IMPORT',
      `Imported ${normalised.length} records into ${datasetSource} from sheet "${sheetName}".`
    );
  };

  // Manual record matching
  const handleManualMatch = (booksRecordId: string, portalRecordId: string, reason: string) => {
    const bRecord = booksRecords.find((b) => b.id === booksRecordId);
    const pRecord = portalRecords.find((p) => p.id === portalRecordId);
    if (!bRecord || !pRecord) return;

    // Remove existing separate groups
    const remainingGroups = matchGroups.filter(
      (g) => g.booksRecord?.id !== booksRecordId && g.portalRecord?.id !== portalRecordId
    );

    const newGroup: MatchGroup = {
      id: `MG-MAN-${Date.now().toString(36).toUpperCase()}`,
      reconciliationType: activeProject.reconciliationType,
      matchStatus: 'MANUAL_MATCHED',
      confidenceScore: 100,
      matchingRuleApplied: `Manual Match by Auditor: ${reason}`,
      booksRecord: bRecord,
      portalRecord: pRecord,
      diffTaxable: bRecord.taxableValue - pRecord.taxableValue,
      diffIgst: bRecord.igst - pRecord.igst,
      diffCgst: bRecord.cgst - pRecord.cgst,
      diffSgst: bRecord.sgst - pRecord.sgst,
      diffCess: bRecord.cess - pRecord.cess,
      diffTotal: bRecord.totalValue - pRecord.totalValue,
      isManuallyOverridden: true,
      manualOverrideReason: reason,
      reviewedBy: 'Auditor',
      reviewTimestamp: new Date().toISOString(),
      reviewStatus: 'ACCEPTED',
      reviewNotes: reason,
    };

    setMatchGroups([newGroup, ...remainingGroups]);
    addAuditEntry(
      'Manual Record Linkage',
      'MANUAL_OVERRIDE',
      `Linked Books bill "${bRecord.invoiceNumber}" with Portal invoice "${pRecord.invoiceNumber}". Reason: ${reason}`
    );
  };

  // Unmatch a previously matched group
  const handleUnmatchGroup = (groupId: string) => {
    const target = matchGroups.find((g) => g.id === groupId);
    if (!target || !target.booksRecord || !target.portalRecord) return;

    const remaining = matchGroups.filter((g) => g.id !== groupId);

    const unmatchedBooksGroup: MatchGroup = {
      id: `MG-UNM-${Date.now().toString(36)}-B`,
      reconciliationType: activeProject.reconciliationType,
      matchStatus: 'MISSING_IN_2B',
      confidenceScore: 100,
      matchingRuleApplied: 'Unmatched after manual unlinking',
      booksRecord: target.booksRecord,
      diffTaxable: target.booksRecord.taxableValue,
      diffIgst: target.booksRecord.igst,
      diffCgst: target.booksRecord.cgst,
      diffSgst: target.booksRecord.sgst,
      diffCess: target.booksRecord.cess,
      diffTotal: target.booksRecord.totalValue,
      reviewStatus: 'FLAGGED_FOR_CLIENT',
      reviewNotes: 'Manually unlinked from portal match',
    };

    const unmatchedPortalGroup: MatchGroup = {
      id: `MG-UNM-${Date.now().toString(36)}-P`,
      reconciliationType: activeProject.reconciliationType,
      matchStatus: 'MISSING_IN_PR',
      confidenceScore: 100,
      matchingRuleApplied: 'Unmatched after manual unlinking',
      portalRecord: target.portalRecord,
      diffTaxable: -target.portalRecord.taxableValue,
      diffIgst: -target.portalRecord.igst,
      diffCgst: -target.portalRecord.cgst,
      diffSgst: -target.portalRecord.sgst,
      diffCess: -target.portalRecord.cess,
      diffTotal: -target.portalRecord.totalValue,
      reviewStatus: 'FLAGGED_FOR_CLIENT',
      reviewNotes: 'Manually unlinked from books match',
    };

    setMatchGroups([unmatchedBooksGroup, unmatchedPortalGroup, ...remaining]);
    addAuditEntry(
      'Record Unmatched',
      'MANUAL_OVERRIDE',
      `Unlinked match group ${groupId} (Books "${target.booksRecord.invoiceNumber}" and Portal "${target.portalRecord.invoiceNumber}").`
    );
  };

  // Update auditor review status
  const handleUpdateReviewStatus = (
    groupId: string,
    status: 'ACCEPTED' | 'FLAGGED_FOR_CLIENT' | 'REJECTED',
    notes: string
  ) => {
    setMatchGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            reviewStatus: status,
            reviewNotes: notes,
            reviewedBy: 'CA Auditor',
            reviewTimestamp: new Date().toISOString(),
          };
        }
        return g;
      })
    );
    addAuditEntry(
      `Review Status Updated for ${groupId}`,
      'REVIEW',
      `Marked as ${status}. Auditor Remarks: ${notes || 'No remarks added.'}`
    );
  };

  // Filter workbench from dashboard click-through
  const handleFilterWorkbench = (filter: string) => {
    setWorkbenchInitialFilter(filter);
    setCurrentTab('workbench');
  };

  // Financial Year updater
  const handleUpdateFinancialYear = (fy: string) => {
    setActiveProject((prev) => ({
      ...prev,
      financialYear: fy,
    }));
    addAuditEntry('Financial Year Changed', 'MAPPING', `Audited FY set to ${fy}`);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#111111] text-[#F5F0E6]">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeClient={activeClient}
        activeProject={activeProject}
        matchedCount={controlTotals.matchedCount}
        unmatchedCount={controlTotals.unmatchedBooksCount + controlTotals.unmatchedPortalCount}
        taxMismatchCount={controlTotals.taxMismatchCount}
        onLoadSampleData={handleLoadSampleData}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar */}
        <TopBar
          activeClient={activeClient}
          clients={clients}
          onSelectClient={setActiveClient}
          activeProject={activeProject}
          projects={projects}
          onSelectProject={setActiveProject}
          onUpdateFinancialYear={handleUpdateFinancialYear}
          controlTotals={controlTotals}
          onRunReconciliation={handleRunReconciliation}
          onExportExcel={() =>
            exportReconciliationToExcel(
              activeProject,
              activeClient,
              controlTotals,
              matchGroups,
              auditLog
            )
          }
          onOpenAuditSignOff={() => setCurrentTab('audit_trail')}
        />

        {/* Tab View Container */}
        <main className="flex-1 overflow-y-auto bg-[#111111]">
          {currentTab === 'dashboard' && (
            <DashboardView
              controlTotals={controlTotals}
              matchGroups={matchGroups}
              project={activeProject}
              onFilterWorkbench={handleFilterWorkbench}
              onNavigateToUpload={() => setCurrentTab('upload')}
            />
          )}

          {currentTab === 'clients' && (
            <ClientManagerView
              clients={clients}
              projects={projects}
              activeClient={activeClient}
              activeProject={activeProject}
              onSelectClient={setActiveClient}
              onSelectProject={setActiveProject}
              onCreateClient={(newC) => {
                setClients((prev) => [...prev, newC]);
                setActiveClient(newC);
                addAuditEntry(
                  `Created Client Profile: ${newC.legalName}`,
                  'MAPPING',
                  `New client GSTIN ${newC.gstin} registered.`
                );
              }}
              onCreateProject={(newP) => {
                setProjects((prev) => [...prev, newP]);
                setActiveProject(newP);
                addAuditEntry(
                  `Created Project: ${newP.projectName}`,
                  'MAPPING',
                  `Audit type ${newP.reconciliationType} for FY ${newP.financialYear}.`
                );
              }}
              onDeleteProject={(pId) => {
                setProjects((prev) => prev.filter((p) => p.id !== pId));
                addAuditEntry('Deleted Project', 'MAPPING', `Project ID ${pId} deleted.`);
              }}
              onArchiveProject={(pId) => {
                setProjects((prev) =>
                  prev.map((p) => (p.id === pId ? { ...p, status: 'ARCHIVED' } : p))
                );
                addAuditEntry('Archived Project', 'MAPPING', `Project ID ${pId} archived.`);
              }}
            />
          )}

          {currentTab === 'upload' && (
            <UploadAndMapView
              onImportRecords={handleImportRecords}
              onNavigateToWorkbench={() => setCurrentTab('workbench')}
            />
          )}

          {currentTab === 'workbench' && (
            <WorkbenchView
              matchGroups={matchGroups}
              booksRecords={booksRecords}
              portalRecords={portalRecords}
              client={activeClient}
              project={activeProject}
              initialFilter={workbenchInitialFilter}
              onUpdateReviewStatus={handleUpdateReviewStatus}
              onManualMatch={handleManualMatch}
              onUnmatchGroup={handleUnmatchGroup}
            />
          )}

          {currentTab === 'sec16' && (
            <Sec16AuditView
              controlTotals={controlTotals}
              matchGroups={matchGroups}
              project={activeProject}
              onFilterWorkbench={handleFilterWorkbench}
            />
          )}

          {currentTab === 'gstr3b' && (
            <Gstr3bComparisonView
              controlTotals={controlTotals}
              project={activeProject}
              onFilterWorkbench={handleFilterWorkbench}
            />
          )}

          {currentTab === 'sales' && <SalesReconciliationView project={activeProject} />}

          {currentTab === 'ai_assistant' && (
            <AiAssistantView
              client={activeClient}
              project={activeProject}
              matchGroups={matchGroups}
            />
          )}

          {currentTab === 'audit_trail' && (
            <AuditTrailView
              auditLog={auditLog}
              project={activeProject}
              onUpdateMakerChecker={(updated) => {
                setActiveProject(updated);
                setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
              }}
              onAddAuditEntry={addAuditEntry}
            />
          )}

          {currentTab === 'export' && (
            <ExportReportsView
              project={activeProject}
              client={activeClient}
              controlTotals={controlTotals}
              matchGroups={matchGroups}
              auditLog={auditLog}
            />
          )}
        </main>
      </div>
    </div>
  );
}
