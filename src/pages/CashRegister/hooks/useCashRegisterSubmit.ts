/**
 * Cash Register Submit Hook
 * 
 * Handles form submission logic for Cash Register
 * Manages API calls and success/error handling
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios from '../../../api/axios';
import { cleanFormData } from '../../../utils/cleanFormData';
import { extractErrorMessage } from '../../../utils/errorHandler';
import { QUERY_KEYS } from '../../../lib/queryKeys';
import { CashRegisterFormData } from './useCashRegisterForm';
import { getPaymentStatus, calculateRemainingBalance, calculateOverpayment } from '../utils/cashRegisterCalculations';
import { formatPaymentStatusMessage, formatOverpaymentWarning } from '../utils/cashRegisterFormatters';

export interface SubmitResult {
  success: boolean;
  message?: string;
  error?: string;
}

export const useCashRegisterSubmit = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  /**
   * Submit regular cash register payment
   */
  const submitRegularPayment = useCallback(async (
    formData: CashRegisterFormData,
    selectedInvoices: number[],
    totalOutstandingBalance: number,
    fromAccountsReceivable: boolean,
    refresh: () => void
  ): Promise<SubmitResult> => {
    try {
      setIsSubmitting(true);

      // Clean form data: convert empty strings to null, parse integers
      const cleanedData = cleanFormData(
        {
          ...formData,
          invoiceIds: selectedInvoices.length > 0 ? JSON.stringify(selectedInvoices) : null,
        },
        ['cashRegisterId', 'bankAccountId', 'customerId', 'cardId', 'cardPaymentNetworkId']
      );

      // Submit to API
      await axios.post('/cash-register', cleanedData);

      // Invalidate React Query caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashTransactions }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashRegisters }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts }),
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] })
      ]);
      
      // Refresh paginated data
      refresh();

      // Determine payment status and show appropriate message
      if (fromAccountsReceivable && totalOutstandingBalance > 0) {
        const paymentAmount = parseFloat(formData.amount);
        const status = getPaymentStatus(paymentAmount, totalOutstandingBalance);
        const message = formatPaymentStatusMessage(paymentAmount, totalOutstandingBalance, status);
        
        return {
          success: true,
          message
        };
      }

      return {
        success: true,
        message: 'Transaction created successfully!'
      };
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      const errorMessage = extractErrorMessage(error);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [queryClient]);

  /**
   * Submit bank deposit
   */
  const submitBankDeposit = useCallback(async (
    depositData: {
      date: string;
      salesDate: string;
      cashRegisterId: string;
      bankAccountId: string;
      amount: string;
      description: string;
      transferNumber: string;
    },
    refresh: () => void,
    t: (key: string) => string
  ): Promise<SubmitResult> => {
    try {
      setIsSubmitting(true);

      // Create OUTFLOW transaction for cash register (money leaving)
      await axios.post('/cash-register', {
        registrationDate: depositData.date,
        sales_date: depositData.salesDate,
        deposit_date: depositData.date,
        transactionType: 'OUTFLOW',
        amount: depositData.amount,
        paymentMethod: 'BANK_DEPOSIT',
        relatedDocumentType: 'BANK_DEPOSIT',
        relatedDocumentNumber: depositData.transferNumber || '',
        description: depositData.description || 'Bank deposit',
        cashRegisterId: depositData.cashRegisterId,
        bankAccountId: depositData.bankAccountId,
        transferNumber: depositData.transferNumber || '',
      });

      // Invalidate React Query caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashTransactions }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashRegisters }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankTransactions })
      ]);
      
      // Refresh paginated data
      refresh();

      return {
        success: true,
        message: 'Bank deposit recorded successfully! Cash register balance decreased and bank account increased.'
      };
    } catch (error: any) {
      console.error('Error recording deposit:', error);
      const errorMessage = extractErrorMessage(error);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [queryClient]);

  /**
   * Check for overpayment and show warning
   * Returns true if should continue, false if should stop
   */
  const checkOverpayment = useCallback((
    paymentAmount: number,
    totalOutstandingBalance: number
  ): boolean => {
    if (paymentAmount > totalOutstandingBalance && totalOutstandingBalance > 0) {
      const warningMessage = formatOverpaymentWarning(paymentAmount, totalOutstandingBalance);
      toast.warning(warningMessage, { duration: 5000 });
      // Continue with submission - backend will handle overpayment
    }
    return true;
  }, []);

  return {
    submitRegularPayment,
    submitBankDeposit,
    checkOverpayment,
    isSubmitting,
  };
};
