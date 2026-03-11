import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash, FaUniversity, FaArrowUp, FaArrowDown, FaSearch } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { formatNumber } from '../utils/formatNumber';
import { useLanguage } from '../contexts/LanguageContext';

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
  referenceNumber?: string;
  chequeNumber?: string;
  transferNumber?: string;
  supplierId?: number;
  supplierName?: string;
  invoiceIds?: string;
}

interface BankAccount {
  id: number;
  bankName: string;
  accountNumber: string;
  accountType: string;
  balance: number;
}

interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
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
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [bankBalance, setBankBalance] = useState(0);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    fetchTransactions();
    fetchBankAccounts();
    fetchSuppliers();
    
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

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/bank-register');
      setTransactions(response.data);
      // Calculate balance from last transaction
      if (response.data.length > 0) {
        setBankBalance(response.data[0].balance);
      }
    } catch (error) {
      console.error('Error fetching bank transactions:', error);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const response = await axios.get('/bank-accounts');
      setBankAccounts(response.data);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchPendingInvoices = async (supplierId: number) => {
    try {
      const response = await axios.get(`/bank-register/pending-invoices/${supplierId}`);
      setPendingInvoices(response.data);
    } catch (error) {
      console.error('Error fetching pending invoices:', error);
      setPendingInvoices([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // ✅ CRITICAL VALIDATION: Check bank account balance for OUTFLOW transactions
    if (formData.transactionType === 'OUTFLOW') {
      const selectedBankAccount = bankAccounts.find(account => account.id === parseInt(formData.bankAccountId));
      const outflowAmount = parseFloat(formData.amount);
      
      if (selectedBankAccount && selectedBankAccount.balance < outflowAmount) {
        alert(
          `Insufficient balance in bank account "${selectedBankAccount.bankName} - ${selectedBankAccount.accountNumber}". ` +
          `Available: ${selectedBankAccount.balance.toFixed(2)}, Required: ${outflowAmount.toFixed(2)}. ` +
          `Cannot perform transaction that would result in negative balance.`
        );
        return;
      }
    }
    
    // Validation for OUTFLOW with supplier (skip if coming from Accounts Payable with pre-selected invoice)
    if (formData.transactionType === 'OUTFLOW' && formData.supplierId && selectedInvoices.length === 0 && !location.state?.fromAccountsPayable) {
      alert(t('pleaseSelectAtLeastOneInvoice'));
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
      
      await axios.post('/bank-register', submitData);
      fetchTransactions();
      fetchBankAccounts(); // Refresh bank account balances
      resetForm();
      
      if (location.state?.fromAccountsPayable) {
        alert('Payment completed successfully! The Accounts Payable status has been updated.');
        // Navigate back to Accounts Payable to see the updated status
        setTimeout(() => {
          navigate('/accounts-payable');
        }, 1000);
      } else {
        alert('Transaction created successfully!');
      }
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      alert(error.response?.data?.message || t('errorSavingTransaction'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('deleteTransactionConfirm'))) {
      try {
        await axios.delete(`/bank-register/${id}`);
        fetchTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert(t('errorDeletingTransaction'));
      }
    }
  };

  const resetForm = () => {
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
    
    // Clear the location state to prevent auto-opening again
    if (location.state?.fromAccountsPayable) {
      window.history.replaceState({}, document.title);
    }
  };

  const toggleInvoiceSelection = (invoiceId: number) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const calculateSelectedInvoicesTotal = () => {
    return pendingInvoices
      .filter(inv => selectedInvoices.includes(inv.id))
      .reduce((sum, inv) => sum + parseFloat(inv.balanceAmount.toString()), 0);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
        <div className="flex-1 relative">
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
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('type')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('method')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('clientName')}/{t('supplier')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('clientRnc')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('ncf')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('chequeTransferNumber')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('description')}</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">{t('amount')}</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">{t('balance')}</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                    {t('noTransactionsFound')}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm font-medium">{transaction.registrationNumber}</td>
                    <td className="px-6 py-4 text-sm">{new Date(transaction.registrationDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        transaction.transactionType === 'INFLOW' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.transactionType === 'INFLOW' ? <FaArrowDown /> : <FaArrowUp />}
                        {transaction.transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{transaction.paymentMethod}</td>
                    <td className="px-6 py-4 text-sm">{transaction.clientName || '-'}</td>
                    <td className="px-6 py-4 text-sm">{transaction.clientRnc || '-'}</td>
                    <td className="px-6 py-4 text-sm">{transaction.ncf || '-'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">
                      {transaction.chequeNumber || transaction.transferNumber || transaction.referenceNumber || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm max-w-xs truncate" title={transaction.description}>
                      {transaction.description}
                    </td>
                    <td className={`px-6 py-4 text-sm font-semibold text-right ${
                      transaction.transactionType === 'INFLOW' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.transactionType === 'INFLOW' ? '+' : '-'}{formatNumber(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-right">{formatNumber(transaction.balance)}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

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
                    {bankAccounts.map(account => (
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
                      {suppliers.map(supplier => (
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
                      const selectedBankAccount = bankAccounts.find(account => account.id === parseInt(formData.bankAccountId));
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
                </div>
              </div>

              {/* Pending Invoices Selection */}
              {formData.transactionType === 'OUTFLOW' && formData.supplierId && pendingInvoices.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">{t('selectInvoicesToPay')}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    💡 {t('selectSpecificInvoices')}
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {pendingInvoices.map(invoice => (
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

              {formData.transactionType === 'OUTFLOW' && formData.supplierId && pendingInvoices.length === 0 && (
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('creating') : t('createTransaction')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BankRegister;
