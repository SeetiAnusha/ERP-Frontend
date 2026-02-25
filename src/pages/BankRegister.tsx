import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash, FaUniversity, FaArrowUp, FaArrowDown, FaSearch } from 'react-icons/fa';
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
}

const BankRegister = () => {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [bankBalance, setBankBalance] = useState(0);

  const [formData, setFormData] = useState({
    registrationDate: new Date().toISOString().split('T')[0],
    transactionType: 'INFLOW',
    amount: '',
    paymentMethod: 'Bank Transfer',
    relatedDocumentType: '',
    relatedDocumentNumber: '',
    clientRnc: '',
    clientName: '',
    ncf: '',
    description: '',
    bankAccountName: '',
    bankAccountNumber: '',
    referenceNumber: '',
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/bank-register', formData);
      fetchTransactions();
      resetForm();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Error saving transaction');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`/bank-register/${id}`);
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
      paymentMethod: 'Bank Transfer',
      relatedDocumentType: '',
      relatedDocumentNumber: '',
      clientRnc: '',
      clientName: '',
      ncf: '',
      description: '',
      bankAccountName: '',
      bankAccountNumber: '',
      referenceNumber: '',
    });
    setShowModal(false);
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('registrationHash')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('date')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('type')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('method')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('clientName')}/{t('supplier')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('clientRnc')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('ncf')}</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('referenceNumber')}</th>
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
                    <td className="px-6 py-4 text-sm">{transaction.referenceNumber || '-'}</td>
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
                        title="Delete"
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
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('paymentMethod')} *</label>
                  <select
                    required
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Bank Transfer">{t('bankTransfer')}</option>
                    <option value="Deposit">{t('deposit')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('bankAccountName')}</label>
                  <input
                    type="text"
                    value={formData.bankAccountName}
                    onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Business Checking"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('accountNumber')}</label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="****1234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('referenceNumber')}</label>
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="TXN123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('relatedDocType')}</label>
                  <select
                    value={formData.relatedDocumentType}
                    onChange={(e) => setFormData({ ...formData, relatedDocumentType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('selectOption')}</option>
                    <option value="Sale">{t('sales')}</option>
                    <option value="Purchase">{t('purchases')}</option>
                    <option value="Payment">{t('payments')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('documentNumber')}</label>
                  <input
                    type="text"
                    value={formData.relatedDocumentNumber}
                    onChange={(e) => setFormData({ ...formData, relatedDocumentNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="RV0001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('clientRncCedula')}</label>
                  <input
                    type="text"
                    value={formData.clientRnc}
                    onChange={(e) => setFormData({ ...formData, clientRnc: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="RNC/Cedula"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('ncf')}</label>
                  <input
                    type="text"
                    value={formData.ncf}
                    onChange={(e) => setFormData({ ...formData, ncf: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="B0100000001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('clientName')}/{t('supplier')}</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Supplier/Client Name"
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
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('createTransaction')}
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
