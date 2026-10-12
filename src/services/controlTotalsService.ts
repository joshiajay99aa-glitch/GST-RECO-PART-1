import { ControlTotals, MatchGroup, NormalisedInvoiceRecord } from '../types/gst';
import { round2, add2, sub2 } from '../utils/decimal';

export const calculateControlTotals = (
  booksRecords: NormalisedInvoiceRecord[],
  portalRecords: NormalisedInvoiceRecord[],
  matchGroups: MatchGroup[]
): ControlTotals => {
  // Books totals
  let booksTotalTaxable = 0;
  let booksTotalIgst = 0;
  let booksTotalCgst = 0;
  let booksTotalSgst = 0;
  let booksTotalCess = 0;
  let booksTotalValue = 0;

  for (const b of booksRecords) {
    booksTotalTaxable = add2(booksTotalTaxable, b.taxableValue);
    booksTotalIgst = add2(booksTotalIgst, b.igst);
    booksTotalCgst = add2(booksTotalCgst, b.cgst);
    booksTotalSgst = add2(booksTotalSgst, b.sgst);
    booksTotalCess = add2(booksTotalCess, b.cess);
    booksTotalValue = add2(booksTotalValue, b.totalValue);
  }
  const booksTotalTax = add2(add2(booksTotalIgst, booksTotalCgst), add2(booksTotalSgst, booksTotalCess));

  // Portal totals
  let portalTotalTaxable = 0;
  let portalTotalIgst = 0;
  let portalTotalCgst = 0;
  let portalTotalSgst = 0;
  let portalTotalCess = 0;
  let portalTotalValue = 0;

  for (const p of portalRecords) {
    portalTotalTaxable = add2(portalTotalTaxable, p.taxableValue);
    portalTotalIgst = add2(portalTotalIgst, p.igst);
    portalTotalCgst = add2(portalTotalCgst, p.cgst);
    portalTotalSgst = add2(portalTotalSgst, p.sgst);
    portalTotalCess = add2(portalTotalCess, p.cess);
    portalTotalValue = add2(portalTotalValue, p.totalValue);
  }
  const portalTotalTax = add2(add2(portalTotalIgst, portalTotalCgst), add2(portalTotalSgst, portalTotalCess));

  // Matched totals
  let matchedCount = 0;
  let matchedTaxable = 0;
  let matchedTax = 0;

  let unmatchedBooksCount = 0;
  let unmatchedBooksTaxable = 0;
  let unmatchedBooksTax = 0;

  let unmatchedPortalCount = 0;
  let unmatchedPortalTaxable = 0;
  let unmatchedPortalTax = 0;

  let taxMismatchCount = 0;
  let taxMismatchDiffTax = 0;

  let duplicateCount = 0;
  let pendingReviewCount = 0;

  for (const g of matchGroups) {
    const isMatched =
      g.matchStatus === 'EXACT_MATCH' ||
      g.matchStatus === 'MATCHED_NORMALIZED_INV' ||
      g.matchStatus === 'MATCHED_DATE_DIFF' ||
      g.matchStatus === 'MATCHED_ROUNDING_DIFF' ||
      g.matchStatus === 'MANUAL_MATCHED';

    const isTaxMismatch =
      g.matchStatus === 'TAXABLE_VALUE_MISMATCH' ||
      g.matchStatus === 'IGST_MISMATCH' ||
      g.matchStatus === 'CGST_MISMATCH' ||
      g.matchStatus === 'SGST_MISMATCH' ||
      g.matchStatus === 'CESS_MISMATCH';

    const isMissingPortal =
      g.matchStatus === 'MISSING_IN_2B' ||
      g.matchStatus === 'MISSING_IN_2A' ||
      g.matchStatus === 'MISSING_IN_3B';

    const isMissingBooks = g.matchStatus === 'MISSING_IN_PR';

    if (g.matchStatus === 'DUPLICATE_INVOICE') {
      duplicateCount++;
    }

    if (g.reviewStatus === 'PENDING' || g.matchStatus === 'POTENTIAL_MATCH_REVIEW') {
      pendingReviewCount++;
    }

    if (isMatched && g.booksRecord) {
      matchedCount++;
      matchedTaxable = add2(matchedTaxable, g.booksRecord.taxableValue);
      const bTax = add2(add2(g.booksRecord.igst, g.booksRecord.cgst), add2(g.booksRecord.sgst, g.booksRecord.cess));
      matchedTax = add2(matchedTax, bTax);
    } else if (isTaxMismatch && g.booksRecord) {
      taxMismatchCount++;
      const taxDiff = Math.abs(g.diffIgst) + Math.abs(g.diffCgst) + Math.abs(g.diffSgst) + Math.abs(g.diffCess);
      taxMismatchDiffTax = add2(taxMismatchDiffTax, taxDiff);
    } else if (isMissingPortal && g.booksRecord) {
      unmatchedBooksCount++;
      unmatchedBooksTaxable = add2(unmatchedBooksTaxable, g.booksRecord.taxableValue);
      const bTax = add2(add2(g.booksRecord.igst, g.booksRecord.cgst), add2(g.booksRecord.sgst, g.booksRecord.cess));
      unmatchedBooksTax = add2(unmatchedBooksTax, bTax);
    } else if (isMissingBooks && g.portalRecord) {
      unmatchedPortalCount++;
      unmatchedPortalTaxable = add2(unmatchedPortalTaxable, g.portalRecord.taxableValue);
      const pTax = add2(add2(g.portalRecord.igst, g.portalRecord.cgst), add2(g.portalRecord.sgst, g.portalRecord.cess));
      unmatchedPortalTax = add2(unmatchedPortalTax, pTax);
    }
  }

  // Audit control balance verification:
  // Detail table population vs source records
  const booksAllocatedCount = matchGroups.filter((g) => g.booksRecord).length;
  const portalAllocatedCount = matchGroups.filter((g) => g.portalRecord).length;

  const isCountBalanced = booksAllocatedCount === booksRecords.length && portalAllocatedCount === portalRecords.length;

  let varianceMessage: string | undefined;
  if (!isCountBalanced) {
    varianceMessage = `Control Warning: Books allocated (${booksAllocatedCount}) vs total (${booksRecords.length}) or Portal allocated (${portalAllocatedCount}) vs total (${portalRecords.length})`;
  }

  return {
    booksTotalRecords: booksRecords.length,
    booksTotalTaxable,
    booksTotalIgst,
    booksTotalCgst,
    booksTotalSgst,
    booksTotalCess,
    booksTotalTax,
    booksTotalValue,

    portalTotalRecords: portalRecords.length,
    portalTotalTaxable,
    portalTotalIgst,
    portalTotalCgst,
    portalTotalSgst,
    portalTotalCess,
    portalTotalTax,
    portalTotalValue,

    matchedCount,
    matchedTaxable,
    matchedTax,

    unmatchedBooksCount,
    unmatchedBooksTaxable,
    unmatchedBooksTax,

    unmatchedPortalCount,
    unmatchedPortalTaxable,
    unmatchedPortalTax,

    taxMismatchCount,
    taxMismatchDiffTax,

    duplicateCount,
    pendingReviewCount,

    isBalanced: isCountBalanced,
    varianceMessage,
  };
};

/**
 * Computes GSTIN-wise breakdown of matched and unmatched amounts
 */
export const calculateGstinSummary = (matchGroups: MatchGroup[]) => {
  const gstinMap = new Map<
    string,
    {
      gstin: string;
      supplierName: string;
      totalInvoices: number;
      matchedCount: number;
      unmatchedCount: number;
      taxMismatchCount: number;
      booksTaxable: number;
      booksTax: number;
      portalTaxable: number;
      portalTax: number;
      taxDifference: number;
    }
  >();

  for (const g of matchGroups) {
    const gstin = g.booksRecord?.supplierGstin || g.portalRecord?.supplierGstin || 'UNKNOWN';
    const supplierName = g.booksRecord?.supplierName || g.portalRecord?.supplierName || 'Unknown Vendor';

    let entry = gstinMap.get(gstin);
    if (!entry) {
      entry = {
        gstin,
        supplierName,
        totalInvoices: 0,
        matchedCount: 0,
        unmatchedCount: 0,
        taxMismatchCount: 0,
        booksTaxable: 0,
        booksTax: 0,
        portalTaxable: 0,
        portalTax: 0,
        taxDifference: 0,
      };
      gstinMap.set(gstin, entry);
    }

    entry.totalInvoices++;

    if (
      g.matchStatus === 'EXACT_MATCH' ||
      g.matchStatus === 'MATCHED_NORMALIZED_INV' ||
      g.matchStatus === 'MATCHED_DATE_DIFF' ||
      g.matchStatus === 'MATCHED_ROUNDING_DIFF' ||
      g.matchStatus === 'MANUAL_MATCHED'
    ) {
      entry.matchedCount++;
    } else if (
      g.matchStatus === 'TAXABLE_VALUE_MISMATCH' ||
      g.matchStatus === 'IGST_MISMATCH' ||
      g.matchStatus === 'CGST_MISMATCH' ||
      g.matchStatus === 'SGST_MISMATCH'
    ) {
      entry.taxMismatchCount++;
    } else {
      entry.unmatchedCount++;
    }

    if (g.booksRecord) {
      entry.booksTaxable = add2(entry.booksTaxable, g.booksRecord.taxableValue);
      const bTax = add2(
        add2(g.booksRecord.igst, g.booksRecord.cgst),
        add2(g.booksRecord.sgst, g.booksRecord.cess)
      );
      entry.booksTax = add2(entry.booksTax, bTax);
    }
    if (g.portalRecord) {
      entry.portalTaxable = add2(entry.portalTaxable, g.portalRecord.taxableValue);
      const pTax = add2(
        add2(g.portalRecord.igst, g.portalRecord.cgst),
        add2(g.portalRecord.sgst, g.portalRecord.cess)
      );
      entry.portalTax = add2(entry.portalTax, pTax);
    }
    entry.taxDifference = sub2(entry.booksTax, entry.portalTax);
  }

  return Array.from(gstinMap.values());
};

/**
 * Computes Return Period-wise summary
 */
export const calculatePeriodSummary = (matchGroups: MatchGroup[]) => {
  const periodMap = new Map<
    string,
    {
      period: string;
      invoiceCount: number;
      booksTaxable: number;
      portalTaxable: number;
      booksTax: number;
      portalTax: number;
      netDifference: number;
    }
  >();

  for (const g of matchGroups) {
    const period = g.booksRecord?.returnPeriod || g.portalRecord?.returnPeriod || 'Standard Period';
    let entry = periodMap.get(period);
    if (!entry) {
      entry = {
        period,
        invoiceCount: 0,
        booksTaxable: 0,
        portalTaxable: 0,
        booksTax: 0,
        portalTax: 0,
        netDifference: 0,
      };
      periodMap.set(period, entry);
    }

    entry.invoiceCount++;
    if (g.booksRecord) {
      entry.booksTaxable = add2(entry.booksTaxable, g.booksRecord.taxableValue);
      const bTax = add2(
        add2(g.booksRecord.igst, g.booksRecord.cgst),
        add2(g.booksRecord.sgst, g.booksRecord.cess)
      );
      entry.booksTax = add2(entry.booksTax, bTax);
    }
    if (g.portalRecord) {
      entry.portalTaxable = add2(entry.portalTaxable, g.portalRecord.taxableValue);
      const pTax = add2(
        add2(g.portalRecord.igst, g.portalRecord.cgst),
        add2(g.portalRecord.sgst, g.portalRecord.cess)
      );
      entry.portalTax = add2(entry.portalTax, pTax);
    }
    entry.netDifference = sub2(entry.booksTax, entry.portalTax);
  }

  return Array.from(periodMap.values());
};
