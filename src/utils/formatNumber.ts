/**
 * Format number with thousands separator (comma) and decimal separator (period)
 * Examples:
 * - 1000 → 1,000.00
 * - 1234567.89 → 1,234,567.89
 * - 0.5 → 0.50
 */
export const formatNumber = (value: number | string | undefined | null, decimals: number = 2): string => {
  if (value === undefined || value === null || value === '') {
    return '0.00';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0.00';
  }

  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format currency with $ symbol
 * Example: 1234.56 → $1,234.56
 */
export const formatCurrency = (value: number | string | undefined | null, decimals: number = 2): string => {
  return '$' + formatNumber(value, decimals);
};

/**
 * Format percentage
 * Example: 0.1234 → 12.34%
 */
export const formatPercent = (value: number | string | undefined | null, decimals: number = 2): string => {
  return formatNumber(value, decimals) + '%';
};
