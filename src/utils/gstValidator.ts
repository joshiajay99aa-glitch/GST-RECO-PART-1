/**
 * GST Validation & Normalisation Helpers
 */

export const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
};

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const validateGSTIN = (gstin: string): { isValid: boolean; stateName?: string; error?: string } => {
  if (!gstin) return { isValid: false, error: 'GSTIN is empty' };
  const cleaned = gstin.trim().toUpperCase();
  if (cleaned.length !== 15) {
    return { isValid: false, error: `Invalid length: Expected 15 characters, got ${cleaned.length}` };
  }
  if (!GSTIN_REGEX.test(cleaned)) {
    return { isValid: false, error: 'Does not match standard Indian GSTIN structure (2-digit state + PAN + Entity + Z + checksum)' };
  }
  const stateCode = cleaned.substring(0, 2);
  const stateName = GST_STATE_CODES[stateCode] || 'Unknown State';
  return { isValid: true, stateName };
};

/**
 * Standardize Indian and Excel Dates to ISO format (YYYY-MM-DD)
 */
export const standardizeDate = (dateVal: any): string => {
  if (!dateVal) return '';

  // Handle Excel Serial Date Number (e.g., 45210)
  if (typeof dateVal === 'number' && !isNaN(dateVal) && dateVal > 25000 && dateVal < 60000) {
    // Excel base date starts Dec 30 1899
    const utc_days = Math.floor(dateVal - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const yyyy = date_info.getUTCFullYear();
    const mm = String(date_info.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date_info.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const str = String(dateVal).trim();
  if (!str) return '';

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Handle DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    const yyyy = dmyMatch[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  // Handle YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymdMatch) {
    const yyyy = ymdMatch[1];
    const mm = ymdMatch[2].padStart(2, '0');
    const dd = ymdMatch[3].padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Fallback to Date parser
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  return str;
};

/**
 * Format ISO date string into Indian display format DD/MM/YYYY
 */
export const formatDisplayDate = (isoStr: string | undefined): string => {
  if (!isoStr) return '-';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
};

/**
 * Calculate difference in days between two ISO dates
 */
export const getDateDiffDays = (date1: string, date2: string): number => {
  if (!date1 || !date2) return 0;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Normalise invoice number for fuzzy/near matching:
 * - Upper-cased
 * - Removes non-alphanumeric punctuation (/ - _ space etc.)
 * - Optional preserve leading zeros
 */
export const normaliseInvoiceNumber = (invNo: string | undefined | null, preserveLeadingZeroes: boolean = true): string => {
  if (!invNo) return '';
  let cleaned = String(invNo).trim().toUpperCase();
  // Strip out slash, hyphen, space, dot, underscore
  cleaned = cleaned.replace(/[\/\-\_\.\s]/g, '');
  if (!preserveLeadingZeroes) {
    cleaned = cleaned.replace(/^0+/, '');
  }
  return cleaned;
};
