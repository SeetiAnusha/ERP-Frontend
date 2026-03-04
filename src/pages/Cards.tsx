import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, CreditCard } from 'lucide-react';
import api from '../api/axios';
import { useLanguage } from '../contexts/LanguageContext';

interface Card {
  id: number;
  code: string;
  bankName: string;
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

interface BankAccount {
  id: number;
  code: string;
  bankName: string;
  accountNumber: string;
  balance: number;
}

const Cards = () => {
  const { t } = useLanguage();
  const [cards, setCards] = useState<Card[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [formData, setFormData] = useState({
    bankName: '',
    cardNumberLast4: '',
    cardType: 'CREDIT' as 'CREDIT' | 'DEBIT',
    cardBrand: '',
    bankAccountId: '',
    creditLimit: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  useEffect(() => {
    fetchCards();
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const response = await api.get('/bank-accounts');
      setBankAccounts(response.data);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const fetchCards = async () => {
    try {
      const response = await api.get('/cards');
      setCards(response.data);
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCard) {
        await api.put(`/cards/${editingCard.id}`, formData);
      } else {
        await api.post('/cards', formData);
      }
      fetchCards();
      closeModal();
    } catch (error) {
      console.error('Error saving card:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        await api.delete(`/cards/${id}`);
        fetchCards();
      } catch (error) {
        console.error('Error deleting card:', error);
      }
    }
  };

  const openModal = (card?: Card) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        bankName: card.bankName,
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
        cardNumberLast4: '',
        cardType: 'CREDIT',
        cardBrand: '',
        bankAccountId: '',
        creditLimit: '0',
        status: 'ACTIVE',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCard(null);
  };

  const filteredCards = cards.filter((card) =>
    Object.values(card).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="text-purple-600" />
          {t('cards')}
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal()}
          className="ml-4 bg-purple-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
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
            {filteredCards.map((card) => (
              <tr key={card.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{card.code}</td>
                <td className="px-6 py-4 text-sm">{card.bankName}</td>
                <td className="px-6 py-4 text-sm">****{card.cardNumberLast4}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    card.cardType === 'CREDIT' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
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
                      <span className="text-xs text-green-600 font-medium">
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
                    card.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {card.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 justify-center">
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
                  {editingCard ? t('editCard') : t('newCard')}
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Banco Popular, BHD, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('last4Digits')} *</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={formData.cardNumberLast4}
                    onChange={(e) => setFormData({ ...formData, cardNumberLast4: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="1234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('cardType')} *</label>
                  <select
                    required
                    value={formData.cardType}
                    onChange={(e) => setFormData({ ...formData, cardType: e.target.value as 'CREDIT' | 'DEBIT' })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="CREDIT">{t('credit')}</option>
                    <option value="DEBIT">Debit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('cardBrand')}</label>
                  <input
                    type="text"
                    value={formData.cardBrand}
                    onChange={(e) => setFormData({ ...formData, cardBrand: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Visa, Mastercard, Amex, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('bankAccount')} {formData.cardType === 'DEBIT' && '*'}
                  </label>
                  <select
                    required={formData.cardType === 'DEBIT'}
                    value={formData.bankAccountId}
                    onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">{t('selectBankAccount')}</option>
                    {bankAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.bankName} - {account.accountNumber} (Balance: ${Number(account.balance).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.cardType === 'DEBIT' 
                      ? 'DEBIT card must be linked to a bank account' 
                      : 'Optional: Link CREDIT card to bank account for payment tracking'}
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
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.cardType === 'CREDIT' 
                      ? 'Maximum credit limit available on this card' 
                      : 'Not applicable for DEBIT cards (uses bank account balance)'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('status')} *</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="ACTIVE">{t('active')}</option>
                    <option value="INACTIVE">{t('inactive')}</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    {editingCard ? t('update') : t('create')}
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

export default Cards;
