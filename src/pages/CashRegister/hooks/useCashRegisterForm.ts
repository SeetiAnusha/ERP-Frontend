/**
 * Cash Register Form Hook
 * 
 * Manages all form state for Cash Register module
 * Provides centralized form data management
 */

import { useState, useCallback } from 'react';
import { CashRegisterSourceType } from '../../../types/CashRegisterSourceType';

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

export interface DepositFormData {
  date: string;
  depositCashKind: 'PREVIOUS_DAYS' | 'TODAY_SALES';
  salesDate: string;
  cashRegisterId: string;
  bankAccountId: string;
  amount: string;
  description: string;
  transferNumber: string;
}

const getInitialFormData = (): CashRegisterFormData => ({
  registrationDate: new Date().toISOString().split('T')[0],
  transactionType: 'INFLOW',
  amount: '',
  paymentMethod: 'CASH',
  relatedDocumentType: CashRegisterSourceType.AR_COLLECTION,
  relatedDocumentNumber: '',
  clientRnc: '',
  clientName: '',
  ncf: '',
  description: '',
  cashRegisterId: '',
  bankAccountId: '',
  chequeNumber: '',
  receiptNumber: '',
  customerId: '',
  financerId: '',
  investmentAgreementId: '',
  cardId: '',
  cardPaymentNetworkId: '',
});

const getInitialDepositData = (): DepositFormData => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  return {
    date: today,
    depositCashKind: 'PREVIOUS_DAYS',
    salesDate: yesterdayStr,
    cashRegisterId: '',
    bankAccountId: '',
    amount: '',
    description: '',
    transferNumber: '',
  };
};

export const useCashRegisterForm = () => {
  const [formData, setFormData] = useState<CashRegisterFormData>(getInitialFormData());
  const [depositData, setDepositData] = useState<DepositFormData>(getInitialDepositData());
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);

  /**
   * Update a single form field
   */
  const updateField = useCallback((field: keyof CashRegisterFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Update multiple form fields at once
   */
  const updateFields = useCallback((updates: Partial<CashRegisterFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Update a single deposit field
   */
  const updateDepositField = useCallback((field: keyof DepositFormData, value: any) => {
    setDepositData(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
    setSelectedInvoices([]);
  }, []);

  /**
   * Reset deposit form to initial state
   */
  const resetDepositForm = useCallback(() => {
    setDepositData(getInitialDepositData());
  }, []);

  /**
   * Toggle invoice selection
   */
  const toggleInvoiceSelection = useCallback((invoiceId: number) => {
    setSelectedInvoices(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  }, []);

  /**
   * Clear invoice selection
   */
  const clearInvoiceSelection = useCallback(() => {
    setSelectedInvoices([]);
  }, []);

  /**
   * Set invoice selection
   */
  const setInvoiceSelection = useCallback((invoiceIds: number[]) => {
    setSelectedInvoices(invoiceIds);
  }, []);

  /**
   * Prefill form with data (e.g., from Accounts Receivable)
   */
  const prefillForm = useCallback((data: Partial<CashRegisterFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  return {
    // Form data
    formData,
    depositData,
    selectedInvoices,
    
    // Form actions
    updateField,
    updateFields,
    updateDepositField,
    resetForm,
    resetDepositForm,
    setFormData,
    setDepositData,
    
    // Invoice actions
    toggleInvoiceSelection,
    clearInvoiceSelection,
    setInvoiceSelection,
    
    // Prefill
    prefillForm,
  };
};
