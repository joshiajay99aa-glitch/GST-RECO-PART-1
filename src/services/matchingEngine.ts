import {
  MatchGroup,
  MatchStatus,
  NormalisedInvoiceRecord,
  ReconciliationType,
  MatchingToleranceConfig,
} from '../types/gst';
import { round2, sub2 } from '../utils/decimal';
import { getDateDiffDays } from '../utils/gstValidator';

export interface MatchingResult {
  matchGroups: MatchGroup[];
  summary: {
    totalBooksProcessed: number;
    totalPortalProcessed: number;
    exactMatches: number;
    nearMatches: number;
    taxMismatches: number;
    potentialMatches: number;
    missingInPortal: number;
    missingInBooks: number;
    duplicates: number;
    manualMatches: number;
  };
}

/**
 * Calculates string similarity (Levenshtein based) for invoice number fuzzy matching
 */
const calculateStringSimilarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;
  
  // Suffix/prefix match check
  if (str1.includes(str2) || str2.includes(str1)) return 0.85;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;

  // Edit distance
  const costs: number[] = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }
  const editDistance = costs[shorter.length];
  return Math.max(0, (longerLength - editDistance) / longerLength);
};

export const runGSTReconciliationEngine = (
  booksRecords: NormalisedInvoiceRecord[],
  portalRecords: NormalisedInvoiceRecord[],
  reconciliationType: ReconciliationType,
  config: MatchingToleranceConfig
): MatchingResult => {
  const matchGroups: MatchGroup[] = [];
  let groupCounter = 1;

  const matchedBooksIds = new Set<string>();
  const matchedPortalIds = new Set<string>();

  const getNewGroupId = () => {
    const id = `MG-${reconciliationType.substring(0, 3)}-${String(groupCounter).padStart(5, '0')}`;
    groupCounter++;
    return id;
  };

  // Pre-filter duplicates on books side
  const booksDuplicates = booksRecords.filter((b) => b.isDuplicate);
  booksDuplicates.forEach((bRecord) => {
    matchedBooksIds.add(bRecord.id);
    matchGroups.push({
      id: getNewGroupId(),
      reconciliationType,
      matchStatus: 'DUPLICATE_INVOICE',
      confidenceScore: 100,
      matchingRuleApplied: 'Duplicate Invoice Entry in Purchase Register',
      booksRecord: bRecord,
      portalRecord: undefined,
      diffTaxable: bRecord.taxableValue,
      diffIgst: bRecord.igst,
      diffCgst: bRecord.cgst,
      diffSgst: bRecord.sgst,
      diffCess: bRecord.cess,
      diffTotal: bRecord.totalValue,
      reviewStatus: 'FLAGGED_FOR_CLIENT',
      reviewNotes: `Duplicate bill identified: Key ${bRecord.duplicateGroupKey || bRecord.invoiceNumber}`,
    });
  });

  // ==========================================
  // STAGE 1: Exact Match
  // Same GSTIN + Exact/Normalised Inv No + Same DocType + Values match within 0.10 + Dates match
  // ==========================================
  for (const bRecord of booksRecords) {
    if (matchedBooksIds.has(bRecord.id)) continue;

    const candidatePortal = portalRecords.find(
      (p) =>
        !matchedPortalIds.has(p.id) &&
        p.cleanGstin === bRecord.cleanGstin &&
        p.normalisedInvoiceNo === bRecord.normalisedInvoiceNo &&
        p.docType === bRecord.docType
    );

    if (candidatePortal) {
      const diffTaxable = sub2(bRecord.taxableValue, candidatePortal.taxableValue);
      const diffIgst = sub2(bRecord.igst, candidatePortal.igst);
      const diffCgst = sub2(bRecord.cgst, candidatePortal.cgst);
      const diffSgst = sub2(bRecord.sgst, candidatePortal.sgst);
      const diffCess = sub2(bRecord.cess, candidatePortal.cess);
      const diffTotal = sub2(bRecord.totalValue, candidatePortal.totalValue);
      const dateDiff = getDateDiffDays(bRecord.standardDate, candidatePortal.standardDate);

      // Check if values match exactly (tolerance <= 0.10)
      const isTaxableExact = Math.abs(diffTaxable) <= 0.1;
      const isTaxExact =
        Math.abs(diffIgst) <= 0.1 &&
        Math.abs(diffCgst) <= 0.1 &&
        Math.abs(diffSgst) <= 0.1 &&
        Math.abs(diffCess) <= 0.1;

      if (isTaxableExact && isTaxExact && dateDiff <= 2) {
        matchedBooksIds.add(bRecord.id);
        matchedPortalIds.add(candidatePortal.id);

        const isInvTextIdentical = bRecord.invoiceNumber.trim() === candidatePortal.invoiceNumber.trim();

        matchGroups.push({
          id: getNewGroupId(),
          reconciliationType,
          matchStatus: isInvTextIdentical ? 'EXACT_MATCH' : 'MATCHED_NORMALIZED_INV',
          confidenceScore: 100,
          matchingRuleApplied: isInvTextIdentical
            ? 'Stage 1: Exact GSTIN, Invoice No, Document Type & Amounts Match'
            : 'Stage 1: Exact Match via Normalised Invoice Number (space/slash variations removed)',
          booksRecord: bRecord,
          portalRecord: candidatePortal,
          diffTaxable,
          diffIgst,
          diffCgst,
          diffSgst,
          diffCess,
          diffTotal,
          dateDiffDays: dateDiff,
          reviewStatus: 'ACCEPTED',
        });
      }
    }
  }

  // ==========================================
  // STAGE 2: Controlled Near Match
  // Same GSTIN + Normalised Inv No + Tolerances (Rounding difference or Date difference)
  // ==========================================
  for (const bRecord of booksRecords) {
    if (matchedBooksIds.has(bRecord.id)) continue;

    const candidatePortal = portalRecords.find(
      (p) =>
        !matchedPortalIds.has(p.id) &&
        p.cleanGstin === bRecord.cleanGstin &&
        p.normalisedInvoiceNo === bRecord.normalisedInvoiceNo &&
        p.docType === bRecord.docType
    );

    if (candidatePortal) {
      const diffTaxable = sub2(bRecord.taxableValue, candidatePortal.taxableValue);
      const diffIgst = sub2(bRecord.igst, candidatePortal.igst);
      const diffCgst = sub2(bRecord.cgst, candidatePortal.cgst);
      const diffSgst = sub2(bRecord.sgst, candidatePortal.sgst);
      const diffCess = sub2(bRecord.cess, candidatePortal.cess);
      const diffTotal = sub2(bRecord.totalValue, candidatePortal.totalValue);
      const dateDiff = getDateDiffDays(bRecord.standardDate, candidatePortal.standardDate);

      // Check rounding difference within configured tolerance (e.g. <= ₹1.00 or ₹5.00)
      const isWithinRoundingTolerance =
        Math.abs(diffTaxable) <= config.amountToleranceRupees &&
        Math.abs(diffIgst) <= config.amountToleranceRupees &&
        Math.abs(diffCgst) <= config.amountToleranceRupees &&
        Math.abs(diffSgst) <= config.amountToleranceRupees;

      const isDateWithinTolerance = dateDiff <= config.dateToleranceDays;

      if (isWithinRoundingTolerance && isDateWithinTolerance) {
        matchedBooksIds.add(bRecord.id);
        matchedPortalIds.add(candidatePortal.id);

        let status: MatchStatus = 'MATCHED_ROUNDING_DIFF';
        let rule = `Stage 2: Matched within rounding tolerance (₹${config.amountToleranceRupees})`;

        if (Math.abs(diffTaxable) <= 0.1 && Math.abs(diffIgst) <= 0.1 && Math.abs(diffCgst) <= 0.1 && dateDiff > 2) {
          status = 'MATCHED_DATE_DIFF';
          rule = `Stage 2: Matched with date difference (${dateDiff} days, within ${config.dateToleranceDays} days tolerance)`;
        }

        matchGroups.push({
          id: getNewGroupId(),
          reconciliationType,
          matchStatus: status,
          confidenceScore: 95,
          matchingRuleApplied: rule,
          booksRecord: bRecord,
          portalRecord: candidatePortal,
          diffTaxable,
          diffIgst,
          diffCgst,
          diffSgst,
          diffCess,
          diffTotal,
          dateDiffDays: dateDiff,
          reviewStatus: 'ACCEPTED',
        });
      }
    }
  }

  // ==========================================
  // STAGE 3: Identity Established but Tax Mismatch
  // Same GSTIN + Same Normalised Inv No, but amounts differ significantly
  // ==========================================
  for (const bRecord of booksRecords) {
    if (matchedBooksIds.has(bRecord.id)) continue;

    const candidatePortal = portalRecords.find(
      (p) =>
        !matchedPortalIds.has(p.id) &&
        p.cleanGstin === bRecord.cleanGstin &&
        p.normalisedInvoiceNo === bRecord.normalisedInvoiceNo &&
        p.docType === bRecord.docType
    );

    if (candidatePortal) {
      const diffTaxable = sub2(bRecord.taxableValue, candidatePortal.taxableValue);
      const diffIgst = sub2(bRecord.igst, candidatePortal.igst);
      const diffCgst = sub2(bRecord.cgst, candidatePortal.cgst);
      const diffSgst = sub2(bRecord.sgst, candidatePortal.sgst);
      const diffCess = sub2(bRecord.cess, candidatePortal.cess);
      const diffTotal = sub2(bRecord.totalValue, candidatePortal.totalValue);
      const dateDiff = getDateDiffDays(bRecord.standardDate, candidatePortal.standardDate);

      matchedBooksIds.add(bRecord.id);
      matchedPortalIds.add(candidatePortal.id);

      let status: MatchStatus = 'TAXABLE_VALUE_MISMATCH';
      let rule = 'Stage 3: Taxable Value Mismatch between Books and Portal';

      // Tax component shift check (e.g., IGST claimed in Books vs CGST+SGST in Portal)
      const bTax = round2(bRecord.igst + bRecord.cgst + bRecord.sgst);
      const pTax = round2(candidatePortal.igst + candidatePortal.cgst + candidatePortal.sgst);

      if (Math.abs(diffTaxable) <= 0.1 && Math.abs(bTax - pTax) <= 0.5) {
        if (bRecord.igst > 0 && candidatePortal.igst === 0 && candidatePortal.cgst > 0) {
          status = 'IGST_MISMATCH';
          rule = 'Stage 3: Tax Head Mismatch - Books booked IGST (Inter-state) but Supplier filed CGST+SGST (Intra-state POS issue)';
        } else if (bRecord.cgst > 0 && candidatePortal.igst > 0) {
          status = 'CGST_MISMATCH';
          rule = 'Stage 3: Tax Head Mismatch - Books booked CGST+SGST but Supplier filed IGST';
        } else {
          status = 'IGST_MISMATCH';
          rule = 'Stage 3: Tax Head Distribution Mismatch';
        }
      } else if (Math.abs(diffTaxable) > 0.1) {
        status = 'TAXABLE_VALUE_MISMATCH';
        rule = `Stage 3: Taxable Value Discrepancy of ${diffTaxable > 0 ? '+' : ''}₹${diffTaxable}`;
      } else if (Math.abs(diffIgst) > 0.1) {
        status = 'IGST_MISMATCH';
        rule = `Stage 3: IGST Mismatch of ₹${diffIgst}`;
      } else if (Math.abs(diffCgst) > 0.1) {
        status = 'CGST_MISMATCH';
        rule = `Stage 3: CGST Mismatch of ₹${diffCgst}`;
      } else if (Math.abs(diffSgst) > 0.1) {
        status = 'SGST_MISMATCH';
        rule = `Stage 3: SGST Mismatch of ₹${diffSgst}`;
      }

      matchGroups.push({
        id: getNewGroupId(),
        reconciliationType,
        matchStatus: status,
        confidenceScore: 90,
        matchingRuleApplied: rule,
        booksRecord: bRecord,
        portalRecord: candidatePortal,
        diffTaxable,
        diffIgst,
        diffCgst,
        diffSgst,
        diffCess,
        diffTotal,
        dateDiffDays: dateDiff,
        reviewStatus: 'FLAGGED_FOR_CLIENT',
        reviewNotes: 'Identity confirmed; tax values diverge. Requires investigation with supplier.',
      });
    }
  }

  // ==========================================
  // STAGE 4: Potential Match (Fuzzy invoice similarity or Date/Amount match)
  // Requires explicit manual approval
  // ==========================================
  for (const bRecord of booksRecords) {
    if (matchedBooksIds.has(bRecord.id)) continue;

    // Search portal records with same GSTIN and similar amounts or high invoice similarity
    const candidates = portalRecords.filter((p) => !matchedPortalIds.has(p.id) && p.cleanGstin === bRecord.cleanGstin);

    let bestCandidate: NormalisedInvoiceRecord | undefined;
    let highestScore = 0;

    for (const p of candidates) {
      const sim = calculateStringSimilarity(bRecord.normalisedInvoiceNo, p.normalisedInvoiceNo);
      const diffTaxable = Math.abs(sub2(bRecord.taxableValue, p.taxableValue));
      const amountScore = diffTaxable <= 1.0 ? 1.0 : diffTaxable <= 10.0 ? 0.7 : 0.0;
      const combinedScore = sim * 0.6 + amountScore * 0.4;

      if (combinedScore > 0.75 && combinedScore > highestScore) {
        highestScore = combinedScore;
        bestCandidate = p;
      }
    }

    if (bestCandidate && highestScore >= 0.75) {
      matchedBooksIds.add(bRecord.id);
      matchedPortalIds.add(bestCandidate.id);

      const diffTaxable = sub2(bRecord.taxableValue, bestCandidate.taxableValue);
      const diffIgst = sub2(bRecord.igst, bestCandidate.igst);
      const diffCgst = sub2(bRecord.cgst, bestCandidate.cgst);
      const diffSgst = sub2(bRecord.sgst, bestCandidate.sgst);
      const diffCess = sub2(bRecord.cess, bestCandidate.cess);
      const diffTotal = sub2(bRecord.totalValue, bestCandidate.totalValue);
      const dateDiff = getDateDiffDays(bRecord.standardDate, bestCandidate.standardDate);

      matchGroups.push({
        id: getNewGroupId(),
        reconciliationType,
        matchStatus: 'POTENTIAL_MATCH_REVIEW',
        confidenceScore: Math.round(highestScore * 100),
        matchingRuleApplied: `Stage 4: Potential Match via Invoice Similarity (${Math.round(highestScore * 100)}% match) - Requires CA Review`,
        booksRecord: bRecord,
        portalRecord: bestCandidate,
        diffTaxable,
        diffIgst,
        diffCgst,
        diffSgst,
        diffCess,
        diffTotal,
        dateDiffDays: dateDiff,
        reviewStatus: 'PENDING',
        reviewNotes: `Suggested Match: Books Inv "${bRecord.invoiceNumber}" vs Portal Inv "${bestCandidate.invoiceNumber}". Please verify before approving.`,
      });
    }
  }

  // ==========================================
  // UNMATCHED IN PORTAL (In Books, but Missing in Portal)
  // Vendor failed to upload / file GSTR-1, or delay in filing
  // ==========================================
  for (const bRecord of booksRecords) {
    if (!matchedBooksIds.has(bRecord.id)) {
      matchedBooksIds.add(bRecord.id);
      let missingStatus: MatchStatus = 'MISSING_IN_2B';
      if (reconciliationType === 'PR_VS_2A') missingStatus = 'MISSING_IN_2A';
      else if (reconciliationType.includes('3B')) missingStatus = 'MISSING_IN_3B';

      matchGroups.push({
        id: getNewGroupId(),
        reconciliationType,
        matchStatus: missingStatus,
        confidenceScore: 100,
        matchingRuleApplied: 'Unmatched: Record exists in Purchase Register but missing from Portal return',
        booksRecord: bRecord,
        portalRecord: undefined,
        diffTaxable: bRecord.taxableValue,
        diffIgst: bRecord.igst,
        diffCgst: bRecord.cgst,
        diffSgst: bRecord.sgst,
        diffCess: bRecord.cess,
        diffTotal: bRecord.totalValue,
        reviewStatus: 'FLAGGED_FOR_CLIENT',
        reviewNotes: 'Vendor GSTR-1 not filed or invoice omitted. Section 16(2)(aa) ITC condition not satisfied.',
      });
    }
  }

  // ==========================================
  // UNMATCHED IN BOOKS (In Portal, but Missing in Books)
  // Portal has invoice, but client accounts missed booking bill
  // ==========================================
  for (const pRecord of portalRecords) {
    if (!matchedPortalIds.has(pRecord.id)) {
      matchedPortalIds.add(pRecord.id);

      matchGroups.push({
        id: getNewGroupId(),
        reconciliationType,
        matchStatus: 'MISSING_IN_PR',
        confidenceScore: 100,
        matchingRuleApplied: 'Unmatched: Record exists in GSTR-2B/Portal but missing in Books Purchase Register',
        booksRecord: undefined,
        portalRecord: pRecord,
        diffTaxable: -pRecord.taxableValue,
        diffIgst: -pRecord.igst,
        diffCgst: -pRecord.cgst,
        diffSgst: -pRecord.sgst,
        diffCess: -pRecord.cess,
        diffTotal: -pRecord.totalValue,
        reviewStatus: 'FLAGGED_FOR_CLIENT',
        reviewNotes: 'Invoice reflected in 2B but bill not recorded in client accounts. Potential unbooked purchase.',
      });
    }
  }

  // Compute summary stats
  const exactMatches = matchGroups.filter((g) => g.matchStatus === 'EXACT_MATCH' || g.matchStatus === 'MATCHED_NORMALIZED_INV').length;
  const nearMatches = matchGroups.filter((g) => g.matchStatus === 'MATCHED_ROUNDING_DIFF' || g.matchStatus === 'MATCHED_DATE_DIFF').length;
  const taxMismatches = matchGroups.filter(
    (g) =>
      g.matchStatus === 'TAXABLE_VALUE_MISMATCH' ||
      g.matchStatus === 'IGST_MISMATCH' ||
      g.matchStatus === 'CGST_MISMATCH' ||
      g.matchStatus === 'SGST_MISMATCH' ||
      g.matchStatus === 'CESS_MISMATCH'
  ).length;
  const potentialMatches = matchGroups.filter((g) => g.matchStatus === 'POTENTIAL_MATCH_REVIEW').length;
  const missingInPortal = matchGroups.filter(
    (g) => g.matchStatus === 'MISSING_IN_2B' || g.matchStatus === 'MISSING_IN_2A' || g.matchStatus === 'MISSING_IN_3B'
  ).length;
  const missingInBooks = matchGroups.filter((g) => g.matchStatus === 'MISSING_IN_PR').length;
  const duplicates = matchGroups.filter((g) => g.matchStatus === 'DUPLICATE_INVOICE').length;
  const manualMatches = matchGroups.filter((g) => g.matchStatus === 'MANUAL_MATCHED').length;

  return {
    matchGroups,
    summary: {
      totalBooksProcessed: booksRecords.length,
      totalPortalProcessed: portalRecords.length,
      exactMatches,
      nearMatches,
      taxMismatches,
      potentialMatches,
      missingInPortal,
      missingInBooks,
      duplicates,
      manualMatches,
    },
  };
};
