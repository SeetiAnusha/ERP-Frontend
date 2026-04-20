import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Building2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber } from '../utils/formatNumber';
import { QUERY_KEYS } from '../lib/queryKeys';
import { useTableData } from '../hooks/useTableData';
import { Pagination } from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { toast } from 'sonner';
import { extractErrorMessage } from '../utils/errorHandler';

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
  const { confirm, dialogProps } = useConfirm();
  
  // ✅ NEW: Use useTableData for pagination
  const {
    data: accounts,
    pagination,
    loading,
    search,
    updateSearch,
    goToPage,
    changeLimit,
    refresh
  } = useTableData<BankAccount>({
    endpoint: '/api/bank-accounts',
    initialLimit: 50,
    initialSortBy: 'createdAt',
    initialSortOrder: 'DESC'
  });
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

  // ✅ MEMOIZED: Close modal - DEFINED FIRST
  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingAccount(null);
    setIsSubmitting(false);
  }, []);

  // ✅ MEMOIZED: Open modal - DEFINED SECOND
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

  // ✅ MEMOIZED: Handle form submission - NOW closeModal is available
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    // Validate account number is exactly 4 digits
    if (!/^\d{4}$/.test(formData.accountNumber)) {
      toast.error('Account number must be exactly 4 digits (last 4 digits of your account)');
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (editingAccount) {
        await api.put(`/bank-accounts/${editingAccount.id}`, formData);
        toast.success('Bank account updated successfully');
      } else {
        await api.post('/bank-accounts', formData);
        toast.success('Bank account created successfully');
      }
      
      // ✅ REACT QUERY: Cache invalidation for automatic UI updates
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts });
      refresh(); // Refresh pagination data
      
      closeModal();
    } catch (error: any) {
      console.error('Error saving bank account:', error);
      toast.error(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, editingAccount, formData, queryClient, refresh, closeModal]);

  // ✅ MEMOIZED: Handle delete - NO MORE window.confirm!
  const handleDelete = useCallback(async (id: number) => {
    const confirmed = await confirm({
      title: 'Delete Bank Account',
      message: 'Are you sure you want to delete this bank account? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (confirmed) {
      try {
        await api.delete(`/bank-accounts/${id}`);
        
        // ✅ REACT QUERY: Cache invalidation for automatic UI updates
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts });
        refresh(); // Refresh pagination data
        toast.success('Bank account deleted successfully');
      } catch (error: any) {
        console.error('Error deleting bank account:', error);
        toast.error(extractErrorMessage(error));
      }
    }
  }, [queryClient, confirm, refresh]);

  // ✅ OPTIMIZED: Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading bank accounts...</span>
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
        <SearchBar
          value={search}
          onChange={updateSearch}
          placeholder={t('search')}
        />
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
            {accounts.map((account) => (
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

      {/* ✅ NEW: Pagination Component */}
      <div className="mt-6">
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
        />
      </div>

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
                    maxLength={4}
                    pattern="[0-9]{4}"
                    value={formData.accountNumber}
                    onChange={(e) => {
                      // Only allow digits and max 4 characters
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setFormData({ ...formData, accountNumber: value });
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter last 4 digits"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ⚠️ For security, enter only the last 4 digits of your account number
                  </p>
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

      {/* ✅ Confirm Dialog - Replaces window.confirm */}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default BankAccounts;
