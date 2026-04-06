import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Building2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber } from '../utils/formatNumber';
import { useBankAccounts } from '../hooks/queries/useSharedData';
import { QUERY_KEYS } from '../lib/queryKeys';

interface BankAccount {
  id: number;
  code: string;
  bankName: string;
  accountNumber: string;
  accountType: 'CHECKING' | 'SAVINGS';
  balance: number;
  status: 'ACTIVE' | 'INACTIVE';
}

const BankAccounts = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  // ✅ REACT QUERY: Use shared data hook instead of local state
  const { data: accounts = [], isLoading, isError } = useBankAccounts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountType: 'CHECKING' as 'CHECKING' | 'SAVINGS',
    balance: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  // ✅ MEMOIZED: Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      if (editingAccount) {
        await api.put(`/bank-accounts/${editingAccount.id}`, formData);
      } else {
        await api.post('/bank-accounts', formData);
      }
      
      // ✅ REACT QUERY: Cache invalidation for automatic UI updates
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts });
      
      closeModal();
    } catch (error) {
      console.error('Error saving bank account:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, editingAccount, formData, queryClient]);

  // ✅ MEMOIZED: Handle delete
  const handleDelete = useCallback(async (id: number) => {
    if (window.confirm('Are you sure you want to delete this bank account?')) {
      try {
        await api.delete(`/bank-accounts/${id}`);
        
        // ✅ REACT QUERY: Cache invalidation for automatic UI updates
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts });
      } catch (error) {
        console.error('Error deleting bank account:', error);
      }
    }
  }, [queryClient]);

  // ✅ MEMOIZED: Open modal
  const openModal = useCallback((account?: BankAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        balance: account.balance.toString(),
        status: account.status,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        bankName: '',
        accountNumber: '',
        accountType: 'CHECKING',
        balance: '0',
        status: 'ACTIVE',
      });
    }
    setShowModal(true);
  }, []);

  // ✅ MEMOIZED: Close modal
  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingAccount(null);
    setIsSubmitting(false);
  }, []);

  // ✅ MEMOIZED: Filtered accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) =>
      Object.values(account).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [accounts, searchTerm]);

  // ✅ OPTIMIZED: Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading bank accounts...</span>
      </div>
    );
  }

  // ✅ ERROR STATE
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">Error loading bank accounts</p>
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="text-blue-600" />
          {t('bankAccounts')}
        </h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal()}
          className="ml-4 bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          {t('newBankAccount')}
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('code').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('bankName').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('accountNumber').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('accountType').toUpperCase()}</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">{t('balance').toUpperCase()}</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">{t('status').toUpperCase()}</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">{t('actions').toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((account) => (
              <tr key={account.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{account.code}</td>
                <td className="px-6 py-4 text-sm">{account.bankName}</td>
                <td className="px-6 py-4 text-sm">{account.accountNumber}</td>
                <td className="px-6 py-4 text-sm">{account.accountType}</td>
                <td className="px-6 py-4 text-sm text-right font-semibold">{formatNumber(account.balance)}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    account.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {account.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => openModal(account)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingAccount ? t('editBankAccount') : t('newBankAccount')}
                </h2>
                <button onClick={closeModal}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('bankName')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('accountNumber')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('accountType')} *</label>
                  <select
                    required
                    value={formData.accountType}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value as 'CHECKING' | 'SAVINGS' })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CHECKING">{t('checking')}</option>
                    <option value="SAVINGS">{t('savings')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {editingAccount ? t('balance') : t('openingBalance')} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editingAccount 
                      ? 'Current balance in this account' 
                      : 'Enter the initial/opening balance for this account'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('status')} *</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">{t('active')}</option>
                    <option value="INACTIVE">{t('inactive')}</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {editingAccount ? 'Updating...' : 'Creating...'}
                      </div>
                    ) : (
                      editingAccount ? t('update') : t('create')
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BankAccounts;
