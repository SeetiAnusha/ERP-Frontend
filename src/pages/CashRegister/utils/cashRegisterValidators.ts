/**
 * Cash Register Validation Utilities
 * 
 * Centralized validation logic for Cash Register module
 * All validation functions are pure functions (no side effects)
 */

import { CashRegisterSourceType } from '../../../types/CashRegisterSourceType';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface CashRegisterFormData {
  registrationDate: string;
  transactionType: string;
  amount: string;
  paymentMethod: string;
  relatedDocumentType: string;
  relatedDocumentNumber: string;
  clientRnc: string;
  clientName: string;
  ncf: string;
  description: string;
  cashRegisterId: string;
  bankAccountId: string;
  chequeNumber: string;
  receiptNumber: string;
  customerId: string;
  financerId: string;
  investmentAgreementId: string;
  cardId: string;
  cardPaymentNetworkId: string;
}

/**
 * Validate amount field
 */
export const validateAmount = (amount: string): ValidationResult => {
  if (!amount || amount.trim() === '') {
    return { valid: false, error: 'Amount is required' };
  }
  
  const num = parseFloat(amount);
  if (isNaN(num)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }
  
  if (num <= 0) {
    return { valid: false, error: 'Amount must be greater than zero' };
  }
  
  return { valid: true };
};

/**
 * Validate cash register selection
 */
export const validateCashRegisterId = (id: string | number): ValidationResult => {
  if (id === null || id === undefined || id === '') {
    return { valid: false, error: 'Please select a cash register' };
  }
  return { valid: true };
};

/**
 * Validate bank account selection
 */
export const validateBankAccountId = (id: string | number): ValidationResult => {
  if (id === null || id === undefined || id === '') {
    return { valid: false, error: 'Please select a bank account' };
  }
  return { valid: true };
};

/**
 * Validate customer selection
 */
export const validateCustomerId = (id: string | number): ValidationResult => {
  if (id === null || id === undefined || id === '') {
    return { valid: false, error: 'Please select a customer' };
  }
  return { valid: true };
};

/**
 * Validate invoice selection
 */
export const validateInvoiceSelection = (invoices: number[]): ValidationResult => {
  if (!invoices || invoices.length === 0) {
    return { valid: false, error: 'Please select at least one invoice' };
  }
  return { valid: true };
};

/**
 * Validate investment agreement selection
 */
export const validateInvestmentAgreementId = (id: string | number): ValidationResult => {
  if (id === null || id === undefined || id === '') {
    return { valid: false, error: 'Please select an investment/loan agreement' };
  }
  return { valid: true };
};

/**
 * Validate payment network selection for card payments
 */
export const validateCardPaymentNetworkId = (id: string | number): ValidationResult => {
  if (id === null || id === undefined || id === '') {
    return { valid: false, error: 'Please select a payment network' };
  }
  return { valid: true };
};

/**
 * Validate cash payment requirements
 */
export const validateCashPayment = (formData: CashRegisterFormData): ValidationResult => {
  // Cash payments require a cash register
  const cashRegisterResult = validateCashRegisterId(formData.cashRegisterId);
  if (!cashRegisterResult.valid) {
    return cashRegisterResult;
  }
  
  return { valid: true };
};

/**
 * Validate bank payment requirements
 */
export const validateBankPayment = (formData: CashRegisterFormData): ValidationResult => {
  // Bank payments require a bank account
  const bankAccountResult = validateBankAccountId(formData.bankAccountId);
  if (!bankAccountResult.valid) {
    return bankAccountResult;
  }
  
  return { valid: true };
};

/**
 * Validate debit card payment requirements
 */
export const validateDebitCardPayment = (formData: CashRegisterFormData): ValidationResult => {
  // Debit card requires payment network
  const networkResult = validateCardPaymentNetworkId(formData.cardPaymentNetworkId);
  if (!networkResult.valid) {
    return { valid: false, error: 'Please select a debit card payment network' };
  }
  
  return { valid: true };
};

/**
 * Validate credit card payment requirements
 */
export const validateCreditCardPayment = (formData: CashRegisterFormData): ValidationResult => {
  // Credit card requires payment network
  const networkResult = validateCardPaymentNetworkId(formData.cardPaymentNetworkId);
  if (!networkResult.valid) {
    return { valid: false, error: 'Please select a credit card payment network' };
  }
  
  return { valid: true };
};

/**
 * Validate AR Collection requirements
 */
export const validateARCollection = (
  formData: CashRegisterFormData,
  selectedInvoices: number[],
  fromAccountsReceivable: boolean
): ValidationResult => {
  // Customer is required
  const customerResult = validateCustomerId(formData.customerId);
  if (!customerResult.valid) {
    return customerResult;
  }
  
  // Invoice selection is required (unless coming from AR with pre-selected invoice)
  if (!fromAccountsReceivable) {
    const invoiceResult = validateInvoiceSelection(selectedInvoices);
    if (!invoiceResult.valid) {
      return { valid: false, error: 'Please select at least one credit sale invoice' };
    }
  }
  
  return { valid: true };
};

/**
 * Validate Contribution/Loan requirements
 */
export const validateContributionOrLoan = (formData: CashRegisterFormData): ValidationResult => {
  // Investment agreement is required
  const agreementResult = validateInvestmentAgreementId(formData.investmentAgreementId);
  if (!agreementResult.valid) {
    return agreementResult;
  }
  
  return { valid: true };
};

/**
 * Validate INFLOW transaction
 */
export const validateInflowTransaction = (
  formData: CashRegisterFormData,
  selectedInvoices: number[],
  fromAccountsReceivable: boolean
): ValidationResult => {
  // Validate based on document type
  if (formData.relatedDocumentType === CashRegisterSourceType.AR_COLLECTION) {
    return validateARCollection(formData, selectedInvoices, fromAccountsReceivable);
  }
  
  if (
    formData.relatedDocumentType === CashRegisterSourceType.CONTRIBUTION ||
    formData.relatedDocumentType === CashRegisterSourceType.LOAN
  ) {
    return validateContributionOrLoan(formData);
  }
  
  // Validate payment method
  if (formData.paymentMethod === 'DEBIT_CARD') {
    return validateDebitCardPayment(formData);
  }
  
  if (formData.paymentMethod === 'CREDIT_CARD') {
    return validateCreditCardPayment(formData);
  }
  
  if (formData.paymentMethod === 'BANK_TRANSFER' || formData.paymentMethod === 'DEPOSIT') {
    return validateBankPayment(formData);
  }
  
  return { valid: true };
};

/**
 * Validate OUTFLOW transaction
 */
export const validateOutflowTransaction = (formData: CashRegisterFormData): ValidationResult => {
  // OUTFLOW only allows BANK_DEPOSIT or CORRECTION
  if (formData.paymentMethod !== 'BANK_DEPOSIT' && formData.paymentMethod !== 'CORRECTION') {
    return { valid: false, error: 'OUTFLOW only allows Bank Deposit or Correction' };
  }
  
  return { valid: true };
};

/**
 * Validate cash register balance for OUTFLOW
 */
export const validateCashRegisterBalance = (
  formData: CashRegisterFormData,
  cashRegisterBalance: number
): ValidationResult => {
  if (formData.transactionType !== 'OUTFLOW') {
    return { valid: true };
  }
  
  if (!formData.cashRegisterId) {
    return { valid: true }; // Will be caught by other validation
  }
  
  const outflowAmount = parseFloat(formData.amount);
  if (isNaN(outflowAmount)) {
    return { valid: true }; // Will be caught by amount validation
  }
  
  if (cashRegisterBalance < outflowAmount) {
    return {
      valid: false,
      error: `Insufficient balance in cash register. Available: ${cashRegisterBalance.toFixed(2)}, Required: ${outflowAmount.toFixed(2)}`
    };
  }
  
  return { valid: true };
};

/**
 * Main validation function - validates entire form
 */
export const validateCashRegisterForm = (
  formData: CashRegisterFormData,
  selectedInvoices: number[],
  fromAccountsReceivable: boolean,
  cashRegisterBalance?: number
): ValidationResult => {
  // Validate amount
  const amountResult = validateAmount(formData.amount);
  if (!amountResult.valid) {
    return amountResult;
  }
  
  // Validate conditional cash register requirement
  const needsCashRegister =
    (formData.relatedDocumentType === CashRegisterSourceType.CONTRIBUTION && formData.paymentMethod === 'CASH') ||
    (formData.relatedDocumentType === CashRegisterSourceType.LOAN && formData.paymentMethod === 'CASH') ||
    (formData.relatedDocumentType === CashRegisterSourceType.AR_COLLECTION && formData.paymentMethod === 'CASH');
  
  if (needsCashRegister) {
    const cashRegisterResult = validateCashRegisterId(formData.cashRegisterId);
    if (!cashRegisterResult.valid) {
      return cashRegisterResult;
    }
  }
  
  // Validate based on transaction type
  if (formData.transactionType === 'INFLOW') {
    const inflowResult = validateInflowTransaction(formData, selectedInvoices, fromAccountsReceivable);
    if (!inflowResult.valid) {
      return inflowResult;
    }
  } else if (formData.transactionType === 'OUTFLOW') {
    const outflowResult = validateOutflowTransaction(formData);
    if (!outflowResult.valid) {
      return outflowResult;
    }
  }
  
  // Validate cash register balance for OUTFLOW
  if (cashRegisterBalance !== undefined) {
    const balanceResult = validateCashRegisterBalance(formData, cashRegisterBalance);
    if (!balanceResult.valid) {
      return balanceResult;
    }
  }
  
  return { valid: true };
};
