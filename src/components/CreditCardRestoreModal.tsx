/**
 * Credit Card Restore Modal Component
 * 
 * Allows users to restore credit card money by repaying from:
 * - Bank Transfer
 * - Check
 * - Cash
 * 
 * This reduces the used credit and creates appropriate register entries
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useBankAccounts } from '../hooks/queries/useSharedData';

interface Card {
  id: number;
  cardName: string;
  cardBrand: string;
  cardNumberLast4: string;
  creditLimit: number;
  usedCredit: number;
}

interface CreditCardRestoreModalProps {
  card: Card;
  onClose: () => void;
  onSuccess: () => void;
}

const CreditCardRestoreModal = ({ card, onClose, onSuccess }: CreditCardRestoreModalProps) => {
  const { data: bankAccounts = [] } = useBankAccounts();
  const queryClient = useQueryClient();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'BANK_TRANSFER' as 'BANK_TRANSFER' | 'CHECK' | 'CASH',
    bankAccountId: '',
    chequeNumber: '',
    reference: '',
    notes: ''
  });

  const usedCredit = Number(card.usedCredit || 0);
  const availableCredit = Number(card.creditLimit) - usedCredit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than zero');
      return;
    }
    
    if (amount > usedCredit) {
      setError(`Amount cannot exceed used credit of $${usedCredit.toFixed(2)}`);
      return;
    }
    
    if ((formData.paymentMethod === 'BANK_TRANSFER' || formData.paymentMethod === 'CHECK') && !formData.bankAccountId) {
      setError('Please select a bank account');
      return;
    }
    
    if (formData.paymentMethod === 'CHECK' && !formData.chequeNumber) {
      setError('Please enter a check number');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        amount,
        paymentMethod: formData.paymentMethod,
        bankAccountId: formData.bankAccountId ? parseInt(formData.bankAccountId) : undefined,
        chequeNumber: formData.chequeNumber || undefined,
        restorationDate: new Date().toISOString(),
        reference: formData.reference || undefined,
        notes: formData.notes || undefined
      };
      
      console.log('📤 Sending restoration request:', payload);
      
      const response = await api.post(`/credit-card-register/restore/${card.id}`, payload);
      
      console.log('✅ Restoration successful:', response.data);
      
      // ✅ CRITICAL: Invalidate all financial caches to update UI
      // Use aggressive invalidation to ensure all related queries are refetched
      await queryClient.invalidateQueries({ queryKey: ['cards'] });
      await queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['general-ledger'] }); // Invalidates all general-ledger queries
      await queryClient.invalidateQueries({ queryKey: ['trial-balance'] }); // Invalidates all trial-balance queries
      await queryClient.invalidateQueries({ queryKey: ['credit-card-transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      
      // Also refetch immediately to ensure data is fresh
      await queryClient.refetchQueries({ queryKey: ['general-ledger'] });
      await queryClient.refetchQueries({ queryKey: ['trial-balance'] });
      
      onSuccess();
    } catch (err: any) {
      console.error('❌ Error restoring credit card:', err);
      console.error('   Error response:', err.response?.data);
      console.error('   Error message:', err.response?.data?.error || err.response?.data?.message);
      console.error('   Status:', err.response?.status);
      
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to restore credit card. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <RefreshCw className="text-blue-600" />
              Restore Credit Card
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X size={24} />
            </button>
          </div>

          {/* Card Info */}
          <div className="bg-gradient-to-b from-blue-600 to-blue-800 text-white rounded-lg p-4 mb-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-sm opacity-90">Card Name</div>
                <div className="font-bold text-lg">{card.cardName}</div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90">{card.cardBrand}</div>
                <div className="font-mono">****{card.cardNumberLast4}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
              <div>
                <div className="text-xs opacity-75">Credit Limit</div>
                <div className="font-bold">${Number(card.creditLimit).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs opacity-75">Used Credit</div>
                <div className="font-bold text-red-200">${usedCredit.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs opacity-75">Available</div>
                <div className="font-bold text-blue-200">${availableCredit.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Restoration Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={usedCredit}
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum: ${usedCredit.toFixed(2)} (current used credit)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Payment Method *
              </label>
              <select
                required
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  paymentMethod: e.target.value as 'BANK_TRANSFER' | 'CHECK' | 'CASH',
                  // Clear bank account if switching to CASH
                  bankAccountId: e.target.value === 'CASH' ? '' : formData.bankAccountId,
                  // Clear check number if not CHECK
                  chequeNumber: e.target.value === 'CHECK' ? formData.chequeNumber : ''
                })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHECK">Check</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            {(formData.paymentMethod === 'BANK_TRANSFER' || formData.paymentMethod === 'CHECK') && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Bank Account *
                </label>
                <select
                  required
                  value={formData.bankAccountId}
                  onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Bank Account</option>
                  {bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.bankName} - {account.accountNumber} (Balance: ${Number(account.balance).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.paymentMethod === 'CHECK' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Check Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.chequeNumber}
                  onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Check number"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                Reference Number
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Optional reference number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Optional notes about this restoration"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Restoring...
                  </div>
                ) : (
                  'Restore Credit'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreditCardRestoreModal;
