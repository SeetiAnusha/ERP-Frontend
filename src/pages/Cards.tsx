import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, CreditCard, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useBankAccounts } from '../hooks/queries/useSharedData';
import { QUERY_KEYS } from '../lib/queryKeys';
import { useTableData } from '../hooks/useTableData';
import { Pagination } from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import CreditCardRestoreModal from '../components/CreditCardRestoreModal';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { toast } from 'sonner';
import { extractErrorMessage } from '../utils/errorHandler';

interface Card {
  id: number;
  code: string;
  bankName: string;
  cardName: string; // NEW: User-friendly card name
  cardNumberLast4: string;
  cardType: 'CREDIT' | 'DEBIT';
  cardBrand: string;
  bankAccountId: number | null;
  creditLimit: number;
  usedCredit: number;
  status: 'ACTIVE' | 'INACTIVE';
  BankAccount?: {
    id: number;
    bankName: string;
    accountNumber: string;
    balance: number;
  };
}

// interface BankAccount {
//   id: number;
//   code: string;
//   bankName: string;
//   accountNumber: string;
//   balance: number;
// }

const Cards = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { confirm, dialogProps } = useConfirm();
  
  // ✅ NEW: Use useTableData for pagination
  const {
    data: cards,
    pagination,
    loading: cardsLoading,
    search,
    updateSearch,
    goToPage,
    changeLimit,
    refresh
  } = useTableData<Card>({
    endpoint: '/api/cards',
    initialLimit: 50,
    initialSortBy: 'createdAt',
    initialSortOrder: 'DESC'
  });
  
  const { data: bankAccounts = [], isLoading: accountsLoading } = useBankAccounts();
  
  const isLoading = cardsLoading || accountsLoading;
  const [showModal, setShowModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoringCard, setRestoringCard] = useState<Card | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bankName: '',
    cardName: '',
    cardNumberLast4: '',
    cardType: 'CREDIT' as 'CREDIT' | 'DEBIT',
    cardBrand: '',
    bankAccountId: '',
    creditLimit: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  // ✅ MEMOIZED: Close modal - DEFINED FIRST
  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingCard(null);
    setIsSubmitting(false);
  }, []);

  // ✅ MEMOIZED: Open modal - DEFINED SECOND
  const openModal = useCallback((card?: Card) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        bankName: card.bankName,
        cardName: card.cardName,
        cardNumberLast4: card.cardNumberLast4,
        cardType: card.cardType,
        cardBrand: card.cardBrand,
        bankAccountId: card.bankAccountId?.toString() || '',
        creditLimit: card.creditLimit?.toString() || '0',
        status: card.status,
      });
    } else {
      setEditingCard(null);
      setFormData({
        bankName: '',
        cardName: '',
        cardNumberLast4: '',
        cardType: 'CREDIT',
        cardBrand: '',
        bankAccountId: '',
        creditLimit: '0',
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
    
    setIsSubmitting(true);
    try {
      if (editingCard) {
        await api.put(`/cards/${editingCard.id}`, formData);
        toast.success('Card updated successfully');
      } else {
        await api.post('/cards', formData);
        toast.success('Card created successfully');
      }
      
      // ✅ REACT QUERY: Cache invalidation for automatic UI updates
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cards });
      refresh(); // Refresh pagination data
      
      closeModal();
    } catch (error: any) {
      console.error('Error saving card:', error);
      toast.error(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, editingCard, formData, queryClient, refresh, closeModal]);

  // ✅ MEMOIZED: Handle delete - NO MORE window.confirm!
  const handleDelete = useCallback(async (id: number) => {
    const confirmed = await confirm({
      title: 'Delete Card',
      message: 'Are you sure you want to delete this card? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (confirmed) {
      try {
        await api.delete(`/cards/${id}`);
        
        // ✅ REACT QUERY: Cache invalidation for automatic UI updates
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cards });
        refresh(); // Refresh pagination data
        toast.success('Card deleted successfully');
      } catch (error: any) {
        console.error('Error deleting card:', error);
        toast.error(extractErrorMessage(error));
      }
    }
  }, [queryClient, confirm, refresh]);

  // ✅ NEW: Close restore modal
  const closeRestoreModal = useCallback(() => {
    setShowRestoreModal(false);
    setRestoringCard(null);
  }, []);

  // ✅ NEW: Open restore modal
  const openRestoreModal = useCallback((card: Card) => {
    setRestoringCard(card);
    setShowRestoreModal(true);
  }, []);

  // ✅ NEW: Handle restoration success
  const handleRestoreSuccess = useCallback(async () => {
    // Invalidate all financial-related caches with aggressive refetching
    await queryClient.invalidateQueries({ queryKey: ['cards'] });
    await queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    await queryClient.invalidateQueries({ queryKey: ['general-ledger'] });
    await queryClient.invalidateQueries({ queryKey: ['trial-balance'] });
    await queryClient.invalidateQueries({ queryKey: ['credit-card-transactions'] });
    
    // Force immediate refetch
    await queryClient.refetchQueries({ queryKey: ['general-ledger'] });
    await queryClient.refetchQueries({ queryKey: ['trial-balance'] });
    
    refresh();
    closeRestoreModal();
  }, [queryClient, refresh, closeRestoreModal]);

  // ✅ OPTIMIZED: Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading cards...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="text-blue-600" />
          {t('cards')}
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
          {t('newCard')}
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
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('cardName').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('bankName').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('last4Digits').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('cardType').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('cardBrand').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">LINKED ACCOUNT</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">CREDIT INFO</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">{t('status').toUpperCase()}</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">{t('actions').toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr key={card.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{card.code}</td>
                <td className="px-6 py-4 text-sm font-semibold text-blue-600">{card.cardName}</td>
                <td className="px-6 py-4 text-sm">{card.bankName}</td>
                <td className="px-6 py-4 text-sm">****{card.cardNumberLast4}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    card.cardType === 'CREDIT' ? 'bg-blue-100 text-blue-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {card.cardType}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{card.cardBrand || '-'}</td>
                <td className="px-6 py-4 text-sm">
                  {card.BankAccount ? (
                    <div className="flex flex-col">
                      <span className="font-medium text-blue-600">
                        {card.BankAccount.bankName}
                      </span>
                      <span className="text-xs text-gray-500">
                        Acc: {card.BankAccount.accountNumber}
                      </span>
                      <span className="text-xs text-blue-600 font-medium">
                        Balance: ${Number(card.BankAccount.balance).toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Not Linked</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  {card.cardType === 'CREDIT' ? (
                    <div className="text-right">
                      <div className="font-semibold text-blue-600">
                        Limit: ${Number(card.creditLimit).toFixed(2)}
                      </div>
                      <div className="text-sm text-red-600">
                        Used: ${Number(card.usedCredit || 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-green-600 font-medium">
                        Available: ${(Number(card.creditLimit) - Number(card.usedCredit || 0)).toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    card.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {card.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 justify-center">
                    {card.cardType === 'CREDIT' && Number(card.usedCredit || 0) > 0 && (
                      <button
                        onClick={() => openRestoreModal(card)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Restore Money"
                      >
                        <RefreshCw size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => openModal(card)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(card.id)}
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-md my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
                <h2 className="text-2xl font-bold">
                  {editingCard ? t('editCard') : t('newCard')}
                </h2>
                <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded">
                  <X size={24} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-2">
                <form id="card-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('bankName')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Banco Popular, BHD, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('cardName')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.cardName}
                    onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="John's Business Card, Main Company Card, etc."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Friendly name to easily identify this card
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('last4Digits')} *</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={formData.cardNumberLast4}
                    onChange={(e) => setFormData({ ...formData, cardNumberLast4: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="1234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('cardType')} *</label>
                  <select
                    required
                    value={formData.cardType}
                    onChange={(e) => {
                      const newCardType = e.target.value as 'CREDIT' | 'DEBIT';
                      setFormData({ 
                        ...formData, 
                        cardType: newCardType,
                        // Clear bank account if switching to CREDIT
                        bankAccountId: newCardType === 'CREDIT' ? '' : formData.bankAccountId,
                        // Clear credit limit if switching to DEBIT
                        creditLimit: newCardType === 'DEBIT' ? '0' : formData.creditLimit
                      });
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CREDIT">{t('credit')}</option>
                    <option value="DEBIT">Debit</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.cardType === 'DEBIT' 
                      ? '💳 DEBIT: Uses money from your bank account' 
                      : '💳 CREDIT: Uses credit limit from card issuer'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('cardBrand')}</label>
                  <input
                    type="text"
                    value={formData.cardBrand}
                    onChange={(e) => setFormData({ ...formData, cardBrand: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Visa, Mastercard, Amex, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('bankAccount')} {formData.cardType === 'DEBIT' && '*'}
                  </label>
                  <select
                    required={formData.cardType === 'DEBIT'}
                    disabled={formData.cardType === 'CREDIT'}
                    value={formData.cardType === 'CREDIT' ? '' : formData.bankAccountId}
                    onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formData.cardType === 'CREDIT' ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">
                      {formData.cardType === 'DEBIT' 
                        ? t('selectBankAccount')
                        : 'Not applicable for Credit Cards'
                      }
                    </option>
                    {formData.cardType === 'DEBIT' && bankAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.bankName} - {account.accountNumber} (Balance: ${Number(account.balance).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.cardType === 'DEBIT' 
                      ? '💳 DEBIT card: Money deducted directly from selected bank account' 
                      : '💳 CREDIT card: Uses credit limit, not linked to bank account'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Credit Limit {formData.cardType === 'CREDIT' && '*'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required={formData.cardType === 'CREDIT'}
                    disabled={formData.cardType === 'DEBIT'}
                    value={formData.cardType === 'DEBIT' ? '0' : formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formData.cardType === 'DEBIT' ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.cardType === 'CREDIT' 
                      ? '💰 Maximum credit limit available on this card' 
                      : '💰 Not applicable for DEBIT cards (uses bank account balance)'}
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
                </form>
              </div>

              <div className="flex gap-3 pt-4 mt-4 border-t sticky bottom-0 bg-white">
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
                  form="card-form"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {editingCard ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    editingCard ? t('update') : t('create')
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ NEW: Credit Card Restore Modal */}
      {showRestoreModal && restoringCard && (
        <CreditCardRestoreModal
          card={restoringCard}
          onClose={closeRestoreModal}
          onSuccess={handleRestoreSuccess}
        />
      )}

      {/* ✅ Confirm Dialog - Replaces window.confirm */}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default Cards;
