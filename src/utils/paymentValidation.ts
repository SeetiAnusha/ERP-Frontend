/**
 * Centralized payment validation utilities
 * Eliminates duplication of validation logic across components
 */

export interface PaymentValidationError {
  field: string;
  message: string;
}

export interface PaymentData {
  amount?: number | string;
  paymentType?: string;
  bankAccountId?: string | number;
  cardId?: string | number;
  chequeNumber?: string;
  chequeDate?: string;
  transferNumber?: string;
  transferDate?: string;
  paymentReference?: string;
  voucherDate?: string;
}

/**
 * Validate basic payment amount
 */
export const validatePaymentAmount = (
  amount: number | string | undefined,
  maxAmount?: number
): PaymentValidationError | null => {
  if (!amount) {
    return { field: 'amount', message: 'Payment amount is required' };
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount) || numAmount <= 0) {
    return { field: 'amount', message: 'Payment amount must be greater than 0' };
  }

  if (maxAmount && numAmount > maxAmount) {
    return { 
      field: 'amount', 
      message: `Payment amount cannot exceed ₹${maxAmount.toFixed(2)}` 
    };
  }

  return null;
};

/**
 * Validate bank payment requirements
 */
export const validateBankPayment = (data: PaymentData): PaymentValidationError[] => {
  const errors: PaymentValidationError[] = [];
  const paymentType = data.paymentType?.toUpperCase();

  if (!data.bankAccountId) {
    errors.push({ 
      field: 'bankAccountId', 
      message: 'Bank account is required for bank payments' 
    });
  }

  if (paymentType === 'CHEQUE' || paymentType === 'CHECK') {
    if (!data.chequeNumber) {
      errors.push({ 
        field: 'chequeNumber', 
        message: 'Cheque number is required' 
      });
    }
    if (!data.chequeDate) {
      errors.push({ 
        field: 'chequeDate', 
        message: 'Cheque date is required' 
      });
    }
  }

  if (paymentType === 'BANK_TRANSFER') {
    if (!data.transferNumber) {
      errors.push({ 
        field: 'transferNumber', 
        message: 'Transfer number is required' 
      });
    }
    if (!data.transferDate) {
      errors.push({ 
        field: 'transferDate', 
        message: 'Transfer date is required' 
      });
    }
  }

  return errors;
};

/**
 * Validate card payment requirements
 */
export const validateCardPayment = (data: PaymentData): PaymentValidationError[] => {
  const errors: PaymentValidationError[] = [];

  if (!data.cardId) {
    errors.push({ 
      field: 'cardId', 
      message: 'Card selection is required' 
    });
  }

  if (!data.paymentReference) {
    errors.push({ 
      field: 'paymentReference', 
      message: 'Payment reference is required' 
    });
  }

  if (!data.voucherDate) {
    errors.push({ 
      field: 'voucherDate', 
      message: 'Voucher date is required' 
    });
  }

  return errors;
};

/**
 * Validate complete payment data based on payment type
 */
export const validatePaymentData = (data: PaymentData): PaymentValidationError[] => {
  const errors: PaymentValidationError[] = [];

  // Validate amount
  const amountError = validatePaymentAmount(data.amount);
  if (amountError) {
    errors.push(amountError);
  }

  // Validate payment type
  if (!data.paymentType) {
    errors.push({ 
      field: 'paymentType', 
      message: 'Payment type is required' 
    });
    return errors; // Can't validate further without payment type
  }

  const paymentType = data.paymentType.toUpperCase();

  // Validate based on payment type
  const bankPaymentTypes = ['CHEQUE', 'CHECK', 'BANK_TRANSFER', 'DEPOSIT', 'BANK_DEPOSIT'];
  const cardPaymentTypes = ['CREDIT_CARD', 'DEBIT_CARD'];

  if (bankPaymentTypes.includes(paymentType)) {
    errors.push(...validateBankPayment(data));
  } else if (cardPaymentTypes.includes(paymentType)) {
    errors.push(...validateCardPayment(data));
  }

  return errors;
};

/**
 * Check if payment type requires bank account
 */
export const requiresBankAccount = (paymentType: string): boolean => {
  const bankPaymentTypes = ['CHEQUE', 'CHECK', 'BANK_TRANSFER', 'DEPOSIT', 'BANK_DEPOSIT', 'DEBIT_CARD'];
  return bankPaymentTypes.includes(paymentType.toUpperCase());
};

/**
 * Check if payment type requires card
 */
export const requiresCard = (paymentType: string): boolean => {
  const cardPaymentTypes = ['CREDIT_CARD', 'DEBIT_CARD'];
  return cardPaymentTypes.includes(paymentType.toUpperCase());
};

/**
 * Check if payment is immediate (not credit)
 */
export const isImmediatePayment = (paymentType: string): boolean => {
  const immediateTypes = ['BANK_TRANSFER', 'CHEQUE', 'CHECK', 'DEPOSIT', 'BANK_DEPOSIT', 'DEBIT_CARD', 'CASH'];
  return immediateTypes.includes(paymentType.toUpperCase());
};

/**
 * Get payment type display name
 */
export const getPaymentTypeLabel = (paymentType: string): string => {
  const labels: Record<string, string> = {
    'CREDIT': 'Credit (Pay Later)',
    'BANK_TRANSFER': 'Bank Transfer',
    'CHEQUE': 'Cheque',
    'CHECK': 'Check',
    'DEPOSIT': 'Bank Deposit',
    'BANK_DEPOSIT': 'Bank Deposit',
    'DEBIT_CARD': 'Debit Card',
    'CREDIT_CARD': 'Credit Card',
    'CASH': 'Cash'
  };

  return labels[paymentType.toUpperCase()] || paymentType;
};
