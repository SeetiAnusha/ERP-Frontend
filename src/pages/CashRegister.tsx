import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash, FaWallet, FaArrowUp, FaArrowDown, FaSearch } from 'react-icons/fa';
import axios from '../api/axios';
import { CashTransaction } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber } from '../utils/formatNumber';

const CashRegister = () => {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [cashBalance, setCashBalance] = useState(0);

  const [formData, setFormData] = useState({
    registrationDate: new Date().toISOString().split('T')[0],
    transactionType: 'INFLOW',
    amount: '',
    paymentMethod: 'Cash',
    relatedDocumentType: '',
    relatedDocumentNumber: '',
    clientRnc: '',
    clientName: '',
    description: '',
  });

  const [depositData, setDepositData] = useState({
    date: new Date().toISOString().split('T')[0],
    cashRegisterName: 'Main Cash Register',
    bankAccountName: '',
    bankName: '',
    amount: '',
    description: '',
  });

  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]); // Single date for End of Day

  useEffect(() => {
    fetchTransactions();
    fetchBalance();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/cash-register');
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await axios.get('/cash-register/balance');
      setCashBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/cash-register', formData);
      fetchTransactions();
      fetchBalance();
      resetForm();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Error saving transaction');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`/cash-register/${id}`);
        fetchTransactions();
        fetchBalance();
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
      paymentMethod: 'Cash',
      relatedDocumentType: '',
      relatedDocumentNumber: '',
      clientRnc: '',
      clientName: '',
      description: '',
    });
    setShowModal(false);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create OUTFLOW transaction for cash register (money leaving)
      await axios.post('/cash-register', {
        registrationDate: depositData.date,
        transactionType: 'OUTFLOW',
        amount: depositData.amount,
        paymentMethod: 'Bank Deposit',
        relatedDocumentType: 'Bank Deposit',
        relatedDocumentNumber: `Deposit to ${depositData.bankAccountName}`,
        clientRnc: '',
        clientName: depositData.bankName,
        description: `Bank deposit: ${depositData.description} - ${depositData.bankAccountName} (${depositData.bankName})`,
      });
      
      alert('Bank deposit recorded successfully! Cash register balance decreased.');
      fetchTransactions();
      fetchBalance();
      resetDepositForm();
    } catch (error) {
      console.error('Error recording deposit:', error);
      alert('Error recording deposit');
    }
  };

  const resetDepositForm = () => {
    setDepositData({
      date: new Date().toISOString().split('T')[0],
      cashRegisterName: 'Main Cash Register',
      bankAccountName: '',
      bankName: '',
      amount: '',
      description: '',
    });
    setShowDepositModal(false);
  };

  const generateReport = () => {
    const filtered = transactions.filter(t => {
      // Parse dates without time to avoid timezone issues
      const tDate = new Date(t.registrationDate.split('T')[0]);
      const selectedDate = new Date(reportDate);
      
      // Set all times to midnight for accurate date-only comparison
      tDate.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      // Only match transactions from the selected date
      return tDate.getTime() === selectedDate.getTime();
    });

    const report = {
      // ALL INFLOWS (Money coming into cash register)
      cash: filtered.filter(t => t.transactionType === 'INFLOW' && t.paymentMethod === 'Cash')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
      deposit: filtered.filter(t => t.transactionType === 'INFLOW' && t.paymentMethod === 'Deposit')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
      bankTransferIn: filtered.filter(t => t.transactionType === 'INFLOW' && t.paymentMethod === 'Bank Transfer')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
      
      // ALL OUTFLOWS (Money going out of cash register)
      cashOut: filtered.filter(t => t.transactionType === 'OUTFLOW' && t.paymentMethod === 'Cash')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
      depositOut: filtered.filter(t => t.transactionType === 'OUTFLOW' && t.paymentMethod === 'Deposit')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
      bankTransferOut: filtered.filter(t => t.transactionType === 'OUTFLOW' && t.paymentMethod === 'Bank Transfer')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
      bankDeposits: filtered.filter(t => t.transactionType === 'OUTFLOW' && t.paymentMethod === 'Bank Deposit')
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">{t('currentBalance')}</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatNumber(cashBalance)}
                </p>
              </div>
              <FaWallet className="text-blue-400 text-3xl" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">{t('totalInflow')}</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatNumber(totalInflow)}
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
              </div>
              <FaArrowDown className="text-red-400 text-3xl" />
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
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
                  {t('partyEntity')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                  {t('description')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                  {t('method')}
                </th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-800 uppercase tracking-wider">
                  {t('amount')}
                </th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-800 uppercase tracking-wider">
                  {t('balance')}
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
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {transaction.clientName || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                    <span className={transaction.transactionType === 'INFLOW' ? 'text-green-600' : 'text-red-600'}>
                      {transaction.transactionType === 'INFLOW' ? '+' : '-'}
                      {formatNumber(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {formatNumber(transaction.balance)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-6">{t('newCashTransaction')}</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>

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
                      <option value="Cash">{t('cash')}</option>
                      <option value="Credit Card">{t('creditCard')}</option>
                      <option value="Debit Card">{t('debitCard')}</option>
                      <option value="Bank Transfer">{t('bankTransfer')}</option>
                      <option value="Check">{t('check')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('relatedDocType')}
                    </label>
                    <select
                      value={formData.relatedDocumentType}
                      onChange={(e) => setFormData({ ...formData, relatedDocumentType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('none')}</option>
                      <option value="Sale">{t('sale')}</option>
                      <option value="Purchase">{t('purchase')}</option>
                      <option value="Payment">{t('payment')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('documentNumber')}
                    </label>
                    <input
                      type="text"
                      value={formData.relatedDocumentNumber}
                      onChange={(e) => setFormData({ ...formData, relatedDocumentNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., SALE-00001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('clientRncCedula')}
                    </label>
                    <input
                      type="text"
                      value={formData.clientRnc}
                      onChange={(e) => setFormData({ ...formData, clientRnc: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('clientName')}
                    </label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
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
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    {t('createTransaction')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bank Deposit Modal */}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('cashRegisterName')}</label>
                    <input
                      type="text"
                      value={depositData.cashRegisterName}
                      onChange={(e) => setDepositData({...depositData, cashRegisterName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder={t('mainCashRegister')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('bankAccountName')} *</label>
                    <input
                      type="text"
                      value={depositData.bankAccountName}
                      onChange={(e) => setDepositData({...depositData, bankAccountName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder={t('businessCheckingAccount')}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('bankName')} *</label>
                    <input
                      type="text"
                      value={depositData.bankName}
                      onChange={(e) => setDepositData({...depositData, bankName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Bank of America"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  📅 {t('date')} ({t('endOfDayReport')})
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Select a single day to view that day's cash activity</p>
              </div>

              {(() => {
                const report = generateReport();
                const totalIn = report.cash + report.deposit + report.bankTransferIn;
                const totalOut = report.cashOut + report.depositOut + report.bankTransferOut + report.bankDeposits;
                const netCash = totalIn - totalOut;
                
                // Count filtered transactions for debugging
                const filtered = transactions.filter(t => {
                  const tDate = new Date(t.registrationDate.split('T')[0]);
                  const selectedDate = new Date(reportDate);
                  tDate.setHours(0, 0, 0, 0);
                  selectedDate.setHours(0, 0, 0, 0);
                  return tDate.getTime() === selectedDate.getTime();
                });
                
                return (
                  <div className="space-y-6">
                    {/* Transaction Count Info */}
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                      <p className="text-sm text-blue-800">
                        📊 Showing {filtered.length} transaction(s) for {new Date(reportDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>

                    {/* Cash Register Summary */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-300">
                      <h4 className="text-xl font-bold mb-6 text-blue-900">💵 {t('cashRegister')} {t('collectionSummary')}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* INFLOWS (Money Coming In) */}
                        <div className="space-y-3">
                          <h5 className="font-bold text-green-700 text-lg mb-3">➕ {t('totalIn')}</h5>
                          
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">💵 {t('cashIn')}</span>
                              <span className="font-bold text-green-600">${formatNumber(report.cash)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">📥 {t('depositIn')}</span>
                              <span className="font-bold text-green-600">${formatNumber(report.deposit)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">🏦 {t('bankTransferIn')}</span>
                              <span className="font-bold text-green-600">${formatNumber(report.bankTransferIn)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-green-100 rounded-lg p-3 border-2 border-green-400">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-green-800">{t('totalIn')}:</span>
                              <span className="font-bold text-green-800 text-xl">
                                ${formatNumber(report.cash + report.deposit + report.bankTransferIn)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* OUTFLOWS (Money Going Out) */}
                        <div className="space-y-3">
                          <h5 className="font-bold text-red-700 text-lg mb-3">➖ {t('totalOut')}</h5>
                          
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">💵 {t('cashOut')}</span>
                              <span className="font-bold text-red-600">${formatNumber(report.cashOut)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">📤 {t('depositOut')}</span>
                              <span className="font-bold text-red-600">${formatNumber(report.depositOut)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">🏦 {t('bankTransferOut')}</span>
                              <span className="font-bold text-red-600">${formatNumber(report.bankTransferOut)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">🏦 {t('bankDeposits')}</span>
                              <span className="font-bold text-red-600">${formatNumber(report.bankDeposits)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-red-100 rounded-lg p-3 border-2 border-red-400">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-red-800">{t('totalOut')}:</span>
                              <span className="font-bold text-red-800 text-xl">
                                ${formatNumber(report.cashOut + report.depositOut + report.bankTransferOut + report.bankDeposits)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t-2 border-blue-300 my-6"></div>

                      {/* Net Position */}
                      <div className={`rounded-lg p-5 shadow-lg border-4 ${netCash >= 0 ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-lg font-bold text-gray-800">{t('expectedCashInRegister')}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              (Total In - Total Out)
                            </p>
                          </div>
                          <span className={`text-4xl font-bold ${netCash >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            ${formatNumber(netCash)}
                          </span>
                        </div>
                      </div>

                      {/* Helpful Note */}
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mt-4">
                        <p className="text-sm text-yellow-800">
                          <strong>💡 Note:</strong> This report includes Cash, Deposit, and Bank Transfer transactions. 
                          Credit card sales and credit purchases are tracked in Accounts Receivable/Payable.
                        </p>
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
    </motion.div>
  );
};

export default CashRegister;

