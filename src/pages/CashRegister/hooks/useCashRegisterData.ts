/**
 * Cash Register Data Hook
 * 
 * Handles data fetching for Cash Register module
 * Manages pending invoices, credit preview, and active agreements
 */

import { useState, useCallback } from 'react';
import axios from '../../../api/axios';
import { CreditPreview } from './usePaymentRouting';

export const useCashRegisterData = () => {
  const [pendingCreditSales, setPendingCreditSales] = useState<any[]>([]);
  const [activeAgreements, setActiveAgreements] = useState<any[]>([]);
  const [creditPreview, setCreditPreview] = useState<CreditPreview | null>(null);
  const [isLoadingCreditPreview, setIsLoadingCreditPreview] = useState(false);

  /**
   * Fetch pending credit sales for a customer
   */
  const fetchPendingCreditSales = useCallback(async (customerId: string) => {
    if (!customerId) {
      setPendingCreditSales([]);
      setCreditPreview(null);
      return;
    }
    
    try {
      const response = await axios.get(`/cash-register/pending-credit-sales/${customerId}`);
      setPendingCreditSales(response.data);
    } catch (error) {
      console.error('Error fetching pending credit sales:', error);
      setPendingCreditSales([]);
      setCreditPreview(null);
    }
  }, []);

  /**
   * Fetch credit preview for customer payment
   */
  const fetchCreditPreview = useCallback(async (
    customerId: string,
    amount: string,
    selectedInvoices: number[],
    prefilledAccountsReceivableId?: number
  ) => {
    if (!customerId || !amount) {
      setCreditPreview(null);
      return;
    }
    
    setIsLoadingCreditPreview(true);
    
    try {
      const invoiceIds = selectedInvoices.length > 0 
        ? selectedInvoices 
        : (prefilledAccountsReceivableId ? [prefilledAccountsReceivableId] : []);
      
      if (invoiceIds.length === 0) {
        setCreditPreview(null);
        return;
      }
      
      const response = await axios.post('/customer-credit-aware-payment/preview', {
        customerId: parseInt(customerId),
        invoiceIds,
        requestedAmount: parseFloat(amount),
        useExistingCredit: true
      });
      
      setCreditPreview(response.data);
    } catch (error) {
      console.error('Error fetching credit preview:', error);
      setCreditPreview(null);
    } finally {
      setIsLoadingCreditPreview(false);
    }
  }, []);

  /**
   * Fetch active investment agreements
   */
  const fetchActiveAgreements = useCallback(async () => {
    try {
      const response = await axios.get('/investment-agreements/active');
      setActiveAgreements(response.data);
    } catch (error) {
      console.error('Error fetching active agreements:', error);
      setActiveAgreements([]);
    }
  }, []);

  /**
   * Clear all data
   */
  const clearData = useCallback(() => {
    setPendingCreditSales([]);
    setCreditPreview(null);
    setActiveAgreements([]);
  }, []);

  return {
    // Data
    pendingCreditSales,
    activeAgreements,
    creditPreview,
    isLoadingCreditPreview,
    
    // Actions
    fetchPendingCreditSales,
    fetchCreditPreview,
    fetchActiveAgreements,
    clearData,
    
    // Setters (for direct updates if needed)
    setPendingCreditSales,
    setCreditPreview,
  };
};
