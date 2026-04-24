import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { notify } from '../utils/notifications';
import { QUERY_KEYS } from '../lib/queryKeys';
import OverpaymentAlertModal from './OverpaymentAlertModal';
import CreditBalanceDisplay from './CreditBalanceDisplay';

// ✅ Import shared components for Phase 1 refactoring
import { BankAccountSelector, CardSelector } from './shared';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction: {
    id: number;
    type: 'AP' | 'AR';
    registrationNumber: string;
    relatedDocumentNumber: string;
    entityName: string;
    entityId?: number;
    entityType: 'CLIENT' | 'SUPPLIER';
    amount: number;
    paidAmount: number;
    balanceAmount: number;
    isCardTransaction?: boolean;
    cardId?: number;
  };
  title?: string;
}

const EnhancedPaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  transaction,
  title
}) => {
  const queryClient = useQueryClient();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'BANK_ACCOUNT' | 'CREDIT_CARD'>('BANK_ACCOUNT');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [selectedCreditCardId, setSelectedCreditCardId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Overpayment handling
  const [showOverpaymentAlert, setShowOverpaymentAlert] = useState(false);
  const [overpaymentData, setOverpaymentData] = useState<any>(null);
  const [allowOverpayment, setAllowOverpayment] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      
      // 🔥 NEW: Auto-select payment method based on AP cardId
      if (transaction.cardId) {
        console.log('🎯 AP has cardId:', transaction.cardId, '- Auto-selecting credit card payment');
        setPaymentMethod('CREDIT_CARD');
        setSelectedCreditCardId(transaction.cardId.toString());
      }
    }
  }, [isOpen, transaction]);

  const resetForm = () => {
    setPaymentAmount(transaction.balanceAmount.toString());
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentReference('');
    setPaymentDescription(`Payment for ${transaction.relatedDocumentNumber} - ${transaction.entityName}`);
    setPaymentMethod('BANK_ACCOUNT');
    setSelectedBankAccountId('');
    setSelectedCreditCardId('');
    setAllowOverpayment(false);
    setShowOverpaymentAlert(false);
    setOverpaymentData(null);
  };

  const validatePaymentAmount = async () => {
    const amount = parseFloat(paymentAmount);
    const balance = transaction.balanceAmount;
    
    if (amount > balance) {
      try {
        const response = await api.post('/credit-balances/validate-payment', {
          outstandingBalance: balance,
          paymentAmount: amount,
          entityType: transaction.entityType,
          entityName: transaction.entityName
        });
        
        if (response.data.isOverpayment) {
          setOverpaymentData({
            paymentAmount: amount,
            outstandingBalance: balance,
            overpaymentAmount: response.data.overpaymentAmount,
            entityName: transaction.entityName,
            entityType: transaction.entityType,
            message: response.data.message
          });
          setShowOverpaymentAlert(true);
          return false;
        }
      } catch (error) {
        console.error('Error validating payment amount:', error);
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!paymentAmount || !paymentDate) {
      notify.warning('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      notify.warning('Payment amount must be greater than 0');
      return;
    }

    // Check for overpayment if not already allowed
    if (!allowOverpayment) {
      const isValid = await validatePaymentAmount();
      if (!isValid) return; // Overpayment alert will be shown
    }

    // Validate payment method selection
    if (paymentMethod === 'BANK_ACCOUNT' && !selectedBankAccountId) {
      notify.warning('Please select a bank account to pay from');
      return;
    }

    if (paymentMethod === 'CREDIT_CARD' && !selectedCreditCardId) {
      notify.warning('Please select a credit card to pay with');
      return;
    }

    setIsSubmitting(true);

    try {
      const paymentData: any = {
        amount,
        paidDate: new Date(paymentDate),
        notes: paymentDescription || undefined,
        reference: paymentReference || undefined,
        allowOverpayment: allowOverpayment
      };

      // Add payment method specific data
      if (paymentMethod === 'CREDIT_CARD') {
        paymentData.cardId = parseInt(selectedCreditCardId);
        paymentData.paymentMethod = 'CREDIT_CARD';
      } else if (transaction.isCardTransaction) {
        // For credit card payments, always use bank transfer
        paymentData.bankAccountId = parseInt(selectedBankAccountId);
        paymentData.paymentMethod = 'BANK_TRANSFER';
      } else {
        // For regular AP, also use bank transfer (simplified)
        paymentData.bankAccountId = parseInt(selectedBankAccountId);
        paymentData.paymentMethod = 'BANK_TRANSFER';
      }

      // For AR, add additional fields
      if (transaction.type === 'AR') {
        paymentData.receivedDate = new Date(paymentDate);
        if (transaction.isCardTransaction) {
          paymentData.isCardSale = true;
        }
      }

      const endpoint = transaction.type === 'AP' 
        ? `/accounts-payable/${transaction.id}/record-payment`
        : `/accounts-receivable/${transaction.id}/record-payment`;

      const response = await api.post(endpoint, paymentData);
      
      // Handle success response
      if (response.data.overpaymentAmount > 0) {
        notify.success(response.data.message || `Payment processed. Credit balance of ₹${response.data.overpaymentAmount.toFixed(2)} created.`);
      } else {
        notify.success('Payment processed successfully');
      }
      
      // ✅ CRITICAL: Invalidate all related caches after payment (parallel execution)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountsPayable }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountsReceivable }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashRegisters }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cards }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.creditCardTransactions }), // ✅ FIX: Invalidate credit card register
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankRegisters }), // ✅ FIX: Invalidate bank register too
      ]);
      
      onSuccess();
      onClose();
    } catch (error: any) {
      // Handle overpayment detection error
      if (error.response?.data?.code === 'OVERPAYMENT_DETECTED') {
        setOverpaymentData({
          paymentAmount: error.response.data.paymentAmount,
          outstandingBalance: error.response.data.outstandingBalance,
          overpaymentAmount: error.response.data.overpaymentAmount,
          entityName: error.response.data.customerName || error.response.data.supplierName,
          entityType: transaction.entityType,
          message: error.response.data.message
        });
        setShowOverpaymentAlert(true);
      } else {
        notify.error(error.response?.data?.error || 'Error processing payment');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverpaymentConfirm = () => {
    setAllowOverpayment(true);
    setShowOverpaymentAlert(false);
    // Automatically submit after confirming overpayment
    setTimeout(() => handleSubmit(), 100);
  };

  const handleOverpaymentAdjust = () => {
    setPaymentAmount(transaction.balanceAmount.toString());
    setShowOverpaymentAlert(false);
    setAllowOverpayment(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {title || `Record ${transaction.type === 'AP' ? 'Payment' : 'Collection'}`}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Transaction Info & Credit Balance */}
            <div className="space-y-6">
              {/* Transaction Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Transaction Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Document:</span>
                    <span className="font-medium">{transaction.relatedDocumentNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{transaction.entityType === 'CLIENT' ? 'Customer' : 'Supplier'}:</span>
                    <span className="font-medium">{transaction.entityName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">₹{transaction.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Already {transaction.type === 'AP' ? 'Paid' : 'Received'}:</span>
                    <span className="font-medium text-green-600">₹{transaction.paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600 font-medium">Outstanding Balance:</span>
                    <span className="font-bold text-red-600">₹{transaction.balanceAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Credit Balance Display */}
              {transaction.entityId && (
                <CreditBalanceDisplay
                  entityType={transaction.entityType}
                  entityId={transaction.entityId}
                  entityName={transaction.entityName}
                  compact={true}
                />
              )}
            </div>

            {/* Right Column - Payment Form */}
            <div className="space-y-4">
              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign size={16} className="inline mr-1" />
                  Payment Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter payment amount"
                />
                {parseFloat(paymentAmount || '0') > transaction.balanceAmount && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded flex items-center gap-2">
                    <AlertTriangle size={16} className="text-orange-600" />
                    <span className="text-sm text-orange-700">
                      Overpayment of ₹{(parseFloat(paymentAmount || '0') - transaction.balanceAmount).toFixed(2)} will create credit balance
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Payment Method Selection */}
              {!transaction.cardId ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('BANK_ACCOUNT')}
                      className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                        paymentMethod === 'BANK_ACCOUNT'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      🏦 Bank Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CREDIT_CARD')}
                      className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                        paymentMethod === 'CREDIT_CARD'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      💳 Credit Card
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="p-3 border border-blue-500 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700">
                      <span className="text-lg">💳</span>
                      <span className="font-medium">Credit Card Payment</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      This AP was created from a credit card purchase. Payment will use the same credit card.
                    </p>
                  </div>
                </div>
              )}

              {/* Bank Account Selection - SIMPLIFIED for all AP payments */}
              {paymentMethod === 'BANK_ACCOUNT' && (
                <div>
                  <BankAccountSelector
                    value={selectedBankAccountId}
                    onChange={(value) => setSelectedBankAccountId(value)}
                    required
                    showBalance
                    label={transaction.isCardTransaction 
                      ? 'Select Bank Account to Pay Credit Card Bill' 
                      : 'Select Bank Account to Pay From'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {transaction.isCardTransaction 
                      ? '💳 Payment will be transferred from this bank account to the credit card company'
                      : '💡 Money will be deducted from this bank account and recorded in bank register'}
                  </p>
                </div>
              )}

              {/* Credit Card Selection */}
              {paymentMethod === 'CREDIT_CARD' && (
                <div>
                  <CardSelector
                    value={selectedCreditCardId}
                    onChange={(value) => setSelectedCreditCardId(value)}
                    cardType="CREDIT"
                    required
                    showAvailableLimit
                    disabled={!!transaction.cardId}
                    label={transaction.cardId ? 'Credit Card (Auto-Selected)' : 'Select Credit Card to Pay With'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {transaction.cardId 
                      ? '💳 Using the same credit card from the original purchase'
                      : '💳 Payment will be charged to this credit card and recorded in credit card register'
                    }
                  </p>
                </div>
              )}

              {/* Payment Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText size={16} className="inline mr-1" />
                  Reference/Document Number
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Check number, transfer ID, or reference"
                />
              </div>

              {/* Payment Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes about this payment"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : `Confirm ${transaction.type === 'AP' ? 'Payment' : 'Collection'}`}
            </button>
          </div>
        </motion.div>
      </div>

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
    </>
  );
};

export default EnhancedPaymentModal;