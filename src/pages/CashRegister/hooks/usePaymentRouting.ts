/**
 * Payment Routing Hook
 * 
 * Determines which payment flow to use based on business rules
 * Simplifies routing logic and makes it easy to understand
 */

import { useCallback } from 'react';
import { CashRegisterSourceType } from '../../../types/CashRegisterSourceType';

export interface PaymentFlow {
  type: 'REGULAR' | 'CREDIT_AWARE';
  reason: string;
  useModal: boolean;
}

export interface CreditPreview {
  availableCredit: number;
  creditWillBeUsed: number;
  cashPaymentNeeded: number;
  totalInvoiceBalance: number;
  willCreateNewCredit: boolean;
  newCreditAmount: number;
  paymentTypeRequired: boolean;
  recordInCashRegister: boolean;
  errorMessage?: string;
}

export const usePaymentRouting = () => {
  /**
   * Determine which payment flow to use
   * 
   * RULES:
   * 1. If customer has credit balance (availableCredit > 0), use credit-aware flow
   * 2. Otherwise, use regular flow
   */
  const determinePaymentFlow = useCallback((
    relatedDocumentType: string,
    customerId: string,
    creditPreview: CreditPreview | null
  ): PaymentFlow => {
    // Rule 1: If customer has credit balance, use credit-aware flow
    if (
      relatedDocumentType === CashRegisterSourceType.AR_COLLECTION &&
      customerId &&
      creditPreview &&
      creditPreview.availableCredit > 0
    ) {
      return {
        type: 'CREDIT_AWARE',
        reason: 'Customer has existing credit balance',
        useModal: true
      };
    }

    // Rule 2: Regular flow for all other cases
    return {
      type: 'REGULAR',
      reason: 'Standard payment without credit',
      useModal: false
    };
  }, []);

  /**
   * Check if payment method should be hidden
   * (when customer credit will cover entire payment)
   */
  const shouldHidePaymentMethod = useCallback((
    creditPreview: CreditPreview | null
  ): boolean => {
    if (!creditPreview) return false;
    
    // Hide payment method if no cash payment is needed
    return creditPreview.cashPaymentNeeded === 0 && !creditPreview.paymentTypeRequired;
  }, []);

  return {
    determinePaymentFlow,
    shouldHidePaymentMethod,
  };
};
