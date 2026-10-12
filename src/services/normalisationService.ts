import { NormalisedInvoiceRecord, RawInvoiceRecord, MatchingToleranceConfig } from '../types/gst';
import { normaliseInvoiceNumber, standardizeDate } from '../utils/gstValidator';

/**
 * Determines Indian Financial Year from date (Apr 1 - Mar 31)
 */
export const getFinancialYearFromDate = (dateStr: string): string => {
  if (!dateStr) return '2024-25';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    if (!isNaN(year) && !isNaN(month)) {
      if (month >= 4) {
        const nextYearShort = String((year + 1) % 100).padStart(2, '0');
        return `${year}-${nextYearShort}`;
      } else {
        const thisYearShort = String(year % 100).padStart(2, '0');
        return `${year - 1}-${thisYearShort}`;
      }
    }
  }
  return '2024-25';
};

/**
 * Normalises a list of RawInvoiceRecords into NormalisedInvoiceRecords
 */
export const normaliseInvoiceRecords = (
  rawRecords: RawInvoiceRecord[],
  config: MatchingToleranceConfig
): NormalisedInvoiceRecord[] => {
  return rawRecords.map((r) => {
    const cleanGstin = r.supplierGstin.trim().toUpperCase();
    const standardDate = standardizeDate(r.invoiceDate);
    const normalisedInvoiceNo = normaliseInvoiceNumber(r.invoiceNumber, config.preserveLeadingZeroes);
    const financialYear = getFinancialYearFromDate(standardDate);

    return {
      ...r,
      cleanGstin,
      standardDate,
      normalisedInvoiceNo,
      financialYear,
    };
  });
};
