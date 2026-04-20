import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash, FaWallet, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios from '../api/axios';
import { CashTransaction } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber } from '../utils/formatNumber';
import { cleanFormData } from '../utils/cleanFormData';
import { extractErrorMessage } from '../utils/errorHandler';
import OverpaymentAlertModal from '../components/OverpaymentAlertModal';
import CustomerCreditAwarePaymentModal from '../components/CustomerCreditAwarePaymentModal';
import { QUERY_KEYS } from '../lib/queryKeys';

// ✅ NEW: Import pagination components
import { useTableData } from '../hooks/useTableData';
import { Pagination } from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';

// ✅ Keep React Query hooks for shared master data (not paginated)
import { useSharedMasterData } from '../hooks/queries/useSharedData';

const CashRegister = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // ✅ NEW: Use pagination hook for transactions
  const {
    data: transactions,
    loading: transactionsLoading,
    pagination,
    search: searchTerm,
    updateSearch: setSearchTerm,
    updateFilter,
    clearFilters,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    changeLimit,
    refresh
  } = useTableData<CashTransaction>({
    endpoint: 'cash-register',  // ✅ FIXED: No leading slash (baseURL already has /api)
    initialLimit: 50,
    initialFilters: {
      transactionType: 'All'
    }
  });
  
  // ✅ Keep React Query hooks for shared master data (not paginated)
  const sharedData = useSharedMasterData();
  
  const cashRegisterMasters = sharedData.cashRegisters || [];
  const bankAccounts = sharedData.bankAccounts || [];
  const customers = sharedData.clients || [];
  const paymentNetworks = sharedData.paymentNetworks || [];
  
  const isLoading = transactionsLoading || sharedData.isLoading;
  const hasError = sharedData.hasError;
  
  // ✅ SHARED STATE (USED BY BOTH IMPLEMENTATIONS)
  const [showModal, setShowModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('All');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Phase 3: Remaining state
  const [activeAgreements, setActiveAgreements] = useState<any[]>([]);
  const [pendingCreditSales, setPendingCreditSales] = useState<any[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);

  // Overpayment detection state
  const [showOverpaymentAlert, setShowOverpaymentAlert] = useState(false);
  const [overpaymentData, setOverpaymentData] = useState<any>(null);
  const [allowOverpayment, setAllowOverpayment] = useState(false);

  // Customer credit-aware payment state
  const [showCustomerCreditAwareModal, setShowCustomerCreditAwareModal] = useState(false);
  const [creditPreview, setCreditPreview] = useState<any>(null);
  const [isLoadingCreditPreview, setIsLoadingCreditPreview] = useState(false);

  const [formData, setFormData] = useState({
    registrationDate: new Date().toISOString().split('T')[0],
    transactionType: 'INFLOW',
    amount: '',
    paymentMethod: 'CASH',
    relatedDocumentType: 'AR_COLLECTION', // Fixed: Changed from 'SALE' to 'AR_COLLECTION' to match dropdown options
    relatedDocumentNumber: '',
    clientRnc: '',
    clientName: '',
    ncf: '',
    description: '',
    // Phase 3: New fields
    cashRegisterId: '',
    bankAccountId: '',
    chequeNumber: '',
    receiptNumber: '',
    customerId: '',
    financerId: '',
    investmentAgreementId: '',
    // New fields for dynamic payment method dropdowns
    cardId: '',
    cardPaymentNetworkId: '',
  });

  const [depositData, setDepositData] = useState({
    date: new Date().toISOString().split('T')[0],
    cashRegisterId: '',
    bankAccountId: '',
    amount: '',
    description: '',
    transferNumber: '', // ✅ NEW: User-entered transfer number for bank deposit
  });

  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch active agreements (not in shared data yet)
  useEffect(() => {
    fetchActiveAgreements();
  }, []);
  
  // ✅ Update filter when filterType changes
  useEffect(() => {
    if (filterType !== 'All') {
      updateFilter('transactionType', filterType);
    } else {
      clearFilters();
    }
  }, [filterType, updateFilter, clearFilters]);

  // ✅ MEMOIZED: Status badge function for deletion indicators
  const getTransactionStatusBadge = useCallback((transaction: CashTransaction) => {
    if (transaction.deletion_status === 'EXECUTED') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
          🗑️ DELETED
        </span>
      );
    }
    
    if (transaction.is_reversal) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
          ↩️ REVERSAL
        </span>
      );
    }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        transaction.transactionType === 'INFLOW' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {transaction.transactionType === 'INFLOW' ? '💰 INFLOW' : '💸 OUTFLOW'}
      </span>
    );
  }, []);

  // Clear related fields when document type changes
  useEffect(() => {
    if (formData.relatedDocumentType === 'CONTRIBUTION' || formData.relatedDocumentType === 'LOAN') {
      // Clear customer-related fields when switching to CONTRIBUTION/LOAN
      setFormData(prev => ({ 
        ...prev, 
        customerId: '',
        financerId: '' 
      }));
      setSelectedInvoices([]);
      setPendingCreditSales([]);
    } else if (formData.relatedDocumentType === 'AR_COLLECTION') {
      // Clear investment-related fields when switching to AR_COLLECTION
      setFormData(prev => ({ 
        ...prev, 
        investmentAgreementId: '',
        financerId: '' 
      }));
    }
  }, [formData.relatedDocumentType]);

  // Handle pre-filled data from Accounts Receivable
  useEffect(() => {
    if (location.state?.prefilledData && location.state?.fromAccountsReceivable) {
      const prefilledData = location.state.prefilledData;
      setFormData(prev => ({
        ...prev,
        transactionType: prefilledData.transactionType,
        relatedDocumentType: prefilledData.relatedDocumentType,
        amount: prefilledData.amount,
        description: prefilledData.description,
        customerId: prefilledData.customerId?.toString() || '',
      }));
      
      // For Accounts Receivable collections, pre-select the AR record as an invoice
      if (prefilledData.accountsReceivableId) {
        setSelectedInvoices([prefilledData.accountsReceivableId]);
      }
      
      // Fetch pending credit sales for the customer
      if (prefilledData.customerId) {
        fetchPendingCreditSales(prefilledData.customerId.toString());
      }
      
      setShowModal(true); // Automatically open the modal
    }
  }, [location.state]);

  // Fetch active investment agreements (not in shared data yet)
  const fetchActiveAgreements = async () => {
    try {
      const response = await axios.get('/investment-agreements/active');
      setActiveAgreements(response.data);
    } catch (error) {
      console.error('Error fetching active agreements:', error);
    }
  };

  // ✅ MEMOIZED: Fetch credit preview to determine if payment method should be hidden
  const fetchCreditPreview = useCallback(async (customerId: string) => {
    if (!customerId || !formData.amount) {
      setCreditPreview(null);
      return;
    }
    
    setIsLoadingCreditPreview(true);
    
    try {
      const invoiceIds = selectedInvoices.length > 0 
        ? selectedInvoices 
        : (location.state?.prefilledData?.accountsReceivableId ? [location.state.prefilledData.accountsReceivableId] : []);
      
      if (invoiceIds.length === 0) {
        setCreditPreview(null);
        return;
      }
      
      const response = await axios.post('/customer-credit-aware-payment/preview', {
        customerId: parseInt(customerId),
        invoiceIds,
        requestedAmount: parseFloat(formData.amount),
        useExistingCredit: true
      });
      
      setCreditPreview(response.data);
    } catch (error) {
      console.error('Error fetching credit preview:', error);
      setCreditPreview(null);
    } finally {
      setIsLoadingCreditPreview(false);
    }
  }, [formData.amount, selectedInvoices, location.state]);

  // ✅ MEMOIZED: Fetch pending Credit Sale and Credit Card Sale invoices for selected customer
  const fetchPendingCreditSales = useCallback(async (customerId: string) => {
    if (!customerId) {
      setPendingCreditSales([]);
      setCreditPreview(null);
      return;
    }
    
    try {
      const response = await axios.get(`/cash-register/pending-credit-sales/${customerId}`);
      setPendingCreditSales(response.data);
      
      // Also fetch credit preview for this customer
      fetchCreditPreview(customerId);
    } catch (error) {
      console.error('Error fetching pending credit sales:', error);
      setPendingCreditSales([]);
      setCreditPreview(null);
    }
  }, [fetchCreditPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ NEW: For customer AR collections, use customer credit-aware payment system
    if (formData.relatedDocumentType === 'AR_COLLECTION' && formData.customerId && !allowOverpayment) {
      console.log('🎯 Using customer credit-aware payment system for AR collection');
      
      // Check if this is a credit-only payment (no payment method required)
      if (creditPreview && !creditPreview.paymentTypeRequired) {
        console.log('💳 Credit-only payment detected - processing directly');
        setShowCustomerCreditAwareModal(true);
        return;
      }
      
      // For payments requiring payment method, validate first
      if (!formData.paymentMethod) {
        toast.error('Please select a payment method');
        return;
      }
      
      if (formData.paymentMethod === 'CASH' && !formData.cashRegisterId) {
        toast.error('Please select a cash register for cash payments');
        return;
      }
      
      const bankMethods = ['BANK_TRANSFER', 'DEPOSIT', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_CHEQUE'];
      if (bankMethods.includes(formData.paymentMethod) && !formData.bankAccountId) {
        toast.error('Please select a bank account for bank payments');
        return;
      }
      
      setShowCustomerCreditAwareModal(true);
      return; // Let the customer credit-aware modal handle the payment
    }
    
    // Phase 1: Overpayment Detection for AR Collections
    if (formData.relatedDocumentType === 'AR_COLLECTION' && !allowOverpayment) {
      const paymentAmount = parseFloat(formData.amount);
      
      // Calculate total outstanding balance from selected invoices
      let totalOutstandingBalance = 0;
      if (selectedInvoices.length > 0) {
        const selectedInvoiceData = pendingCreditSales.filter(invoice => 
          selectedInvoices.includes(invoice.id)
        );
        totalOutstandingBalance = selectedInvoiceData.reduce((sum, invoice) => 
          sum + parseFloat(invoice.balanceAmount), 0
        );
      } else if (location.state?.fromAccountsReceivable) {
        // Single invoice from AR page
        totalOutstandingBalance = parseFloat(location.state.prefilledData?.amount || '0');
      }
      
      // Check for overpayment
      if (paymentAmount > totalOutstandingBalance && totalOutstandingBalance > 0) {
        const overpaymentAmount = paymentAmount - totalOutstandingBalance;
        
        setOverpaymentData({
          paymentAmount,
          outstandingBalance: totalOutstandingBalance,
          overpaymentAmount,
          entityName: formData.clientName || 'Customer',
          entityType: 'CUSTOMER',
          message: `Payment of ${paymentAmount.toFixed(2)} exceeds outstanding balance of ${totalOutstandingBalance.toFixed(2)}. Overpayment of ${overpaymentAmount.toFixed(2)} will be created as credit balance.`
        });
        setShowOverpaymentAlert(true);
        return; // Stop submission until user confirms
      }
    }
    
    // Phase 3: Conditional Cash Register Validation
    const needsCashRegister = 
      (formData.relatedDocumentType === 'CONTRIBUTION' && formData.paymentMethod === 'CASH') || 
      (formData.relatedDocumentType === 'LOAN' && formData.paymentMethod === 'CASH') ||
      (formData.relatedDocumentType === 'AR_COLLECTION' && formData.paymentMethod === 'CASH');
    
    if (needsCashRegister && !formData.cashRegisterId) {
      toast.error(t('selectCashRegister') || 'Please select a cash register');
      return;
    }

    if (formData.transactionType === 'INFLOW') {
      // INFLOW validations - AR_COLLECTION (Credit Sales and Credit Card Sales), CONTRIBUTION, LOAN
      if (formData.relatedDocumentType === 'AR_COLLECTION') {
        if (!formData.customerId) {
          toast.error(t('selectCustomer') || 'Please select a customer');
          return;
        }
        // Skip invoice selection validation if coming from AR with pre-selected invoice
        if (selectedInvoices.length === 0 && !location.state?.fromAccountsReceivable) {
          toast.error(t('selectInvoices') || 'Please select at least one credit sale invoice');
          return;
        }
      }
      
      if (formData.relatedDocumentType === 'CONTRIBUTION' || formData.relatedDocumentType === 'LOAN') {
        if (!formData.investmentAgreementId) {
          toast.error('Please select an investment/loan agreement');
          return;
        }
      }

      // Payment method validations
      if (formData.paymentMethod === 'DEBIT_CARD' && !formData.cardPaymentNetworkId) {
        toast.error('Please select a debit card payment network');
        return;
      }
      
      if (formData.paymentMethod === 'CREDIT_CARD' && !formData.cardPaymentNetworkId) {
        toast.error('Please select a credit card payment network');
        return;
      }
      
      if ((formData.paymentMethod === 'BANK_TRANSFER' || formData.paymentMethod === 'DEPOSIT') && !formData.bankAccountId) {
        toast.error('Please select a bank account');
        return;
      }
    } else if (formData.transactionType === 'OUTFLOW') {
      // OUTFLOW validations - only allow BANK_DEPOSIT or CORRECTION
      if (formData.paymentMethod !== 'BANK_DEPOSIT' && formData.paymentMethod !== 'CORRECTION') {
        toast.error('OUTFLOW only allows Bank Deposit or Correction');
        return;
      }
    }

    try {
      setIsSubmitting(true);  // Disable button
      
      // Clean form data: convert empty strings to null, parse integers
      const cleanedData = cleanFormData(
        {
          ...formData,
          invoiceIds: selectedInvoices.length > 0 ? JSON.stringify(selectedInvoices) : null,
        },
        ['cashRegisterId', 'bankAccountId', 'customerId', 'cardId', 'cardPaymentNetworkId']  // Integer fields
      );
      // ✅ CRITICAL: Validate cash register balance for OUTFLOW
      if (formData.transactionType === 'OUTFLOW' && formData.cashRegisterId) {
        const selectedCashRegister = Array.isArray(cashRegisterMasters) ?
          cashRegisterMasters.find(register => register.id === parseInt(formData.cashRegisterId)) : null;
        const outflowAmount = parseFloat(formData.amount);
        
        if (selectedCashRegister && selectedCashRegister.balance < outflowAmount) {
          toast.error(
            `Insufficient balance in cash register "${selectedCashRegister.name}". ` +
            `Available: ${selectedCashRegister.balance.toFixed(2)}, Required: ${outflowAmount.toFixed(2)}. ` +
            `Cannot perform transaction that would result in negative balance.`
          );
          return;
        }
      }
      
      await axios.post('/cash-register', cleanedData);
      
      // ✅ OPTIMIZATION: Use React Query cache invalidation and refresh pagination
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashTransactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashRegisters });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      refresh(); // Refresh paginated data
      
      // Refresh credit preview after AR collection payment
      if (formData.relatedDocumentType === 'AR_COLLECTION' && formData.customerId) {
        fetchCreditPreview(formData.customerId);
      }
      
      resetForm();
      
      if (location.state?.fromAccountsReceivable) {
        toast.success('Customer invoice collection completed successfully! The Accounts Receivable status has been updated.');
        // Navigate back to Accounts Receivable to see the updated status
        setTimeout(() => {
          navigate('/accounts-receivable');
        }, 1000);
      } else {
        toast.success(t('transactionCreated') || 'Transaction created successfully!');
      }
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);  // Re-enable button
    }
  };

  // ✅ MEMOIZED: Overpayment handling functions
  const handleOverpaymentConfirm = useCallback(() => {
    setAllowOverpayment(true);
    setShowOverpaymentAlert(false);
    // Automatically resubmit the form
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
      }
    }, 100);
  }, []);

  const handleOverpaymentAdjust = useCallback(() => {
    if (overpaymentData) {
      setFormData(prev => ({
        ...prev,
        amount: overpaymentData.outstandingBalance.toString()
      }));
    }
    setShowOverpaymentAlert(false);
    setAllowOverpayment(false);
  }, [overpaymentData]);

  const handleDelete = useCallback(async (id: number) => {
    // Find the transaction to get its details
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) {
      toast.error('Transaction not found');
      return;
    }

    // Navigate to Transaction Deletion page with cash register details
    navigate('/transaction-deletion', {
      state: {
        transactionType: 'CASH_REGISTER',
        transactionId: id,
        transactionDetails: {
          registrationNumber: transaction.registrationNumber,
          amount: transaction.amount,
          description: transaction.description,
          transactionType: transaction.transactionType,
          relatedDocumentType: transaction.relatedDocumentType,
          relatedDocumentNumber: transaction.relatedDocumentNumber,
          clientName: transaction.clientName
        }
      }
    });
  }, [transactions, navigate]);

  const resetForm = useCallback(() => {
    setFormData({
      registrationDate: new Date().toISOString().split('T')[0],
      transactionType: 'INFLOW',
      amount: '',
      paymentMethod: 'CASH',
      relatedDocumentType: 'AR_COLLECTION', // Fixed: Changed from 'AR_COLLECTION' to match default state
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
      // New fields for dynamic payment method dropdowns
      cardId: '',
      cardPaymentNetworkId: '',
    });
    setSelectedInvoices([]);
    setPendingCreditSales([]);
    setShowModal(false);
    setShowCustomerCreditAwareModal(false); // ✅ Reset customer credit-aware modal
    
    // Clear the location state to prevent auto-opening again
    if (location.state?.fromAccountsReceivable) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // ✅ MEMOIZED: Customer credit-aware payment success handler
  const handleCustomerCreditAwarePaymentSuccess = useCallback(() => {
    // ✅ OPTIMIZATION: Use React Query cache invalidation and refresh pagination
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashTransactions });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashRegisters });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients });
    refresh(); // Refresh paginated data
    
    // 🔥 FIX: Refresh credit preview to show updated credit balance
    if (formData.customerId) {
      fetchCreditPreview(formData.customerId);
    }
    
    resetForm();
    
    if (location.state?.fromAccountsReceivable) {
      toast.success('Smart customer payment completed successfully! Credit balances were automatically applied.');
      setTimeout(() => {
        navigate('/accounts-receivable');
      }, 1000);
    } else {
      toast.success('Smart customer payment completed successfully!');
    }
  }, [queryClient, formData.customerId, location.state, navigate, fetchCreditPreview, resetForm, refresh]);

  const handleDeposit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!depositData.cashRegisterId) {
      toast.error(t('selectCashRegister') || 'Please select a cash register');
      return;
    }
    
    if (!depositData.bankAccountId) {
      toast.error(t('selectBankAccount') || 'Please select a bank account');
      return;
    }
    
    try {
      // Create OUTFLOW transaction for cash register (money leaving)
      await axios.post('/cash-register', {
        registrationDate: depositData.date,
        transactionType: 'OUTFLOW',
        amount: depositData.amount,
        paymentMethod: 'BANK_DEPOSIT',
        relatedDocumentType: 'BANK_DEPOSIT',
        relatedDocumentNumber: depositData.transferNumber || '', // ✅ NEW: Pass user-entered transfer number
        description: depositData.description || 'Bank deposit',
        cashRegisterId: depositData.cashRegisterId,
        bankAccountId: depositData.bankAccountId,
        transferNumber: depositData.transferNumber || '', // ✅ NEW: Pass transfer number for bank register
      });
      
      toast.success('Bank deposit recorded successfully! Cash register balance decreased and bank account increased.');
      
      // ✅ OPTIMIZATION: Use React Query cache invalidation and refresh pagination
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashTransactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashRegisters });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankTransactions });
      refresh(); // Refresh paginated data
      
      resetDepositForm();
    } catch (error: any) {
      console.error('Error recording deposit:', error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    }
  }, [depositData, queryClient, t, refresh]);

  const resetDepositForm = useCallback(() => {
    setDepositData({
      date: new Date().toISOString().split('T')[0],
      cashRegisterId: '',
      bankAccountId: '',
      amount: '',
      description: '',
      transferNumber: '', // ✅ NEW: Reset transfer number
    });
    setShowDepositModal(false);
  }, []);

  // ✅ MEMOIZED: Handle customer selection for AR collection
  const handleCustomerChange = useCallback((customerId: string) => {
    setFormData(prev => ({ ...prev, customerId }));
    setSelectedInvoices([]);
    fetchPendingCreditSales(customerId);
  }, [fetchPendingCreditSales]);

  // ✅ MEMOIZED: Toggle invoice selection
  const toggleInvoiceSelection = useCallback((invoiceId: number) => {
    setSelectedInvoices(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  }, []);

  // Fetch credit preview when amount or invoices change
  useEffect(() => {
    if (formData.relatedDocumentType === 'AR_COLLECTION' && formData.customerId && formData.amount) {
      fetchCreditPreview(formData.customerId);
    } else {
      setCreditPreview(null);
    }
  }, [formData.amount, selectedInvoices, formData.customerId, formData.relatedDocumentType]);

  // ✅ PROFESSIONAL: Generate comprehensive report grouped by store
  const generateProfessionalReport = useCallback(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const filtered = safeTransactions.filter(t => {
      const tDate = new Date(t.registrationDate.split('T')[0]);
      const selectedDate = new Date(reportDate);
      tDate.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      return tDate.getTime() === selectedDate.getTime();
    });

    // Group transactions by cash register (store)
    const storeReports = new Map();
    
    // Initialize all cash registers
    cashRegisterMasters.forEach(register => {
      storeReports.set(register.id, {
        id: register.id,
        name: register.name,
        code: register.code,
        location: register.location,
        openingBalance: parseFloat(register.balance.toString()),
        inflow: 0,
        inflowCount: 0,
        outflow: 0,
        outflowCount: 0,
        bankDeposits: [] as Array<{ bankName: string; accountNumber: string; amount: number }>,
        transactions: [] as typeof safeTransactions
      });
    });

    // Process transactions
    filtered.forEach(t => {
      if (t.cashRegisterId && storeReports.has(t.cashRegisterId)) {
        const store = storeReports.get(t.cashRegisterId);
        store.transactions.push(t);
        
        if (t.transactionType === 'INFLOW') {
          store.inflow += parseFloat(t.amount.toString());
          store.inflowCount++;
        } else if (t.transactionType === 'OUTFLOW') {
          store.outflow += parseFloat(t.amount.toString());
          store.outflowCount++;
          
          // Track bank deposits
          if (t.paymentMethod === 'BANK_DEPOSIT' && t.bankAccount) {
            store.bankDeposits.push({
              bankName: t.bankAccount.bankName,
              accountNumber: t.bankAccount.accountNumber,
              amount: parseFloat(t.amount.toString())
            });
          }
        }
      }
    });

    // Calculate totals
    let totalInflow = 0;
    let totalOutflow = 0;
    let totalBankDeposits = 0;
    const allBankDeposits: Array<{ bankName: string; accountNumber: string; amount: number; storeName: string }> = [];

    storeReports.forEach((store: any) => {
      totalInflow += store.inflow;
      totalOutflow += store.outflow;
      store.bankDeposits.forEach((deposit: any) => {
        totalBankDeposits += deposit.amount;
        allBankDeposits.push({
          ...deposit,
          storeName: store.name
        });
      });
    });

    return {
      stores: Array.from(storeReports.values()).filter((s: any) => s.transactions.length > 0),
      allStores: Array.from(storeReports.values()),
      totalInflow,
      totalOutflow,
      totalBankDeposits,
      netMovement: totalInflow - totalOutflow,
      allBankDeposits,
      transactionCount: filtered.length
    };
  }, [transactions, reportDate, cashRegisterMasters]);

  // ✅ REMOVED: No longer need manual filtering - backend handles it via pagination
  // Backend now handles search and filters, so we use the data directly from useTableData

  // ✅ MEMOIZED: Total calculations
  const { totalInflow, totalOutflow } = useMemo(() => {
    if (!Array.isArray(transactions)) return { totalInflow: 0, totalOutflow: 0 };
    
    const totalInflow = transactions
      .filter(t => t.transactionType === 'INFLOW')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const totalOutflow = transactions
      .filter(t => t.transactionType === 'OUTFLOW')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    return { totalInflow, totalOutflow };
  }, [transactions]);

  // Safety check - ensure transactions is always an array
  console.log('🔍 CashRegister render - transactions:', transactions, 'Type:', typeof transactions, 'IsArray:', Array.isArray(transactions));
  
  // ✅ OPTIMIZED: Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading cash register data...</span>
      </div>
    );
  }

  // ✅ ERROR STATE
  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">Error loading cash register data</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!Array.isArray(transactions)) {
    console.log('⚠️ Transactions is not an array, showing loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{t('cashRegister')}</h2>
            <p className="text-gray-600 mt-1">{t('dailyCashManagement')}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowReportModal(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
            >
              <FaWallet /> {t('endOfDayReport')}
            </button>
            <button
              onClick={() => setShowDepositModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <FaArrowDown /> {t('bankDeposit')}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <FaPlus /> {t('newTransaction')}
            </button>
          </div>
        </div>

        {/* Summary Cards - SIMPLIFIED: Show inflow, outflow, and net position */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">{t('totalInflow')}</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatNumber(totalInflow)}
                </p>
                <p className="text-xs text-green-500 mt-1">
                  {Array.isArray(transactions) ? transactions.filter(t => t.transactionType === 'INFLOW').length : 0} transactions
                </p>
              </div>
              <FaArrowUp className="text-green-400 text-3xl" />
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">{t('totalOutflow')}</p>
                <p className="text-2xl font-bold text-red-700">
                  {formatNumber(totalOutflow)}
                </p>
                <p className="text-xs text-red-500 mt-1">
                  {Array.isArray(transactions) ? transactions.filter(t => t.transactionType === 'OUTFLOW').length : 0} transactions
                </p>
              </div>
              <FaArrowDown className="text-red-400 text-3xl" />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">{t('netCashPosition')}</p>
                <p className={`text-2xl font-bold ${totalInflow - totalOutflow >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  {formatNumber(totalInflow - totalOutflow)}
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  Inflow - Outflow
                </p>
              </div>
              <FaWallet className="text-blue-400 text-3xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ✅ NEW: Use SearchBar component */}
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t('searchTransactions')}
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">{t('allTransactions')}</option>
            <option value="INFLOW">{t('inflowMoneyIn')}</option>
            <option value="OUTFLOW">{t('outflowMoneyOut')}</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                  {t('registrationHash')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                  {t('date')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Store Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Bank Name & Number
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Account Type
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                  {t('type')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                  {t('method')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Client RNC
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                  NCF
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                  {t('description')}
                </th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-800 uppercase tracking-wider">
                  {t('amount')}
                </th>
                <th className="px-6 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-8 text-center text-gray-500">
                    {transactionsLoading ? 'Loading transactions...' : t('noTransactionsFound')}
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => {
                const isDeleted = transaction.deletion_status === 'EXECUTED';
                const isReversal = transaction.is_reversal === true;
                
                return (
                <tr 
                  key={transaction.id} 
                  className={`hover:bg-gray-50 transition-colors ${
                    isDeleted ? 'bg-red-50 opacity-75' : 
                    isReversal ? 'bg-orange-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {isDeleted && <span className="text-red-500">🗑️</span>}
                      {isReversal && <span className="text-orange-500">↩️</span>}
                      <span className={isDeleted ? 'line-through text-gray-500' : ''}>
                        {transaction.registrationNumber}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.registrationDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.cashRegisterMaster?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.bankAccount 
                      ? `${transaction.bankAccount.bankName} - ${transaction.bankAccount.accountNumber}` 
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.bankAccount?.accountType || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTransactionStatusBadge(transaction)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.clientName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transaction.clientRnc || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transaction.ncf || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    <span className={isDeleted ? 'line-through text-gray-500' : ''}>
                      {transaction.description}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                    <span className={`${
                      isDeleted ? 'line-through text-gray-500' : 
                      transaction.transactionType === 'INFLOW' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.transactionType === 'INFLOW' ? '+' : '-'}
                      {formatNumber(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ NEW: Pagination - Always visible, no scroll needed */}
      <div className="bg-white rounded-lg shadow-sm p-4 sticky bottom-0 z-10">
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          from={pagination.from}
          to={pagination.to}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
          onPageChange={goToPage}
          onLimitChange={changeLimit}
          onFirst={firstPage}
          onLast={lastPage}
          onNext={nextPage}
          onPrev={prevPage}
        />
      </div>

      {/* Transaction Modal - Phase 3 Updated */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-6">
                {t('newCashTransaction')}
                {location.state?.fromAccountsReceivable && (
                  <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium ml-3">
                    From Accounts Receivable
                  </span>
                )}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {location.state?.fromAccountsReceivable && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">💰</div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-900 mb-1">
                          Customer Invoice Collection
                        </p>
                        <p className="text-xs text-green-700 mb-2">
                          This transaction will collect payment for customer invoices (credit sales or credit card sales). The form has been pre-filled with the collection details.
                          <strong> Please keep Transaction Type as "INFLOW" and Document Type as "AR_COLLECTION".</strong>
                        </p>
                        <div className="bg-white rounded p-2 text-xs">
                          <p className="text-gray-600">
                            <strong>Customer:</strong> {location.state.prefilledData?.clientName}
                          </p>
                          <p className="text-gray-600">
                            <strong>Amount:</strong> ${location.state.prefilledData?.amount}
                          </p>
                          <p className="text-gray-600">
                            <strong>AR ID:</strong> #{location.state.prefilledData?.accountsReceivableId}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cash Register Selection - Conditional based on document type, payment method, and credit balance */}
                  {(() => {
                    // Hide cash register selection if credit covers full invoice (scenarios 2️⃣, 4️⃣, 6️⃣)
                    const isCreditOnlyPayment = 
                      formData.relatedDocumentType === 'AR_COLLECTION' && 
                      creditPreview && 
                      !creditPreview.paymentTypeRequired;
                    
                    if (isCreditOnlyPayment) {
                      return null; // Already shown in payment method section
                    }
                    
                    const needsCashRegister = 
                      (formData.relatedDocumentType === 'CONTRIBUTION' && formData.paymentMethod === 'CASH') || 
                      (formData.relatedDocumentType === 'LOAN' && formData.paymentMethod === 'CASH') ||
                      (formData.relatedDocumentType === 'AR_COLLECTION' && formData.paymentMethod === 'CASH');
                    
                    return needsCashRegister ? (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('selectCashRegister')} *
                        </label>
                        <select
                          required
                          value={formData.cashRegisterId}
                          onChange={(e) => setFormData({ ...formData, cashRegisterId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">{t('selectCashRegister')}</option>
                          {cashRegisterMasters.map((register) => {
                            console.log('Rendering register:', register);
                            return (
                              <option key={register.id} value={register.id}>
                                {register.code} - {register.name} ({register.location}) - Balance: {Number(register.balance || 0).toFixed(2)}
                              </option>
                            );
                          })}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          💰 Physical money will be stored in this cash register
                        </p>
                      </div>
                    ) : (
                      <div className="md:col-span-2">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            ℹ️ Cash register not required for this payment method - no physical money involved
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('date')} *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.registrationDate}
                      onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('transactionType')} *
                    </label>
                    <select
                      required
                      value={formData.transactionType}
                      onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="INFLOW">{t('inflowMoneyIn')}</option>
                      <option value="OUTFLOW">{t('outflowMoneyOut')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('amount')} *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                    
                    {/* Overpayment Warning */}
                    {(() => {
                      if (formData.relatedDocumentType === 'AR_COLLECTION' && formData.amount) {
                        const paymentAmount = parseFloat(formData.amount);
                        let totalOutstandingBalance = 0;
                        
                        if (selectedInvoices.length > 0) {
                          const selectedInvoiceData = pendingCreditSales.filter(invoice => 
                            selectedInvoices.includes(invoice.id)
                          );
                          totalOutstandingBalance = selectedInvoiceData.reduce((sum, invoice) => 
                            sum + parseFloat(invoice.balanceAmount), 0
                          );
                        } else if (location.state?.fromAccountsReceivable) {
                          totalOutstandingBalance = parseFloat(location.state.prefilledData?.amount || '0');
                        }
                        
                        if (paymentAmount > totalOutstandingBalance && totalOutstandingBalance > 0) {
                          const overpaymentAmount = paymentAmount - totalOutstandingBalance;
                          return (
                            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded flex items-center gap-2">
                              <span className="text-orange-600">⚠️</span>
                              <span className="text-sm text-orange-700">
                                Overpayment of ₹{overpaymentAmount.toFixed(2)} will create credit balance
                              </span>
                            </div>
                          );
                        }
                      }
                      return null;
                    })()}
                  </div>

                  {/* Phase 3: Conditional fields based on transaction type */}
                  {formData.transactionType === 'INFLOW' && (
                    <>
                      {/* Conditionally show payment method - hide when credit covers full invoice */}
                      {(() => {
                        // Hide payment method selection if credit covers full invoice (scenarios 2️⃣, 4️⃣, 6️⃣)
                        const shouldHidePaymentMethod = 
                          formData.relatedDocumentType === 'AR_COLLECTION' && 
                          creditPreview && 
                          !creditPreview.paymentTypeRequired;
                        
                        if (shouldHidePaymentMethod) {
                          return (
                            <div className="md:col-span-2">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-2xl">💳</span>
                                  <h4 className="font-medium text-green-900">Credit Balance Payment</h4>
                                </div>
                                <p className="text-sm text-green-800 mb-2">
                                  This payment will be processed entirely using the customer's existing credit balance.
                                </p>
                                <div className="bg-white rounded p-3 text-sm">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-green-700">Available Credit:</span>
                                      <span className="ml-2 font-medium">₹{formatNumber(creditPreview.availableCredit || 0)}</span>
                                    </div>
                                    <div>
                                      <span className="text-green-700">Invoice Amount:</span>
                                      <span className="ml-2 font-medium">₹{formatNumber(creditPreview.totalInvoiceBalance || 0)}</span>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-xs text-green-600 mt-2">
                                  ✅ No payment method or cash register selection required
                                </p>
                              </div>
                            </div>
                          );
                        }
                        
                        // Show normal payment method selection
                        return (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('paymentMethod')} *
                              {isLoadingCreditPreview && (
                                <span className="ml-2 text-xs text-blue-600">
                                  (Checking credit balance...)
                                </span>
                              )}
                            </label>
                            <select
                              required
                              value={formData.paymentMethod}
                              onChange={(e) => {
                                const newPaymentMethod = e.target.value;
                                const needsCashRegister = 
                                  (formData.relatedDocumentType === 'CONTRIBUTION' && newPaymentMethod === 'CASH') || 
                                  (formData.relatedDocumentType === 'LOAN' && newPaymentMethod === 'CASH') ||
                                  (formData.relatedDocumentType === 'AR_COLLECTION' && newPaymentMethod === 'CASH');
                                
                                setFormData({ 
                                  ...formData, 
                                  paymentMethod: newPaymentMethod,
                                  // Clear cashRegisterId if not needed
                                  cashRegisterId: needsCashRegister ? formData.cashRegisterId : ''
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="CASH">{t('cash')}</option>
                              {/* Hide credit/debit card options for CONTRIBUTION and LOAN */}
                              {formData.relatedDocumentType !== 'CONTRIBUTION' && formData.relatedDocumentType !== 'LOAN' && (
                                <>
                                  <option value="CREDIT_CARD">{t('creditCard')}</option>
                                  <option value="DEBIT_CARD">{t('debitCard')}</option>
                                </>
                              )}
                              <option value="BANK_TRANSFER">{t('bankTransfer')}</option>
                              <option value="DEPOSIT">{t('deposit')}</option>
                              <option value="BANK_CHEQUE">{t('bankCheque')}</option>
                            </select>
                            
                            {/* Show credit preview info when available */}
                            {creditPreview && formData.relatedDocumentType === 'AR_COLLECTION' && (
                              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                <p className="text-blue-700">
                                  💡 Credit: ₹{formatNumber(creditPreview.availableCredit || 0)} | 
                                  Invoice: ₹{formatNumber(creditPreview.totalInvoiceBalance || 0)} | 
                                  Cash Needed: ₹{formatNumber(creditPreview.cashPaymentNeeded || 0)}
                                </p>
                                {creditPreview.willCreateNewCredit && (
                                  <p className="text-blue-700 mt-1">
                                    ✨ Will create ₹{formatNumber(creditPreview.newCreditAmount)} new credit
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('relatedDocType')} *
                        </label>
                        <select
                          required
                          value={formData.relatedDocumentType}
                          onChange={(e) => {
                            const newDocumentType = e.target.value;
                            const needsCashRegister = 
                              (newDocumentType === 'CONTRIBUTION' && formData.paymentMethod === 'CASH') || 
                              (newDocumentType === 'LOAN' && formData.paymentMethod === 'CASH') ||
                              (newDocumentType === 'AR_COLLECTION' && formData.paymentMethod === 'CASH');
                            
                            // Reset payment method if switching to CONTRIBUTION/LOAN with card payment selected
                            let newPaymentMethod = formData.paymentMethod;
                            if ((newDocumentType === 'CONTRIBUTION' || newDocumentType === 'LOAN') && 
                                (formData.paymentMethod === 'CREDIT_CARD' || formData.paymentMethod === 'DEBIT_CARD')) {
                              newPaymentMethod = 'CASH'; // Reset to CASH as default
                            }
                            
                            setFormData({ 
                              ...formData, 
                              relatedDocumentType: newDocumentType,
                              paymentMethod: newPaymentMethod,
                              // Clear cashRegisterId if not needed
                              cashRegisterId: needsCashRegister ? formData.cashRegisterId : ''
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="AR_COLLECTION">{t('creditSaleCollection')} (Credit & Card Sales)</option>
                          <option value="CONTRIBUTION">{t('contribution')}</option>
                          <option value="LOAN">{t('loan')}</option>
                        </select>
                      </div>

                      {/* AR Collection: Show customer and invoice selection */}
                      {formData.relatedDocumentType === 'AR_COLLECTION' && (
                        <>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('selectCustomer')} *
                            </label>
                            <select
                              required
                              value={formData.customerId}
                              onChange={(e) => handleCustomerChange(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">{t('selectCustomer')}</option>
                              {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                  {customer.code} - {customer.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {pendingCreditSales.length > 0 && (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Customer Invoices * (Credit sales and credit card sales)
                              </label>
                              <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                                {pendingCreditSales.map((invoice) => (
                                  <div key={invoice.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                                    <input
                                      type="checkbox"
                                      checked={selectedInvoices.includes(invoice.id)}
                                      onChange={() => toggleInvoiceSelection(invoice.id)}
                                      className="w-4 h-4"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium">
                                          {invoice.registrationNumber} - {formatNumber(invoice.balanceAmount)}
                                        </p>
                                        {(invoice.type === 'CREDIT_CARD_SALE' || invoice.type === 'DEBIT_CARD_SALE') && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                            💳 Card Sale
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        {invoice.type === 'CREDIT_CARD_SALE' || invoice.type === 'DEBIT_CARD_SALE' 
                                          ? `Credit Card Sale${invoice.cardNetwork ? ` via ${invoice.cardNetwork}` : ''} - ${new Date(invoice.registrationDate).toLocaleDateString()}`
                                          : `Credit Sale - ${new Date(invoice.registrationDate).toLocaleDateString()}`
                                        }
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-blue-600 mt-2">
                                ℹ️ Credit Sales and Credit Card Sales with customer information are shown here.
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* CONTRIBUTION/LOAN: Show investment agreement selection */}
                      {(formData.relatedDocumentType === 'CONTRIBUTION' || formData.relatedDocumentType === 'LOAN') && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {formData.relatedDocumentType === 'CONTRIBUTION' ? 'Select Investment Agreement' : 'Select Loan Agreement'} *
                          </label>
                          <select
                            required
                            value={formData.investmentAgreementId || ''}
                            onChange={(e) => setFormData({ ...formData, investmentAgreementId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">
                              {formData.relatedDocumentType === 'CONTRIBUTION' ? 'Select Investment Agreement' : 'Select Loan Agreement'}
                            </option>
                            {activeAgreements
                              .filter((agreement) => {
                                // Filter agreements based on document type
                                if (formData.relatedDocumentType === 'CONTRIBUTION') {
                                  return agreement.agreementType === 'INVESTMENT';
                                } else if (formData.relatedDocumentType === 'LOAN') {
                                  return agreement.agreementType === 'LOAN';
                                }
                                return false;
                              })
                              .map((agreement) => (
                                <option key={agreement.id} value={agreement.id}>
                                  {agreement.agreementNumber} - {agreement.investorName} 
                                  (Balance: {formatNumber(agreement.balanceAmount)})
                                </option>
                              ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.relatedDocumentType === 'CONTRIBUTION' 
                              ? '💰 Showing active investment agreements with remaining balance'
                              : '🏦 Showing active loan agreements with remaining balance'
                            }
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            ⚠️ You can only receive money up to the remaining agreement balance. 
                            Create agreements first in Investment Agreements page.
                          </p>
                        </div>
                      )}

                      {/* Cheque Number for Bank Cheque */}
                      {formData.paymentMethod === 'BANK_CHEQUE' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('chequeNumber')}
                          </label>
                          <input
                            type="text"
                            value={formData.chequeNumber}
                            onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="CHQ-001"
                          />
                        </div>
                      )}

                      {/* Bank Account Selection for BANK_TRANSFER and DEPOSIT */}
                      {(formData.paymentMethod === 'BANK_TRANSFER' || formData.paymentMethod === 'DEPOSIT') && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Bank Account *
                          </label>
                          <select
                            required
                            value={formData.bankAccountId}
                            onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select bank account...</option>
                            {bankAccounts.map(account => (
                              <option key={account.id} value={account.id}>
                                {account.bankName} - {account.accountNumber} (Balance: ${Number(account.balance || 0).toFixed(2)})
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            🏦 Money will be transferred to this bank account
                          </p>
                        </div>
                      )}

                      {/* Payment Network Selection for DEBIT_CARD */}
                      {formData.paymentMethod === 'DEBIT_CARD' && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Debit Card Network *
                          </label>
                          <select
                            required
                            value={formData.cardPaymentNetworkId}
                            onChange={(e) => setFormData({ ...formData, cardPaymentNetworkId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select payment network...</option>
                            {paymentNetworks.filter(network => network.type === 'DEBIT' && network.isActive).map(network => (
                              <option key={network.id} value={network.id}>
                                {network.name} - Fee: {(Number(network.processingFee) * 100).toFixed(2)}% - Settlement: {network.settlementDays} day{network.settlementDays !== 1 ? 's' : ''}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            💳 DEBIT: Creates Accounts Receivable from selected payment network
                          </p>
                        </div>
                      )}

                      {/* Payment Network Selection for CREDIT_CARD */}
                      {formData.paymentMethod === 'CREDIT_CARD' && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Credit Card Network *
                          </label>
                          <select
                            required
                            value={formData.cardPaymentNetworkId}
                            onChange={(e) => setFormData({ ...formData, cardPaymentNetworkId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select payment network...</option>
                            {paymentNetworks.filter(network => network.type === 'CREDIT' && network.isActive).map(network => (
                              <option key={network.id} value={network.id}>
                                {network.name} - Fee: {(Number(network.processingFee) * 100).toFixed(2)}% - Settlement: {network.settlementDays} day{network.settlementDays !== 1 ? 's' : ''}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            💳 CREDIT: Payment will be processed through selected payment network
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('receiptNumber')}
                        </label>
                        <input
                          type="text"
                          value={formData.receiptNumber}
                          onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="REC-001"
                        />
                      </div>
                    </>
                  )}

                  {/* Phase 3: OUTFLOW - Only Bank Deposit or Correction */}
                  {formData.transactionType === 'OUTFLOW' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('paymentMethod')} *
                        </label>
                        <select
                          required
                          value={formData.paymentMethod}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="BANK_DEPOSIT">{t('bankDeposit')}</option>
                          <option value="CORRECTION">{t('correction')}</option>
                        </select>
                      </div>

                      {/* Bank Account for Bank Deposit */}
                      {formData.paymentMethod === 'BANK_DEPOSIT' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('selectBankAccount')} *
                          </label>
                          <select
                            required
                            value={formData.bankAccountId}
                            onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">{t('selectBankAccount')}</option>
                            {bankAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.code} - {account.bankName} - {account.accountNumber} - Balance: {formatNumber(account.balance)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('description')} *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('describeTransaction')}
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isSubmitting}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? t('creating') || 'Creating...' : t('createTransaction')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bank Deposit Modal - Phase 3 Updated */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-6 text-green-600">{t('bankDeposit')}</h3>
              <p className="text-gray-600 mb-4">{t('recordCashCheckDeposit')}</p>

              <form onSubmit={handleDeposit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('date')} *</label>
                    <input
                      type="date"
                      value={depositData.date}
                      onChange={(e) => setDepositData({...depositData, date: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('amount')} *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={depositData.amount}
                      onChange={(e) => setDepositData({...depositData, amount: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('selectCashRegister')} *</label>
                  <select
                    value={depositData.cashRegisterId}
                    onChange={(e) => setDepositData({...depositData, cashRegisterId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">{t('selectCashRegister')}</option>
                    {cashRegisterMasters.map((register) => (
                      <option key={register.id} value={register.id}>
                        {register.code} - {register.name} ({register.location}) - Balance: {Number(register.balance || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('selectBankAccount')} *</label>
                  <select
                    value={depositData.bankAccountId}
                    onChange={(e) => setDepositData({...depositData, bankAccountId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">{t('selectBankAccount')}</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.bankName} - {account.accountNumber} - Balance: {formatNumber(account.balance)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transfer Number
                    <span className="text-xs text-gray-500 ml-2">(Bank reference number)</span>
                  </label>
                  <input
                    type="text"
                    value={depositData.transferNumber}
                    onChange={(e) => setDepositData({...depositData, transferNumber: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Enter bank transfer/deposit reference number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('description')}</label>
                  <input
                    type="text"
                    value={depositData.description}
                    onChange={(e) => setDepositData({...depositData, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder={t('dailyCashDeposit')}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    {t('recordDeposit')}
                  </button>
                  <button
                    type="button"
                    onClick={resetDepositForm}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* End of Day Report Modal - PROFESSIONAL REDESIGN */}
      {showReportModal && (() => {
        const report = generateProfessionalReport();
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-8"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      <span>📊</span>
                      End of Day Cash Report
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      {new Date(reportDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Date Selector */}
                <div className="mt-4">
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="px-4 py-2 rounded-lg text-gray-800 font-medium focus:ring-2 focus:ring-white"
                  />
                </div>
              </div>

              <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                {/* Overall Summary */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 mb-6 border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>📈</span>
                    Overall Summary
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Total Stores</p>
                      <p className="text-2xl font-bold text-gray-800">{report.stores.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Cash Inflow</p>
                      <p className="text-2xl font-bold text-green-600">{formatNumber(report.totalInflow)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Cash Outflow</p>
                      <p className="text-2xl font-bold text-red-600">{formatNumber(report.totalOutflow)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Bank Deposits</p>
                      <p className="text-2xl font-bold text-blue-600">{formatNumber(report.totalBankDeposits)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Net Movement</p>
                      <p className={`text-2xl font-bold ${report.netMovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {report.netMovement >= 0 ? '+' : ''}{formatNumber(report.netMovement)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Per-Store Breakdown */}
                <div className="space-y-4 mb-6">
                  {report.stores.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">No transactions found for this date</p>
                      <p className="text-sm mt-2">Try selecting a different date</p>
                    </div>
                  ) : (
                    report.stores.map((store: any) => {
                      const expectedBalance = store.openingBalance + store.inflow - store.outflow;
                      const cashRemaining = expectedBalance;
                      const hasShortage = cashRemaining < 0;
                      
                      return (
                        <div key={store.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Store Header */}
                          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                  <span>🏪</span>
                                  {store.name}
                                </h5>
                                <p className="text-xs text-gray-600 mt-1">
                                  {store.code} • {store.location}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-600">Transactions</p>
                                <p className="text-lg font-bold text-gray-800">{store.transactions.length}</p>
                              </div>
                            </div>
                          </div>

                          {/* Store Details */}
                          <div className="p-4 bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {/* Left Column */}
                              <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                  <span className="text-sm text-gray-600">Opening Balance:</span>
                                  <span className="text-lg font-semibold text-gray-800">{formatNumber(store.openingBalance)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                  <span className="text-sm text-green-700">Cash Inflow:</span>
                                  <span className="text-lg font-semibold text-green-600">
                                    +{formatNumber(store.inflow)} <span className="text-xs text-gray-500">({store.inflowCount})</span>
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                  <span className="text-sm text-red-700">Cash Outflow:</span>
                                  <span className="text-lg font-semibold text-red-600">
                                    -{formatNumber(store.outflow)} <span className="text-xs text-gray-500">({store.outflowCount})</span>
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-2 bg-blue-50 px-3 rounded">
                                  <span className="text-sm font-medium text-blue-900">Expected Balance:</span>
                                  <span className="text-xl font-bold text-blue-700">{formatNumber(expectedBalance)}</span>
                                </div>
                              </div>

                              {/* Right Column - Bank Deposits */}
                              <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <span>💸</span>
                                  Bank Deposits Made:
                                </p>
                                {store.bankDeposits.length === 0 ? (
                                  <p className="text-sm text-gray-500 italic">No deposits made today</p>
                                ) : (
                                  <div className="space-y-2">
                                    {store.bankDeposits.map((deposit: any, idx: number) => (
                                      <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                                        <span className="text-gray-700">
                                          → {deposit.bankName} (****{deposit.accountNumber})
                                        </span>
                                        <span className="font-semibold text-gray-800">{formatNumber(deposit.amount)}</span>
                                      </div>
                                    ))}
                                    <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-gray-300">
                                      <span className="text-gray-700">Total Deposited:</span>
                                      <span className="text-blue-600">{formatNumber(store.bankDeposits.reduce((sum: number, d: any) => sum + d.amount, 0))}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Cash Remaining */}
                            <div className={`rounded-lg p-4 ${hasShortage ? 'bg-red-50 border-2 border-red-300' : 'bg-green-50 border-2 border-green-300'}`}>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                  <span>💵</span>
                                  Cash Remaining in Register:
                                </span>
                                <span className={`text-2xl font-bold ${hasShortage ? 'text-red-600' : 'text-green-600'}`}>
                                  {formatNumber(cashRemaining)}
                                  {hasShortage && <span className="ml-2 text-sm">⚠️ SHORTAGE!</span>}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bank Deposit Summary */}
                {report.allBankDeposits.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>🏦</span>
                      Bank Deposit Summary
                    </h4>
                    <div className="space-y-2">
                      {report.allBankDeposits.map((deposit: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-800">{deposit.bankName} (****{deposit.accountNumber})</span>
                            <span className="text-xs text-gray-500 ml-2">from {deposit.storeName}</span>
                          </div>
                          <span className="font-bold text-blue-600">{formatNumber(deposit.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center bg-blue-100 p-3 rounded-lg font-bold border-t-2 border-blue-300">
                        <span className="text-gray-800">Total Deposited:</span>
                        <span className="text-blue-700 text-xl">{formatNumber(report.totalBankDeposits)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 p-4 rounded-b-xl border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Close Report
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
                >
                  <span>🖨️</span>
                  Print Report
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* Overpayment Alert Modal */}
      {overpaymentData && (
        <OverpaymentAlertModal
          isOpen={showOverpaymentAlert}
          onClose={() => setShowOverpaymentAlert(false)}
          onConfirm={handleOverpaymentConfirm}
          onAdjust={handleOverpaymentAdjust}
          data={overpaymentData}
        />
      )}

      {/* ✅ Customer Credit-Aware Payment Modal */}
      <CustomerCreditAwarePaymentModal
        isOpen={showCustomerCreditAwareModal}
        onClose={() => setShowCustomerCreditAwareModal(false)}
        onSuccess={handleCustomerCreditAwarePaymentSuccess}
        customerId={parseInt(formData.customerId) || 0}
        customerName={customers.find(c => c.id === parseInt(formData.customerId))?.name || ''}
        invoiceIds={selectedInvoices.length > 0 ? selectedInvoices : (location.state?.prefilledData?.accountsReceivableId ? [location.state.prefilledData.accountsReceivableId] : [])}
        requestedAmount={parseFloat(formData.amount) || 0}
        paymentMethod={formData.paymentMethod}
        cashRegisterId={parseInt(formData.cashRegisterId) || 0}
        bankAccountId={parseInt(formData.bankAccountId) || undefined}
        registrationDate={formData.registrationDate}
        description={formData.description}
      />
    </motion.div>
  );
};

export default CashRegister;
