/**
 * Cash Register Calculation Utilities
 * 
 * Centralized calculation logic for Cash Register module
 * All calculation functions are pure functions (no side effects)
 */

/**
 * Calculate total outstanding balance from selected invoices
 */
export const calculateTotalOutstanding = (invoices: any[]): number => {
  if (!invoices || invoices.length === 0) {
    return 0;
  }
  
  return invoices.reduce((sum, invoice) => {
    const balance = parseFloat(invoice.balanceAmount || invoice.balance || 0);
    return sum + balance;
  }, 0);
};

/**
 * Calculate overpayment amount
 */
export const calculateOverpayment = (
  paymentAmount: number,
  outstandingAmount: number
): number => {
  return Math.max(0, paymentAmount - outstandingAmount);
};

/**
 * Calculate remaining balance after partial payment
 */
export const calculateRemainingBalance = (
  outstandingAmount: number,
  paymentAmount: number
): number => {
  return Math.max(0, outstandingAmount - paymentAmount);
};

/**
 * Check if payment is partial
 */
export const isPartialPayment = (
  paymentAmount: number,
  outstandingAmount: number
): boolean => {
  return paymentAmount < outstandingAmount && paymentAmount > 0;
};

/**
 * Check if payment is full
 */
export const isFullPayment = (
  paymentAmount: number,
  outstandingAmount: number
): boolean => {
  // Use small epsilon for floating point comparison
  return Math.abs(paymentAmount - outstandingAmount) < 0.01;
};

/**
 * Check if payment is overpayment
 */
export const isOverpayment = (
  paymentAmount: number,
  outstandingAmount: number
): boolean => {
  return paymentAmount > outstandingAmount;
};

/**
 * Get payment status type
 */
export const getPaymentStatus = (
  paymentAmount: number,
  outstandingAmount: number
): 'PARTIAL' | 'FULL' | 'OVERPAYMENT' => {
  if (isPartialPayment(paymentAmount, outstandingAmount)) {
    return 'PARTIAL';
  }
  
  if (isFullPayment(paymentAmount, outstandingAmount)) {
    return 'FULL';
  }
  
  return 'OVERPAYMENT';
};

/**
 * Calculate total inflow from transactions
 */
export const calculateTotalInflow = (transactions: any[]): number => {
  if (!transactions || transactions.length === 0) {
    return 0;
  }
  
  return transactions
    .filter(t => t.transactionType === 'INFLOW' && t.deletion_status !== 'EXECUTED')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
};

/**
 * Calculate total outflow from transactions
 */
export const calculateTotalOutflow = (transactions: any[]): number => {
  if (!transactions || transactions.length === 0) {
    return 0;
  }
  
  return transactions
    .filter(t => t.transactionType === 'OUTFLOW' && t.deletion_status !== 'EXECUTED')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
};

/**
 * Count inflow transactions
 */
export const countInflowTransactions = (transactions: any[]): number => {
  if (!transactions || transactions.length === 0) {
    return 0;
  }
  
  return transactions.filter(
    t => t.transactionType === 'INFLOW' && t.deletion_status !== 'EXECUTED'
  ).length;
};

/**
 * Count outflow transactions
 */
export const countOutflowTransactions = (transactions: any[]): number => {
  if (!transactions || transactions.length === 0) {
    return 0;
  }
  
  return transactions.filter(
    t => t.transactionType === 'OUTFLOW' && t.deletion_status !== 'EXECUTED'
  ).length;
};

/**
 * Calculate net cash position
 */
export const calculateNetCashPosition = (
  totalInflow: number,
  totalOutflow: number
): number => {
  return totalInflow - totalOutflow;
};

/**
 * Add calendar days to ISO date (YYYY-MM-DD)
 */
export const addCalendarDaysToIsoDate = (isoYmd: string, deltaDays: number): string => {
  const [y, m, d] = isoYmd.split('-').map(Number);
  const dt = new Date(y, m - 1, d + deltaDays);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

/**
 * Extract YYYY-MM-DD from date value
 */
export const extractYmd = (v: unknown): string => {
  if (v == null || v === '') return '';
  if (typeof v === 'string') return v.slice(0, 10);
  try {
    return new Date(v as Date).toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

/**
 * Compare cash register transactions for stable ordering
 */
export const compareCashRegisterTx = (a: any, b: any): number => {
  const da = new Date(a.registrationDate).getTime();
  const db = new Date(b.registrationDate).getTime();
  if (da !== db) return da - db;
  const ca = a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
  const cb = b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
  if (ca !== cb) return ca - cb;
  return (a.id || 0) - (b.id || 0);
};
