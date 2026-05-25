/**
 * Cash Register Formatting Utilities
 * 
 * Centralized formatting logic for Cash Register module
 * All formatting functions are pure functions (no side effects)
 */

import { formatNumber } from '../../../utils/formatNumber';

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0.00';
  return `₹${formatNumber(num)}`;
};

/**
 * Format date to display format
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '';
  }
};

/**
 * Format date to ISO format (YYYY-MM-DD)
 */
export const formatDateToISO = (date: Date | string): string => {
  if (!date) return '';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

/**
 * Format payment method for display
 */
export const formatPaymentMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    'CASH': 'Cash',
    'BANK_TRANSFER': 'Bank Transfer',
    'DEPOSIT': 'Deposit',
    'CHEQUE': 'Cheque',
    'DEBIT_CARD': 'Debit Card',
    'CREDIT_CARD': 'Credit Card',
    'UPI': 'UPI',
    'CARD': 'Card',
    'BANK_DEPOSIT': 'Bank Deposit',
    'CORRECTION': 'Correction'
  };
  
  return methodMap[method] || method;
};

/**
 * Format transaction type for display
 */
export const formatTransactionType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'INFLOW': 'Inflow',
    'OUTFLOW': 'Outflow'
  };
  
  return typeMap[type] || type;
};

/**
 * Format document type for display
 */
export const formatDocumentType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'AR_COLLECTION': 'AR Collection',
    'CONTRIBUTION': 'Contribution',
    'LOAN': 'Loan',
    'BANK_DEPOSIT': 'Bank Deposit',
    'CORRECTION': 'Correction',
    'OTHER': 'Other'
  };
  
  return typeMap[type] || type;
};

/**
 * Format payment status message
 */
export const formatPaymentStatusMessage = (
  paymentAmount: number,
  outstandingAmount: number,
  status: 'PARTIAL' | 'FULL' | 'OVERPAYMENT'
): string => {
  switch (status) {
    case 'PARTIAL':
      const remaining = outstandingAmount - paymentAmount;
      return `Partial payment of ${formatCurrency(paymentAmount)} collected successfully! Remaining balance: ${formatCurrency(remaining)}. The Accounts Receivable status has been updated to "Partial".`;
    
    case 'FULL':
      return `Full payment of ${formatCurrency(paymentAmount)} collected successfully! The Accounts Receivable status has been updated to "Received".`;
    
    case 'OVERPAYMENT':
      const overpayment = paymentAmount - outstandingAmount;
      return `Payment of ${formatCurrency(paymentAmount)} collected successfully! Overpayment of ${formatCurrency(overpayment)} has been created as credit balance. The Accounts Receivable status has been updated to "Received".`;
    
    default:
      return 'Payment collected successfully!';
  }
};

/**
 * Format overpayment warning message
 */
export const formatOverpaymentWarning = (
  paymentAmount: number,
  outstandingAmount: number
): string => {
  const overpayment = paymentAmount - outstandingAmount;
  return `Overpayment of ${formatCurrency(overpayment)} will be created as credit balance`;
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format registration number
 */
export const formatRegistrationNumber = (number: string): string => {
  if (!number) return '';
  return number.toUpperCase();
};

/**
 * Format RNC (Tax ID)
 */
export const formatRNC = (rnc: string): string => {
  if (!rnc) return '';
  // Remove non-numeric characters
  const cleaned = rnc.replace(/\D/g, '');
  // Format as XXX-XXXXXXX-X
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 10)}-${cleaned.slice(10)}`;
  }
  return rnc;
};

/**
 * Format NCF (Tax Receipt Number)
 */
export const formatNCF = (ncf: string): string => {
  if (!ncf) return '';
  return ncf.toUpperCase();
};
