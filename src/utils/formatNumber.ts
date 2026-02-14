/**
 * Format number with comma separators and decimal places
 * Examples:
 * - 1000 → "1,000.00"
 * - 1000000 → "1,000,000.00"
 * - 10.5 → "10.50"
 */
export const formatNumber = (value: number | string, decimals: number = 2): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0.00';
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Parse formatted number string back to number
 * Examples:
 * - "1,000.00" → 1000
 * - "1,000,000.00" → 1000000
 */
export const parseFormattedNumber = (value: string): number => {
  // Remove commas and parse
  const cleaned = value.replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};
