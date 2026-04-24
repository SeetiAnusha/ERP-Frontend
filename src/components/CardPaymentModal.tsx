import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, X, DollarSign, Building2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { formatNumber } from '../utils/formatNumber';
import { notify } from '../utils/notifications';
import { QUERY_KEYS } from '../lib/queryKeys';

interface Card {
  id: number;
  code: string;
  name: string;
  type: 'CREDIT' | 'DEBIT';
  brand: string;
  bankName: string;
  last4: string;
  creditLimit?: number;
  usedCredit?: number;
  availableLimit?: number;
  bankAccountId?: number;
  canAcceptPayment: boolean;
}

interface CardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: number;
  saleAmount: number;
  saleNumber: string;
  cashRegisterId: number;
  onPaymentSuccess: () => void;
}

const CardPaymentModal = ({
  isOpen,
  onClose,
  saleId,
  saleAmount,
  saleNumber,
  cashRegisterId,
  onPaymentSuccess
}: CardPaymentModalProps) => {
  const queryClient = useQueryClient();
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>(saleAmount.toString());
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingCards, setLoadingCards] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableCards();
      setPaymentAmount(saleAmount.toString());
      setDescription(`Card payment for sale ${saleNumber}`);
    }
  }, [isOpen, saleAmount, saleNumber]);

  const fetchAvailableCards = async () => {
    try {
      setLoadingCards(true);
      const response = await api.get('/card-transactions/available');
      setCards(response.data.filter((card: Card) => card.canAcceptPayment));
    } catch (error) {
      console.error('Error fetching cards:', error);
      notify.error('Failed to load available cards');
    } finally {
      setLoadingCards(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCardId) {
      notify.error('Please select a card');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      notify.error('Please enter a valid payment amount');
      return;
    }

    if (amount > saleAmount) {
      notify.error('Payment amount cannot exceed sale amount');
      return;
    }

    try {
      setLoading(true);
      
      await api.post('/card-transactions/sales/payment', {
        saleId,
        cardId: parseInt(selectedCardId),
        amount,
        cashRegisterId,
        registrationDate: new Date().toISOString().split('T')[0],
        description
      });

      // ✅ CRITICAL: Invalidate all related caches after payment (parallel execution)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sale(saleId) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashRegisters }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cards }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountsReceivable }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.creditCardTransactions }), // ✅ FIX: Invalidate credit card register
      ]);

      notify.success('Card payment processed successfully!');
      onPaymentSuccess();
      onClose();
      
    } catch (error: any) {
      console.error('Error processing card payment:', error);
      notify.error(error.response?.data?.error || 'Failed to process card payment');
    } finally {
      setLoading(false);
    }
  };

  const selectedCard = cards.find(card => card.id === parseInt(selectedCardId));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <CreditCard className="text-blue-600 w-6 h-6" />
              <h2 className="text-2xl font-bold text-gray-800">Process Card Payment</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Sale Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Sale Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Sale Number:</span>
                <span className="ml-2 font-medium">{saleNumber}</span>
              </div>
              <div>
                <span className="text-blue-600">Amount Due:</span>
                <span className="ml-2 font-medium">{formatNumber(saleAmount)}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handlePayment} className="space-y-6">
            {/* Card Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Card *
              </label>
              {loadingCards ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading cards...</p>
                </div>
              ) : (
                <select
                  value={selectedCardId}
                  onChange={(e) => setSelectedCardId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose a card...</option>
                  {cards.map(card => (
                    <option key={card.id} value={card.id}>
                      {card.name} ({card.type}) - {card.brand} ****{card.last4}
                      {card.type === 'CREDIT' && ` - Available: ${formatNumber(card.availableLimit || 0)}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Selected Card Details */}
            {selectedCard && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Card Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Type:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedCard.type === 'CREDIT' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedCard.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Bank:</span>
                    <span className="font-medium">{selectedCard.bankName}</span>
                  </div>
                  {selectedCard.type === 'CREDIT' && (
                    <>
                      <div>
                        <span className="text-gray-600">Credit Limit:</span>
                        <span className="ml-2 font-medium">{formatNumber(selectedCard.creditLimit || 0)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Available:</span>
                        <span className="ml-2 font-medium text-green-600">{formatNumber(selectedCard.availableLimit || 0)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                  min="0.01"
                  max={saleAmount}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Payment description..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                disabled={loading || !selectedCardId}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Process Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CardPaymentModal;