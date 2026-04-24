import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash, FaUniversity, FaArrowUp, FaArrowDown, FaCreditCard } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios from '../api/axios';
import { formatNumber } from '../utils/formatNumber';
import { useLanguage } from '../contexts/LanguageContext';
import { extractErrorMessage } from '../utils/errorHandler';
import OverpaymentAlertModal from '../components/OverpaymentAlertModal';
import CreditAwarePaymentModal from '../components/CreditAwarePaymentModal';
import { QUERY_KEYS } from '../lib/queryKeys';

// ✅ NEW: Import pagination components
import { useTableData } from '../hooks/useTableData';
import { Pagination } from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';

// ✅ Keep React Query hooks for bank accounts and suppliers (not paginated)
import { useBankAccounts, useSuppliers } from '../hooks/queries/useSharedData';

interface BankTransaction {
  id: number;
  registrationNumber: string;
  registrationDate: string;
  transactionType: 'INFLOW' | 'OUTFLOW';
  amount: number;
  paymentMethod: string;
  relatedDocumentType: string;
  relatedDocumentNumber: string;
  clientRnc: string;
  clientName: string;
  ncf?: string;
  description: string;
  balance: number;
  bankAccountName?: string;
  bankAccountNumber?: string;
  accountType?: 'CHECKING' | 'SAVINGS'; // Account type
  referenceNumber?: string;
  chequeNumber?: string;
  transferNumber?: string;
  supplierId?: number;
  supplierName?: string;
  invoiceIds?: string;
  originalPaymentType?: string; // ⭐ NEW: Original payment type (CREDIT, CASH, etc.)
  sourceTransactionType?: string; // ⭐ NEW: Source transaction type
  
  // ✅ NEW: Deletion tracking fields
  deletion_status?: string;
  deleted_at?: string;
  deleted_by?: number;
  deletion_reason_code?: string;
  deletion_memo?: string;
  is_reversal?: boolean;
  original_transaction_id?: number;
}



interface PendingInvoice {
  id: number;
  registrationNumber: string;
  amount: number;
  balanceAmount: number;
  invoiceDate: string;
  description: string;
  // Additional invoice details
  invoiceNumber?: string;
  ncf?: string;
  supplierRnc?: string;
  purchaseType?: string;
  paymentType?: string;
  type?: string;
  relatedDocumentType?: string;
}

const BankRegister = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // ✅ NEW: Use pagination hook for transactions
  const {
    data: transactions = [], // ✅ FIX: Add default empty array
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
    refresh,
    error: tableError // ✅ FIX: Capture error from hook
  } = useTableData<BankTransaction>({
    endpoint: 'bank-register',  // ✅ FIXED: No leading slash (baseURL already has /api)
    initialLimit: 50,
    initialFilters: {
      transactionType: 'All'
    },
    autoFetch: true // ✅ FIX: Explicitly enable auto-fetch
  });
  
  // ✅ Keep React Query hooks for bank accounts and suppliers (not paginated)
  const { data: bankAccounts = [], isLoading: bankAccountsLoading, error: bankAccountsError } = useBankAccounts();
  const { data: suppliers = [], isLoading: suppliersLoading, error: suppliersError } = useSuppliers();
  
  // ✅ PRESERVED: Keep all original state variables exactly as they were
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('All');
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Overpayment detection state
  const [showOverpaymentAlert, setShowOverpaymentAlert] = useState(false);
  const [overpaymentData, setOverpaymentData] = useState<any>(null);
  const [allowOverpayment, setAllowOverpayment] = useState(false);

  // Credit-aware payment state
  const [showCreditAwareModal, setShowCreditAwareModal] = useState(false);

  const [formData, setFormData] = useState({
    registrationDate: new Date().toISOString().split('T')[0],
    transactionType: 'INFLOW',
    amount: '',
    paymentMethod: 'CHEQUE',
    relatedDocumentType: '',
    relatedDocumentNumber: '',
    clientRnc: '',
    clientName: '',
    ncf: '',
    description: '',
    bankAccountId: '',
    supplierId: '',
    referenceNumber: '',
  });
  
  // ✅ OPTIMIZATION: Combine loading states
  const isLoading = transactionsLoading || bankAccountsLoading || suppliersLoading;
  
  // ✅ Update filter when filterType changes
  useEffect(() => {
    if (filterType !== 'All') {
      updateFilter('transactionType', filterType);
    } else {
      clearFilters();
    }
  }, [filterType, updateFilter, clearFilters]);
  
  // ✅ OPTIMIZATION: Memoized bank balance calculation
  const bankBalance = useMemo(() => {
    if (!formData.bankAccountId || !Array.isArray(bankAccounts)) return 0;
    const account = bankAccounts.find(acc => acc.id === parseInt(formData.bankAccountId));
    return account?.balance || 0;
  }, [formData.bankAccountId, bankAccounts]);

  // ✅ OPTIMIZATION: Memoized status badge function
  const getTransactionStatusBadge = useCallback((transaction: BankTransaction) => {
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
        {transaction.transactionType === 'INFLOW' ? '📈 INFLOW' : '📉 OUTFLOW'}
      </span>
    );
  }, []);

  useEffect(() => {
    // Handle pre-filled data from Accounts Payable
    if (location.state?.prefilledData && location.state?.fromAccountsPayable) {
      const prefilledData = location.state.prefilledData;
      console.log("Prefilled data:", prefilledData);
      setFormData(prev => ({
        ...prev,
        transactionType: prefilledData.transactionType,
        amount: prefilledData.amount,
        description: prefilledData.description,
        supplierId: prefilledData.supplierId?.toString() || '',
        clientName: prefilledData.supplierName || '', // ✅ Set client name from supplier name
      }));
      
      // For Accounts Payable payments, we don't need to fetch pending invoices
      // Instead, we'll handle this as a direct payment by pre-selecting the AP record as an invoice
      if (prefilledData.accountsPayableId) {
        setSelectedInvoices([prefilledData.accountsPayableId]);
      }
      
      setShowModal(true); // Automatically open the modal
    }
  }, [location.state]);

  useEffect(() => {
    if (formData.supplierId) {
      fetchPendingInvoices(parseInt(formData.supplierId));
    } else {
      setPendingInvoices([]);
      setSelectedInvoices([]);
    }
  }, [formData.supplierId]);

  // ✅ OPTIMIZATION: Memoized fetch pending invoices
  const fetchPendingInvoices = useCallback(async (supplierId: number) => {
    try {
      const response = await axios.get(`/bank-register/pending-invoices/${supplierId}`);
      setPendingInvoices(response.data);
    } catch (error) {
      console.error('Error fetching pending invoices:', error);
      setPendingInvoices([]);
    }
  }, []);

  // ✅ OPTIMIZATION: Memoized submit handler with React Query cache invalidation
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // ✅ NEW: For supplier payments, use credit-aware payment system
    if (formData.transactionType === 'OUTFLOW' && formData.supplierId && !allowOverpayment) {
      console.log('🎯 Using credit-aware payment system for supplier payment');
      setShowCreditAwareModal(true);
      return; // Let the credit-aware modal handle the payment
    }
    
    // Phase 1: Overpayment Detection for Supplier Payments (OUTFLOW)
    if (formData.transactionType === 'OUTFLOW' && formData.supplierId && !allowOverpayment) {
      const paymentAmount = parseFloat(formData.amount);
      
      // Calculate total outstanding balance from selected invoices
      let totalOutstandingBalance = 0;
      if (selectedInvoices.length > 0) {
        const selectedInvoiceData = pendingInvoices.filter(invoice => 
          selectedInvoices.includes(invoice.id)
        );
        totalOutstandingBalance = selectedInvoiceData.reduce((sum, invoice) => 
          sum + parseFloat(invoice.balanceAmount.toString()), 0
        );
      } else if (location.state?.fromAccountsPayable) {
        // Single invoice from AP page
        totalOutstandingBalance = parseFloat(location.state.prefilledData?.amount || '0');
      }
      
      // Check for overpayment
      if (paymentAmount > totalOutstandingBalance && totalOutstandingBalance > 0) {
        const overpaymentAmount = paymentAmount - totalOutstandingBalance;
        const supplierName = Array.isArray(suppliers) ? 
          (suppliers.find(s => s.id === parseInt(formData.supplierId))?.name || 'Supplier') : 'Supplier';
        
        setOverpaymentData({
          paymentAmount,
          outstandingBalance: totalOutstandingBalance,
          overpaymentAmount,
          entityName: supplierName,
          entityType: 'SUPPLIER',
          message: `Payment of ₹${paymentAmount.toFixed(2)} exceeds outstanding balance of ₹${totalOutstandingBalance.toFixed(2)}. Overpayment of ₹${overpaymentAmount.toFixed(2)} will be created as credit balance.`
        });
        setShowOverpaymentAlert(true);
        return; // Stop submission until user confirms
      }
    }
    
    // ✅ CRITICAL VALIDATION: Check bank account balance for OUTFLOW transactions
    if (formData.transactionType === 'OUTFLOW') {
      const selectedBankAccount = Array.isArray(bankAccounts) ? 
        bankAccounts.find(account => account.id === parseInt(formData.bankAccountId)) : null;
      const outflowAmount = parseFloat(formData.amount);
      
      if (selectedBankAccount && selectedBankAccount.balance < outflowAmount) {
        toast.error(
          `Insufficient balance in bank account "${selectedBankAccount.bankName} - ${selectedBankAccount.accountNumber}". ` +
          `Available: ${selectedBankAccount.balance.toFixed(2)}, Required: ${outflowAmount.toFixed(2)}. ` +
          `Cannot perform transaction that would result in negative balance.`
        );
        return;
      }
    }
    
    // Validation for OUTFLOW with supplier (skip if coming from Accounts Payable with pre-selected invoice)
    if (formData.transactionType === 'OUTFLOW' && formData.supplierId && selectedInvoices.length === 0 && !location.state?.fromAccountsPayable) {
      toast.error(t('pleaseSelectAtLeastOneInvoice'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const submitData: any = {
        ...formData,
        bankAccountId: formData.bankAccountId ? parseInt(formData.bankAccountId) : undefined,
        supplierId: formData.supplierId ? parseInt(formData.supplierId) : undefined,
        amount: parseFloat(formData.amount),
      };
      
      // Handle invoice IDs - either from selected invoices or from Accounts Payable
      if (selectedInvoices.length > 0) {
        submitData.invoiceIds = JSON.stringify(selectedInvoices);
      } else if (location.state?.prefilledData?.accountsPayableId) {
        // When coming from Accounts Payable, use the AP ID as the invoice ID
        submitData.invoiceIds = JSON.stringify([location.state.prefilledData.accountsPayableId]);
      }
      
      console.log('🚀 Submitting bank register data:', {
        submitData,
        allowOverpayment,
        selectedInvoices,
        formData: {
          supplierId: formData.supplierId,
          amount: formData.amount,
          transactionType: formData.transactionType
        }
      });
      
      await axios.post('/bank-register', submitData);
      
      // ✅ OPTIMIZATION: Use React Query cache invalidation and refresh pagination
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankTransactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      refresh(); // Refresh paginated data
      
      resetForm();
      
      if (location.state?.fromAccountsPayable) {
        toast.success('Payment completed successfully! The Accounts Payable status has been updated.');
        // Navigate back to Accounts Payable to see the updated status
        setTimeout(() => {
          navigate('/transactions/accounts-payable');
        }, 1000);
      } else {
        toast.success('Transaction created successfully!');
      }
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, allowOverpayment, selectedInvoices, pendingInvoices, suppliers, bankAccounts, location.state, queryClient, navigate, t]);

  // Overpayment handling functions
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

    // Navigate to Transaction Deletion page with bank register details
    navigate('/administration/transaction-deletion', {
      state: {
        transactionType: 'BANK_REGISTER',
        transactionId: id,
        transactionDetails: {
          registrationNumber: transaction.registrationNumber,
          amount: transaction.amount,
          description: transaction.description,
          transactionType: transaction.transactionType,
          relatedDocumentType: transaction.relatedDocumentType,
          relatedDocumentNumber: transaction.relatedDocumentNumber,
          clientName: transaction.clientName,
          bankAccountName: transaction.bankAccountName,
          bankAccountNumber: transaction.bankAccountNumber
        }
      }
    });
  }, [transactions, navigate]);

  const resetForm = useCallback(() => {
    setFormData({
      registrationDate: new Date().toISOString().split('T')[0],
      transactionType: 'INFLOW',
      amount: '',
      paymentMethod: 'CHEQUE',
      relatedDocumentType: '',
      relatedDocumentNumber: '',
      clientRnc: '',
      clientName: '',
      ncf: '',
      description: '',
      bankAccountId: '',
      supplierId: '',
      referenceNumber: '',
    });
    setSelectedInvoices([]);
    setPendingInvoices([]);
    setShowModal(false);
    setShowCreditAwareModal(false);
    
    // Clear the location state to prevent auto-opening again
    if (location.state?.fromAccountsPayable) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // ✅ Credit-aware payment success handler
  const handleCreditAwarePaymentSuccess = useCallback(() => {
    // ✅ OPTIMIZATION: Use React Query cache invalidation and refresh pagination
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankTransactions });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts });
    queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
    refresh(); // Refresh paginated data
    
    resetForm();
    
    if (location.state?.fromAccountsPayable) {
      toast.success('Smart payment completed successfully! Credit balances were automatically applied.');
      setTimeout(() => {
        navigate('/transactions/accounts-payable');
      }, 1000);
    } else {
      toast.success('Smart payment completed successfully!');
    }
  }, [queryClient, resetForm, location.state, navigate, refresh]);

  const toggleInvoiceSelection = useCallback((invoiceId: number) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  }, []);

  const calculateSelectedInvoicesTotal = useCallback(() => {
    if (!Array.isArray(pendingInvoices)) return 0;
    return pendingInvoices
      .filter(inv => selectedInvoices.includes(inv.id))
      .reduce((sum, inv) => sum + parseFloat(inv.balanceAmount?.toString() || '0'), 0);
  }, [pendingInvoices, selectedInvoices]);

  // ✅ REMOVED: No longer need manual filtering - backend handles it via pagination
  // const filteredTransactions = useMemo(() => { ... });

  // ✅ OPTIMIZATION: Memoized totals for better performance
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

  // ✅ OPTIMIZATION: Loading state with better UX
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading bank transactions...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FaUniversity className="text-blue-600" />
          {t('bankRegister')}
        </h1>
        <p className="text-gray-600 mt-2">{t('bankAccountTransactions')}</p>
      </div>

      {/* Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">{t('currentBankBalance')}</p>
              <p className="text-3xl font-bold mt-2">{formatNumber(bankBalance)}</p>
            </div>
            <FaUniversity className="text-5xl text-blue-300 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">{t('totalInflow')}</p>
              <p className="text-3xl font-bold mt-2">{formatNumber(totalInflow)}</p>
            </div>
            <FaArrowDown className="text-5xl text-green-300 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">{t('totalOutflow')}</p>
              <p className="text-3xl font-bold mt-2">{formatNumber(totalOutflow)}</p>
            </div>
            <FaArrowUp className="text-5xl text-red-300 opacity-50" />
          </div>
        </motion.div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* ✅ NEW: Use SearchBar component */}
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t('searchTransactions')}
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">{t('allTransactions')}</option>
          <option value="INFLOW">{t('inflowMoneyIn')}</option>
          <option value="OUTFLOW">{t('outflowMoneyOut')}</option>
        </select>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-lg"
        >
          <FaPlus />
          {t('newTransaction')}
        </motion.button>
      </div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('registrationHash')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('date')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('source')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('docNumber')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('type')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('method')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('clientName')}/{t('supplier')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('bankAccount')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">ACCOUNT TYPE</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('originalType')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('chequeTransferNumber')}</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">{t('amount')}</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">{t('balance')}</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-6 py-8 text-center text-gray-500">
                    {t('noTransactionsFound')}
                  </td>
                </tr>
              ) : (
                transactions.map((transaction, index) => {
                  const isDeleted = transaction.deletion_status === 'EXECUTED';
                  const isReversal = transaction.is_reversal === true;
                  
                  return (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      isDeleted ? 'bg-red-50 opacity-75' : 
                      isReversal ? 'bg-orange-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {isDeleted && <span className="text-red-500">🗑️</span>}
                        {isReversal && <span className="text-orange-500">↩️</span>}
                        <span className={isDeleted ? 'line-through text-gray-500' : ''}>
                          {transaction.registrationNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{new Date(transaction.registrationDate).toLocaleDateString()}</td>
                    
                    {/* ⭐ NEW: Source Column */}
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.relatedDocumentType === 'Purchase' ? 'bg-blue-100 text-blue-800' :
                        transaction.relatedDocumentType === 'Business Expense' ? 'bg-purple-100 text-purple-800' :
                        transaction.relatedDocumentType === 'AP' ? 'bg-red-100 text-red-800' :
                        transaction.relatedDocumentType === 'AR' ? 'bg-green-100 text-green-800' :
                        transaction.relatedDocumentType === 'Sale' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.relatedDocumentType || 'Manual'}
                      </span>
                    </td>
                    
                    {/* ⭐ NEW: Document Number Column */}
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">
                      {transaction.relatedDocumentNumber || '-'}
                    </td>
                    
                    <td className="px-6 py-4">
                      {getTransactionStatusBadge(transaction)}
                    </td>
                    <td className="px-6 py-4 text-sm">{transaction.paymentMethod}</td>
                    <td className="px-6 py-4 text-sm">{transaction.clientName || '-'}</td>
                    
                    {/* ⭐ Bank Account Column */}
                    <td className="px-6 py-4 text-sm">
                      {transaction.bankAccountName ? (
                        <span className="text-blue-600 font-medium">
                          {transaction.bankAccountName}
                        </span>
                      ) : '-'}
                    </td>
                    
                    {/* ⭐ Account Type Column */}
                    <td className="px-6 py-4 text-sm">
                      {transaction.accountType ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          transaction.accountType === 'CHECKING' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {transaction.accountType}
                        </span>
                      ) : '-'}
                    </td>
                    
                    {/* ⭐ Original Payment Type Column */}
                    <td className="px-6 py-4 text-sm">
                      {transaction.originalPaymentType ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          transaction.originalPaymentType === 'CREDIT' ? 'bg-orange-100 text-orange-800' :
                          transaction.originalPaymentType === 'CASH' ? 'bg-green-100 text-green-800' :
                          transaction.originalPaymentType === 'BANK_TRANSFER' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.originalPaymentType}
                        </span>
                      ) : '-'}
                    </td>
                    
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">
                      {transaction.chequeNumber || transaction.transferNumber || transaction.referenceNumber || '-'}
                    </td>
                    <td className={`px-6 py-4 text-sm font-semibold text-right ${
                      transaction.transactionType === 'INFLOW' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span className={isDeleted ? 'line-through text-gray-500' : ''}>
                        {transaction.transactionType === 'INFLOW' ? '+' : '-'}{formatNumber(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-right">
                      <span className={isDeleted ? 'line-through text-gray-500' : ''}>
                        {formatNumber(transaction.balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
                        title={t('delete')}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ✅ Pagination - Always visible, sticky at bottom like Purchases */}
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

      {/* New Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FaUniversity className="text-blue-600" />
              {t('newBankTransaction')}
              {location.state?.fromAccountsPayable && (
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                  {t('fromAccountsPayable')}
                </span>
              )}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {location.state?.fromAccountsPayable && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">💳</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-900 mb-1">
                        {t('creditPurchasePayment')}
                      </p>
                      <p className="text-xs text-green-700 mb-2">
                        {t('thisTransactionWillPay')}
                        <strong> {t('pleaseKeepTransactionType')}</strong>
                      </p>
                      <div className="bg-white rounded p-2 text-xs">
                        <p className="text-gray-600">
                          <strong>{t('supplier')}:</strong> {location.state.prefilledData?.supplierName}
                        </p>
                        <p className="text-gray-600">
                          <strong>{t('amount')}:</strong> ${location.state.prefilledData?.amount}
                        </p>
                        <p className="text-gray-600">
                          <strong>AP ID:</strong> #{location.state.prefilledData?.accountsPayableId}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')} *</label>
                  <input
                    type="date"
                    required
                    value={formData.registrationDate}
                    onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('transactionType')} *</label>
                  <select
                    required
                    value={formData.transactionType}
                    onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as 'INFLOW' | 'OUTFLOW' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INFLOW">{t('inflowMoneyIn')}</option>
                    <option value="OUTFLOW">{t('outflowMoneyOut')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('bankAccount')} *</label>
                  <select
                    required
                    value={formData.bankAccountId}
                    onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('selectBankAccount')}</option>
                    {Array.isArray(bankAccounts) && bankAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.bankName} - {account.accountNumber} (Balance: {formatNumber(account.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('paymentMethod')} *</label>
                  <select
                    required
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CHEQUE">{t('cheque')}</option>
                    <option value="BANK_TRANSFER">{t('bankTransfer')}</option>
                    <option value="DEPOSIT">{t('deposit')}</option>
                    <option value="CASH">{t('cash')}</option>
                  </select>
                </div>

                {formData.transactionType === 'OUTFLOW' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('supplier')}</label>
                    <select
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('selectSupplier')}</option>
                      {Array.isArray(suppliers) && suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount')} *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                  {/* ✅ Real-time balance warning for OUTFLOW */}
                  {formData.transactionType === 'OUTFLOW' && formData.bankAccountId && formData.amount && (
                    (() => {
                      const selectedBankAccount = Array.isArray(bankAccounts) ? 
                        bankAccounts.find(account => account.id === parseInt(formData.bankAccountId)) : null;
                      const enteredAmount = parseFloat(formData.amount);
                      
                      if (selectedBankAccount && enteredAmount > selectedBankAccount.balance) {
                        return (
                          <p className="text-xs text-red-600 mt-1 font-medium">
                            ⚠️ Insufficient balance! Available: {formatNumber(selectedBankAccount.balance)}, Required: {formatNumber(enteredAmount)}
                          </p>
                        );
                      } else if (selectedBankAccount) {
                        return (
                          <p className="text-xs text-green-600 mt-1">
                            ✅ Available balance: {formatNumber(selectedBankAccount.balance)}
                          </p>
                        );
                      }
                      return null;
                    })()
                  )}
                  
                  {/* Phase 1: Overpayment Warning for Supplier Payments */}
                  {formData.transactionType === 'OUTFLOW' && formData.supplierId && formData.amount && (
                    (() => {
                      const paymentAmount = parseFloat(formData.amount);
                      let totalOutstandingBalance = 0;
                      
                      if (selectedInvoices.length > 0) {
                        const selectedInvoiceData = Array.isArray(pendingInvoices) ? 
                          pendingInvoices.filter(invoice => selectedInvoices.includes(invoice.id)) : [];
                        totalOutstandingBalance = selectedInvoiceData.reduce((sum, invoice) => 
                          sum + Number(invoice.balanceAmount?.toString() || '0'), 0
                        );
                      } else if (location.state?.fromAccountsPayable) {
                        totalOutstandingBalance = Number(location.state.prefilledData?.amount || '0');
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
                      return null;
                    })()
                  )}
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('clientName')}</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={t('enterClientName')}
                  />
                </div> */}

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('clientRnc')}</label>
                  <input
                    type="text"
                    value={formData.clientRnc}
                    onChange={(e) => setFormData({ ...formData, clientRnc: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={t('enterClientRnc')}
                  />
                </div> */}

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('referenceNumber')}</label>
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={t('enterReferenceNumber')}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')} *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder={t('describeTransaction')}
                  />
                </div> */}
              </div>

              {/* Pending Invoices Selection */}
              {formData.transactionType === 'OUTFLOW' && formData.supplierId && pendingInvoices.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">{t('selectInvoicesToPay')}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    💡 {t('selectSpecificInvoices')}
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {Array.isArray(pendingInvoices) && pendingInvoices.map(invoice => (
                      <label key={invoice.id} className="flex items-start gap-3 p-3 bg-white rounded border hover:bg-blue-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={() => toggleInvoiceSelection(invoice.id)}
                          className="w-4 h-4 mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="font-medium text-blue-700">{invoice.registrationNumber}</span>
                              {invoice.invoiceNumber && invoice.invoiceNumber !== invoice.registrationNumber && (
                                <span className="ml-2 text-sm text-gray-600">({invoice.invoiceNumber})</span>
                              )}
                              {invoice.type && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                  {invoice.type}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-blue-600">{formatNumber(invoice.balanceAmount)}</span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <div className="flex flex-wrap gap-4">
                              <span>📅 {new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                              {invoice.ncf && <span>📄 NCF: {invoice.ncf}</span>}
                              {invoice.supplierRnc && <span>🏢 RNC: {invoice.supplierRnc}</span>}
                            </div>
                            <div className="mt-1 text-gray-700">
                              {invoice.description}
                            </div>
                            {invoice.paymentType && (
                              <div className="mt-1">
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                  {t('paymentColon')} {invoice.paymentType}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedInvoices.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-100 rounded">
                      <div className="flex justify-between font-semibold">
                        <span>{t('selectedInvoicesTotal')} ({selectedInvoices.length} {selectedInvoices.length !== 1 ? t('invoicesLowercase') : t('invoice')}):</span>
                        <span className="text-blue-700">{formatNumber(calculateSelectedInvoicesTotal())}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formData.transactionType === 'OUTFLOW' && formData.supplierId && pendingInvoices.length === 0 && !location.state?.prefilledData?.accountsPayableId && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">{t('noPendingInvoicesForSupplier')}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {formData.transactionType === 'OUTFLOW' && formData.supplierId ? (
                    <>
                      <FaCreditCard />
                      {isSubmitting ? t('creating') : 'Smart Payment'}
                    </>
                  ) : (
                    <>
                      {isSubmitting ? t('creating') : t('createTransaction')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

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

      {/* ✅ Credit-Aware Payment Modal */}
      <CreditAwarePaymentModal
        isOpen={showCreditAwareModal}
        onClose={() => setShowCreditAwareModal(false)}
        onSuccess={handleCreditAwarePaymentSuccess}
        supplierId={parseInt(formData.supplierId) || 0}
        supplierName={Array.isArray(suppliers) ? 
          (suppliers.find(s => s.id === parseInt(formData.supplierId))?.name || '') : ''}
        invoiceIds={selectedInvoices.length > 0 ? selectedInvoices : (location.state?.prefilledData?.accountsPayableId ? [location.state.prefilledData.accountsPayableId] : [])}
        requestedAmount={parseFloat(formData.amount) || 0}
        paymentMethod={formData.paymentMethod}
        bankAccountId={parseInt(formData.bankAccountId) || 0}
        registrationDate={formData.registrationDate}
        description={formData.description}
      />
    </div>
  );
};

export default BankRegister;
