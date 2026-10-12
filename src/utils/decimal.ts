/**
 * Deterministic Decimal Math & Indian Currency Formatter
 * Avoids IEEE 754 floating point arithmetic anomalies in financial tax calculations
 */

export const round2 = (num: number): number => {
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const add2 = (a: number, b: number): number => {
  return round2(round2(a) + round2(b));
};

export const sub2 = (a: number, b: number): number => {
  return round2(round2(a) - round2(b));
};

export const mul2 = (a: number, b: number): number => {
  return round2(round2(a) * round2(b));
};

export const isZero2 = (num: number, tolerance: number = 0.01): boolean => {
  return Math.abs(round2(num)) <= tolerance;
};

/**
 * Format numbers in standard Indian Rupee format (e.g. ₹ 12,34,567.89)
 */
export const formatINR = (val: number | undefined | null, showSymbol: boolean = true): string => {
  if (val === undefined || val === null || isNaN(val)) return showSymbol ? '₹ 0.00' : '0.00';
  const rounded = round2(val);
  const isNegative = rounded < 0;
  const absVal = Math.abs(rounded);

  const parts = absVal.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian numbering grouping: last 3 digits, then groups of 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const formatted = `${formattedInteger}.${decimalPart}`;

  if (isNegative) {
    return showSymbol ? `-₹ ${formatted}` : `-${formatted}`;
  }
  return showSymbol ? `₹ ${formatted}` : formatted;
};

export const formatINRCompact = (val: number): string => {
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 10000000) {
    return `${sign}₹ ${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹ ${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}₹ ${(abs / 1000).toFixed(1)} K`;
  }
  return formatINR(val);
};
