/**
 * Cash Register Validation Hook
 * 
 * Provides validation logic for Cash Register forms
 * Uses centralized validators from utils
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import {
  validateCashRegisterForm,
  ValidationResult,
  CashRegisterFormData,
} from '../utils/cashRegisterValidators';

export const useCashRegisterValidation = () => {
  /**
   * Validate cash register form
   * Shows toast error if validation fails
   * Returns true if valid, false if invalid
   */
  const validateForm = useCallback((
    formData: CashRegisterFormData,
    selectedInvoices: number[],
    fromAccountsReceivable: boolean,
    cashRegisterBalance?: number
  ): boolean => {
    const result: ValidationResult = validateCashRegisterForm(
      formData,
      selectedInvoices,
      fromAccountsReceivable,
      cashRegisterBalance
    );
    
    if (!result.valid && result.error) {
      toast.error(result.error);
      return false;
    }
    
    return true;
  }, []);

  /**
   * Validate deposit form
   */
  const validateDepositForm = useCallback((
    depositData: {
      cashRegisterId: string;
      bankAccountId: string;
      salesDate: string;
      date: string;
    },
    t: (key: string) => string
  ): boolean => {
    if (!depositData.cashRegisterId) {
      toast.error(t('selectCashRegister') || 'Please select a cash register');
      return false;
    }
    
    if (!depositData.bankAccountId) {
      toast.error(t('selectBankAccount') || 'Please select a bank account');
      return false;
    }

    if (depositData.salesDate > depositData.date) {
      toast.error(
        'Cash-from (sales) date cannot be after the bank deposit date. Use the same date as the deposit for same-day takings only.'
      );
      return false;
    }
    
    return true;
  }, []);

  return {
    validateForm,
    validateDepositForm,
  };
};
