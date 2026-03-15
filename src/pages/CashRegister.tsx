import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash, FaWallet, FaArrowUp, FaArrowDown, FaSearch } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { CashTransaction } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber } from '../utils/formatNumber';
import { cleanFormData } from '../utils/cleanFormData';  // Import utility
import OverpaymentAlertModal from '../components/OverpaymentAlertModal';
import CustomerCreditAwarePaymentModal from '../components/CustomerCreditAwarePaymentModal';

const CashRegister = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [isSubmitting, setIsSubmitting] = useState(false);  // Add loading state

  // Phase 3: New state
  const [cashRegisterMasters, setCashRegisterMasters] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [activeAgreements, setActiveAgreements] = useState<any[]>([]);
  const [pendingCreditSales, setPendingCreditSales] = useState<any[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  // New state for dynamic payment method dropdowns
  const [cards, setCards] = useState<any[]>([]);
  const [paymentNetworks, setPaymentNetworks] = useState<any[]>([]);

  // Overpayment detection state
  const [showOverpaymentAlert, setShowOverpaymentAlert] = useState(false);
  const [overpaymentData, setOverpaymentData] = useState<any>(null);
  const [allowOverpayment, setAllowOverpayment] = useState(false);

  // Customer credit-aware payment state
  const [showCustomerCreditAwareModal, setShowCustomerCreditAwareModal] = useState(false);

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
  });

  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTransactions();
    fetchCashRegisterMasters();
    fetchBankAccounts();
    fetchCustomers();
    fetchActiveAgreements();
    fetchCards();
    fetchPaymentNetworks();
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

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/cash-register');
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Phase 3: Fetch cash register masters
  const fetchCashRegisterMasters = async () => {
    try {
      const response = await axios.get('/cash-register-masters');
      console.log('Cash Register Masters Response:', response.data);
      const activeRegisters = response.data.filter((r: any) => r.status === 'ACTIVE');
      console.log('Active Cash Registers:', activeRegisters);
      setCashRegisterMasters(activeRegisters);
    } catch (error) {
      console.error('Error fetching cash registers:', error);
    }
  };

  // Phase 3: Fetch bank accounts
  const fetchBankAccounts = async () => {
    try {
      const response = await axios.get('/bank-accounts');
      const activeAccounts = response.data.filter((a: any) => a.status === 'ACTIVE');
      setBankAccounts(activeAccounts);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  // Phase 3: Fetch customers
  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/clients');
      const activeCustomers = response.data.filter((c: any) => c.status === 'ACTIVE');
      setCustomers(activeCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // Fetch active investment agreements
  const fetchActiveAgreements = async () => {
    try {
      const response = await axios.get('/investment-agreements/active');
      setActiveAgreements(response.data);
    } catch (error) {
      console.error('Error fetching active agreements:', error);
    }
  };
  // Fetch cards for debit card selection
  const fetchCards = async () => {
    try {
      const response = await axios.get('/cards');
      setCards(response.data);
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  };

  // Fetch payment networks for credit card selection
  const fetchPaymentNetworks = async () => {
    try {
      const response = await axios.get('/card-payment-networks');
      setPaymentNetworks(response.data);
    } catch (error) {
      console.error('Error fetching payment networks:', error);
    }
  };

  // Fetch pending Credit Sale and Credit Card Sale invoices for selected customer
  const fetchPendingCreditSales = async (customerId: string) => {
    if (!customerId) {
      setPendingCreditSales([]);
      return;
    }
    
    try {
      const response = await axios.get(`/cash-register/pending-credit-sales/${customerId}`);
      setPendingCreditSales(response.data);
    } catch (error) {
      console.error('Error fetching pending credit sales:', error);
      setPendingCreditSales([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ NEW: For customer AR collections, use customer credit-aware payment system
    if (formData.relatedDocumentType === 'AR_COLLECTION' && formData.customerId && !allowOverpayment) {
      console.log('🎯 Using customer credit-aware payment system for AR collection');
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
      formData.relatedDocumentType === 'CONTRIBUTION' || 
      formData.relatedDocumentType === 'LOAN' ||
      (formData.relatedDocumentType === 'AR_COLLECTION' && formData.paymentMethod === 'CASH');
    
    if (needsCashRegister && !formData.cashRegisterId) {
      alert(t('selectCashRegister') || 'Please select a cash register');
      return;
    }

    if (formData.transactionType === 'INFLOW') {
      // INFLOW validations - AR_COLLECTION (Credit Sales and Credit Card Sales), CONTRIBUTION, LOAN
      if (formData.relatedDocumentType === 'AR_COLLECTION') {
        if (!formData.customerId) {
          alert(t('selectCustomer') || 'Please select a customer');
          return;
        }
        // Skip invoice selection validation if coming from AR with pre-selected invoice
        if (selectedInvoices.length === 0 && !location.state?.fromAccountsReceivable) {
          alert(t('selectInvoices') || 'Please select at least one credit sale invoice');
          return;
        }
      }
      
      if (formData.relatedDocumentType === 'CONTRIBUTION' || formData.relatedDocumentType === 'LOAN') {
        if (!formData.investmentAgreementId) {
          alert('Please select an investment/loan agreement');
          return;
        }
      }

      // Payment method validations
      if (formData.paymentMethod === 'DEBIT_CARD' && !formData.cardId) {
        alert('Please select a debit card');
        return;
      }
      
      if (formData.paymentMethod === 'CREDIT_CARD' && !formData.cardPaymentNetworkId) {
        alert('Please select a credit card payment network');
        return;
      }
      
      if ((formData.paymentMethod === 'BANK_TRANSFER' || formData.paymentMethod === 'DEPOSIT') && !formData.bankAccountId) {
        alert('Please select a bank account');
        return;
      }
    } else if (formData.transactionType === 'OUTFLOW') {
      // OUTFLOW validations - only allow BANK_DEPOSIT or CORRECTION
      if (formData.paymentMethod !== 'BANK_DEPOSIT' && formData.paymentMethod !== 'CORRECTION') {
        alert('OUTFLOW only allows Bank Deposit or Correction');
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
      
      await axios.post('/cash-register', cleanedData);
      await fetchTransactions();
      await fetchCashRegisterMasters(); // Refresh cash register balances
      
      resetForm();
      
      if (location.state?.fromAccountsReceivable) {
        alert('Customer invoice collection completed successfully! The Accounts Receivable status has been updated.');
        // Navigate back to Accounts Receivable to see the updated status
        setTimeout(() => {
          navigate('/accounts-receivable');
        }, 1000);
      } else {
        alert(t('transactionCreated') || 'Transaction created successfully!');
      }
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      alert(error.response?.data?.error || 'Error saving transaction');
    } finally {
      setIsSubmitting(false);  // Re-enable button
    }
  };

  // Overpayment handling functions
  const handleOverpaymentConfirm = () => {
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
  };

  const handleOverpaymentAdjust = () => {
    if (overpaymentData) {
      setFormData(prev => ({
        ...prev,
        amount: overpaymentData.outstandingBalance.toString()
      }));
    }
    setShowOverpaymentAlert(false);
    setAllowOverpayment(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`/cash-register/${id}`);
        fetchTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Error deleting transaction');
      }
    }
  };

  const resetForm = () => {
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
  };

  // ✅ Customer credit-aware payment success handler
  const handleCustomerCreditAwarePaymentSuccess = () => {
    fetchTransactions();
    fetchCashRegisterMasters(); // Refresh cash register balances
    resetForm();
    
    if (location.state?.fromAccountsReceivable) {
      alert('Smart customer payment completed successfully! Credit balances were automatically applied.');
      setTimeout(() => {
        navigate('/accounts-receivable');
      }, 1000);
    } else {
      alert('Smart customer payment completed successfully!');
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!depositData.cashRegisterId) {
      alert(t('selectCashRegister') || 'Please select a cash register');
      return;
    }
    
    if (!depositData.bankAccountId) {
      alert(t('selectBankAccount') || 'Please select a bank account');
      return;
    }
    
    try {
      // Create OUTFLOW transaction for cash register (money leaving)
      await axios.post('/cash-register', {
        registrationDate: depositData.date,
        transactionType: 'OUTFLOW',
        amount: depositData.amount,
        paymentMethod: 'BANK_DEPOSIT',
        relatedDocumentType: '',
        relatedDocumentNumber: '',
        description: depositData.description || 'Bank deposit',
        cashRegisterId: depositData.cashRegisterId,
        bankAccountId: depositData.bankAccountId,
      });
      
      alert('Bank deposit recorded successfully! Cash register balance decreased and bank account increased.');
      fetchTransactions();
      fetchCashRegisterMasters(); // Refresh cash register balances
      resetDepositForm();
    } catch (error: any) {
      console.error('Error recording deposit:', error);
      alert(error.response?.data?.error || 'Error recording deposit');
    }
  };

  const resetDepositForm = () => {
    setDepositData({
      date: new Date().toISOString().split('T')[0],
      cashRegisterId: '',
      bankAccountId: '',
      amount: '',
      description: '',
    });
    setShowDepositModal(false);
  };

  // Handle customer selection for AR collection (Credit Sales and Credit Card Sales)
  const handleCustomerChange = (customerId: string) => {
    setFormData({ ...formData, customerId });
    setSelectedInvoices([]);
    fetchPendingCreditSales(customerId);
  };

  // Toggle invoice selection for Credit Sales
  const toggleInvoiceSelection = (invoiceId: number) => {
    if (selectedInvoices.includes(invoiceId)) {
      setSelectedInvoices(selectedInvoices.filter(id => id !== invoiceId));
    } else {
      setSelectedInvoices([...selectedInvoices, invoiceId]);
    }
  };

  const generateReport = () => {
    const filtered = transactions.filter(t => {
      const tDate = new Date(t.registrationDate.split('T')[0]);
      const selectedDate = new Date(reportDate);
      tDate.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      return tDate.getTime() === selectedDate.getTime();
    });

    const report = {
      cash: filtered.filter(t => t.transactionType === 'INFLOW' && t.paymentMethod === 'CASH')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
      creditCard: filtered.filter(t => t.transactionType === 'INFLOW' && t.paymentMethod === 'CREDIT_CARD')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
      debitCard: filtered.filter(t => t.transactionType === 'INFLOW' && t.paymentMethod === 'DEBIT_CARD')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
      bankTransferIn: filtered.filter(t => t.transactionType === 'INFLOW' && t.paymentMethod === 'BANK_TRANSFER')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
      cheque: filtered.filter(t => t.transactionType === 'INFLOW' && t.paymentMethod === 'BANK_CHEQUE')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
      bankDeposits: filtered.filter(t => t.transactionType === 'OUTFLOW' && t.paymentMethod === 'BANK_DEPOSIT')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
      corrections: filtered.filter(t => t.transactionType === 'OUTFLOW' && t.paymentMethod === 'CORRECTION')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
    };

    return report;
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'All' || transaction.transactionType === filterType;
    
    return matchesSearch && matchesType;
  });

  const totalInflow = transactions
    .filter(t => t.transactionType === 'INFLOW')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const totalOutflow = transactions
    .filter(t => t.transactionType === 'OUTFLOW')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

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
                  {transactions.filter(t => t.transactionType === 'INFLOW').length} transactions
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
                  {transactions.filter(t => t.transactionType === 'OUTFLOW').length} transactions
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
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchTransactions')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

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
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
                  {t('type')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                  {t('method')}
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
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.registrationNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.registrationDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.transactionType === 'INFLOW'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.transactionType === 'INFLOW' ? t('inflow') : t('outflow')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.paymentMethod}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                    <span className={transaction.transactionType === 'INFLOW' ? 'text-green-600' : 'text-red-600'}>
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
              ))}
            </tbody>
          </table>
        </div>
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
                  {/* Cash Register Selection - Conditional based on document type and payment method */}
                  {(() => {
                    const needsCashRegister = 
                      formData.relatedDocumentType === 'CONTRIBUTION' || 
                      formData.relatedDocumentType === 'LOAN' ||
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('paymentMethod')} *
                        </label>
                        <select
                          required
                          value={formData.paymentMethod}
                          onChange={(e) => {
                            const newPaymentMethod = e.target.value;
                            const needsCashRegister = 
                              formData.relatedDocumentType === 'CONTRIBUTION' || 
                              formData.relatedDocumentType === 'LOAN' ||
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
                          <option value="CREDIT_CARD">{t('creditCard')}</option>
                          <option value="DEBIT_CARD">{t('debitCard')}</option>
                          <option value="BANK_TRANSFER">{t('bankTransfer')}</option>
                          <option value="DEPOSIT">{t('deposit')}</option>
                          <option value="BANK_CHEQUE">{t('bankCheque')}</option>
                        </select>
                      </div>

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
                              newDocumentType === 'CONTRIBUTION' || 
                              newDocumentType === 'LOAN' ||
                              (newDocumentType === 'AR_COLLECTION' && formData.paymentMethod === 'CASH');
                            
                            setFormData({ 
                              ...formData, 
                              relatedDocumentType: newDocumentType,
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

                      {/* Debit Card Selection for DEBIT_CARD */}
                      {formData.paymentMethod === 'DEBIT_CARD' && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Debit Card *
                          </label>
                          <select
                            required
                            value={formData.cardId}
                            onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select debit card...</option>
                            {cards.filter(card => card.cardType === 'DEBIT').map(card => (
                              <option key={card.id} value={card.id}>
                                {card.cardName ? card.cardName : `${card.cardBrand || 'Debit Card'} ****${card.cardNumberLast4}`}
                                {card.BankAccount && ` - ${card.BankAccount.bankName} (Balance: ${Number(card.BankAccount.balance).toFixed(2)})`}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            💳 DEBIT: Payment will be processed through selected debit card
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

      {/* End of Day Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-6 text-purple-600">{t('endOfDayReport')}</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 {t('date')}
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-lg"
                />
              </div>

              {(() => {
                const report = generateReport();
                const totalIn = report.cash + report.creditCard + report.debitCard + report.bankTransferIn + report.cheque;
                const totalOut = report.bankDeposits + report.corrections;
                const netCash = totalIn - totalOut;
                
                const filtered = transactions.filter(t => {
                  const tDate = new Date(t.registrationDate.split('T')[0]);
                  const selectedDate = new Date(reportDate);
                  tDate.setHours(0, 0, 0, 0);
                  selectedDate.setHours(0, 0, 0, 0);
                  return tDate.getTime() === selectedDate.getTime();
                });
                
                return (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                      <p className="text-sm text-blue-800">
                        📊 Showing {filtered.length} transaction(s) for {new Date(reportDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-300">
                      <h4 className="text-xl font-bold mb-6 text-blue-900">💵 {t('cashRegister')} Summary</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h5 className="font-bold text-green-700 text-lg mb-3">➕ {t('totalIn')}</h5>
                          
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">💵 {t('cash')}</span>
                              <span className="font-bold text-green-600">${formatNumber(report.cash)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">💳 {t('creditCard')}</span>
                              <span className="font-bold text-green-600">${formatNumber(report.creditCard)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">💳 {t('debitCard')}</span>
                              <span className="font-bold text-green-600">${formatNumber(report.debitCard)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">🏦 {t('bankTransfer')}</span>
                              <span className="font-bold text-green-600">${formatNumber(report.bankTransferIn)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">📝 {t('cheque')}</span>
                              <span className="font-bold text-green-600">${formatNumber(report.cheque)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-green-100 rounded-lg p-3 border-2 border-green-400">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-green-800">{t('totalIn')}:</span>
                              <span className="font-bold text-green-800 text-xl">${formatNumber(totalIn)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h5 className="font-bold text-red-700 text-lg mb-3">➖ {t('totalOut')}</h5>
                          
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">🏦 {t('bankDeposits')}</span>
                              <span className="font-bold text-red-600">${formatNumber(report.bankDeposits)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">🔧 {t('corrections')}</span>
                              <span className="font-bold text-red-600">${formatNumber(report.corrections)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-red-100 rounded-lg p-3 border-2 border-red-400">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-red-800">{t('totalOut')}:</span>
                              <span className="font-bold text-red-800 text-xl">${formatNumber(totalOut)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t-2 border-blue-300 my-6"></div>

                      <div className={`rounded-lg p-5 shadow-lg border-4 ${netCash >= 0 ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-lg font-bold text-gray-800">{t('expectedCashInRegister')}</p>
                            <p className="text-xs text-gray-600 mt-1">(Total In - Total Out)</p>
                          </div>
                          <span className={`text-4xl font-bold ${netCash >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            ${formatNumber(netCash)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  {t('close')}
                </button>
              </div>
            </div>
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
        registrationDate={formData.registrationDate}
        description={formData.description}
      />
    </motion.div>
  );
};

export default CashRegister;
