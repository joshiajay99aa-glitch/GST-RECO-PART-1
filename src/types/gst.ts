/**
 * GST Reconciliation Pro - Type Definitions
 */

export type DocumentType = 'INV' | 'CRN' | 'DBN';

export type ReconciliationType =
  | 'PR_VS_2B'      // Purchase Register vs GSTR-2B (Primary ITC Audit)
  | 'PR_VS_2A'      // Purchase Register vs GSTR-2A
  | '2A_VS_2B'      // GSTR-2A vs GSTR-2B
  | 'PR_VS_3B'      // Purchase Register vs GSTR-3B ITC Claimed
  | '2B_VS_3B'      // GSTR-2B vs GSTR-3B ITC Claimed
  | 'SR_VS_GSTR1'   // Sales Register vs GSTR-1
  | 'SR_VS_3B'      // Sales Register vs GSTR-3B
  | 'GSTR1_VS_3B'   // GSTR-1 vs GSTR-3B
  | 'GSTR3B_VS_9';  // GSTR-3B vs GSTR-9 Annual Return

export type DatasetSource = 'PURCHASE_REGISTER' | 'GSTR_2B' | 'GSTR_2A' | 'GSTR_3B' | 'SALES_REGISTER' | 'GSTR_1';

export type MatchStatus =
  | 'EXACT_MATCH'
  | 'MATCHED_NORMALIZED_INV'
  | 'MATCHED_DATE_DIFF'
  | 'MATCHED_ROUNDING_DIFF'
  | 'PARTIAL_MATCH'
  | 'TAXABLE_VALUE_MISMATCH'
  | 'IGST_MISMATCH'
  | 'CGST_MISMATCH'
  | 'SGST_MISMATCH'
  | 'CESS_MISMATCH'
  | 'INVOICE_DATE_MISMATCH'
  | 'GSTIN_MISMATCH'
  | 'MISSING_IN_2B'
  | 'MISSING_IN_2A'
  | 'MISSING_IN_PR'
  | 'MISSING_IN_3B'
  | 'DUPLICATE_INVOICE'
  | 'CREDIT_NOTE_MISMATCH'
  | 'POTENTIAL_MATCH_REVIEW'
  | 'NOT_MATCHED'
  | 'EXCLUDED_BY_USER'
  | 'MANUAL_MATCHED';

export interface RawInvoiceRecord {
  id: string;
  sourceDataset: DatasetSource;
  sourceFileName: string;
  sourceSheetName?: string;
  sourceRowNumber: number;
  importTimestamp: string;
  supplierGstin: string;
  supplierName?: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD or DD/MM/YYYY
  docType: DocumentType;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  totalValue: number;
  placeOfSupply?: string;
  returnPeriod?: string; // e.g. "102024" or "Oct-2024"
  reverseCharge?: boolean | string;
  itcEligibility?: string;
  isDuplicate?: boolean;
  duplicateGroupKey?: string;
  rawAttributes: Record<string, any>;
}

export interface NormalisedInvoiceRecord extends RawInvoiceRecord {
  normalisedInvoiceNo: string;
  standardDate: string; // ISO format YYYY-MM-DD
  cleanGstin: string;
  financialYear: string;
}

export interface MatchGroup {
  id: string; // e.g., "MG-2024-0001"
  reconciliationType: ReconciliationType;
  matchStatus: MatchStatus;
  confidenceScore: number; // 0 to 100
  matchingRuleApplied: string;
  
  // Left side (usually Books / Purchase Register)
  booksRecord?: NormalisedInvoiceRecord;
  // Right side (usually Portal / GSTR-2B or GSTR-2A)
  portalRecord?: NormalisedInvoiceRecord;

  // Comparison differences (Books minus Portal)
  diffTaxable: number;
  diffIgst: number;
  diffCgst: number;
  diffSgst: number;
  diffCess: number;
  diffTotal: number;

  // Date difference in days
  dateDiffDays?: number;

  // Review & Audit Flags
  isManuallyOverridden?: boolean;
  manualOverrideReason?: string;
  reviewedBy?: string;
  reviewTimestamp?: string;
  reviewStatus: 'PENDING' | 'ACCEPTED' | 'FLAGGED_FOR_CLIENT' | 'REJECTED';
  reviewNotes?: string;

  // AI-Assisted Findings
  aiExplanation?: string;
  aiSuggestedAction?: string;
  aiAnalysisTimestamp?: string;
}

export interface ClientProfile {
  id: string;
  legalName: string;
  tradeName?: string;
  gstin: string;
  stateCode: string;
  stateName: string;
  contactPerson?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationProject {
  id: string;
  clientId: string;
  projectName: string;
  reconciliationType: ReconciliationType;
  financialYear: string; // e.g., "2024-25"
  returnPeriod: string;  // e.g., "October 2024" or "Q3 (Oct-Dec)"
  createdAt: string;
  status: 'IN_PROGRESS' | 'UNDER_REVIEW' | 'APPROVED' | 'ARCHIVED';
  makerChecker: {
    preparedBy: string;
    preparedAt?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    approvedBy?: string;
    approvedAt?: string;
    remarks?: string;
  };
  matchingConfig: MatchingToleranceConfig;
}

export interface MatchingToleranceConfig {
  dateToleranceDays: number;       // default 30 days
  amountToleranceRupees: number;   // default 1.00 or 5.00
  ignoreCaseAndSpecialChars: boolean; // default true
  preserveLeadingZeroes: boolean;  // default true
  allowComponentShiftCheck: boolean; // default true (e.g., IGST booked as CGST+SGST)
}

export interface ColumnMappingDefinition {
  supplierGstinCol?: string;
  supplierNameCol?: string;
  invoiceNumberCol?: string;
  invoiceDateCol?: string;
  docTypeCol?: string;
  taxableValueCol?: string;
  igstCol?: string;
  cgstCol?: string;
  sgstCol?: string;
  cessCol?: string;
  totalValueCol?: string;
  placeOfSupplyCol?: string;
  returnPeriodCol?: string;
  reverseChargeCol?: string;
  itcEligibilityCol?: string;
}

export interface ControlTotals {
  booksTotalRecords: number;
  booksTotalTaxable: number;
  booksTotalIgst: number;
  booksTotalCgst: number;
  booksTotalSgst: number;
  booksTotalCess: number;
  booksTotalTax: number;
  booksTotalValue: number;

  portalTotalRecords: number;
  portalTotalTaxable: number;
  portalTotalIgst: number;
  portalTotalCgst: number;
  portalTotalSgst: number;
  portalTotalCess: number;
  portalTotalTax: number;
  portalTotalValue: number;

  matchedCount: number;
  matchedTaxable: number;
  matchedTax: number;

  unmatchedBooksCount: number;
  unmatchedBooksTaxable: number;
  unmatchedBooksTax: number;

  unmatchedPortalCount: number;
  unmatchedPortalTaxable: number;
  unmatchedPortalTax: number;

  taxMismatchCount: number;
  taxMismatchDiffTax: number;

  duplicateCount: number;
  pendingReviewCount: number;

  isBalanced: boolean;
  varianceMessage?: string;
}

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  action: string;
  category: 'IMPORT' | 'MAPPING' | 'MATCHING' | 'MANUAL_OVERRIDE' | 'REVIEW' | 'AI' | 'EXPORT';
  details: string;
  userName: string;
}
