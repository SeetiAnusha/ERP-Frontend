import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCreditCard, FaUniversity, FaTimes, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import axios from '../api/axios';
import { formatNumber } from '../utils/formatNumber';

interface CreditAwarePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplierId: number;
  supplierName: string;
  invoiceIds: number[];
  requestedAmount: number;
  paymentMethod: string;
  bankAccountId: number;
  registrationDate: string;
  description: string;
}

interface PaymentPreview {
  totalInvoiceBalance: number;
  availableCredit: number;
  creditWillBeUsed: number;
  bankPaymentNeeded: number;
  willCreateNewCredit: boolean;
  newCreditAmount: number;
  overpaymentBlocked?: boolean;
  overpaymentBlockReason?: string;
  smartSuggestion?: string;
  bankBalanceValidation?: {
    hasSufficientBalance: boolean;
    availableBalance: number;
    errorMessage?: string;
  };
}

const CreditAwarePaymentModal: React.FC<CreditAwarePaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  supplierId,
  supplierName,
  invoiceIds,
  requestedAmount,
  paymentMethod,
  bankAccountId,
  registrationDate,
  description
}) => {
  const [preview, setPreview] = useState<PaymentPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment preview when modal opens
  useEffect(() => {
    if (isOpen && supplierId && invoiceIds.length > 0) {
      fetchPaymentPreview();
    }
  }, [isOpen, supplierId, invoiceIds, requestedAmount]);

  const fetchPaymentPreview = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/credit-aware-payment/preview', {
        supplierId,
        invoiceIds,
        requestedAmount,
        bankAccountId
      });
      
      setPreview(response.data);
    } catch (error: any) {
      console.error('Error fetching payment preview:', error);
      setError(error.response?.data?.error || 'Failed to load payment preview');
    } finally {
      setIsLoading(false);
    }
  };

  const processPayment = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const paymentRequest = {
        supplierId,
        supplierName,
        invoiceIds,
        requestedPaymentAmount: requestedAmount,
        paymentMethod,
        bankAccountId,
        registrationDate,
        description
      };
      
      console.log('🎯 Processing payment request:', paymentRequest);
      
      const response = await axios.post('/credit-aware-payment/process', paymentRequest);
      
      console.log('📋 Payment response:', response.data);
      
      if (response.data.success) {
        onSuccess();
        onClose();
      } else {
        // Extract detailed error message from backend
        const errorMessage = response.data.message || 'Payment processing failed';
        console.error('❌ Payment failed:', errorMessage);
        setError(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Error processing payment:', error);
      
      // Extract the most detailed error message available
      let errorMessage = 'Payment processing failed';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('❌ Setting error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <FaCreditCard className="text-blue-600 text-xl" />
              <h2 className="text-xl font-semibold text-gray-800">
                Smart Payment with Credit Balance
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Supplier Info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Payment Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Supplier:</span>
                  <span className="ml-2 font-medium">{supplierName}</span>
                </div>
                <div>
                  <span className="text-blue-700">Requested Amount:</span>
                  <span className="ml-2 font-medium">₹{formatNumber(requestedAmount)}</span>
                </div>
                <div>
                  <span className="text-blue-700">Payment Method:</span>
                  <span className="ml-2 font-medium">{paymentMethod}</span>
                </div>
                <div>
                  <span className="text-blue-700">Invoices:</span>
                  <span className="ml-2 font-medium">{invoiceIds.length} selected</span>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Calculating optimal payment strategy...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <FaInfoCircle className="text-red-600 text-xl mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-red-800 font-semibold text-lg mb-2">Payment Failed</h4>
                    <div className="text-red-700 text-sm leading-relaxed">
                      {error.split('\n').map((line, index) => (
                        <p key={index} className={index > 0 ? 'mt-1' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Preview */}
            {preview && !isLoading && (
              <div className="space-y-6">
                {/* 🚫 SMART OVERPAYMENT PREVENTION ALERT */}
                {preview.overpaymentBlocked && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <FaInfoCircle className="text-red-600 text-xl mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-red-800 font-semibold text-lg mb-2">🚫 Overpayment Blocked</h4>
                        <div className="text-red-700 text-sm leading-relaxed space-y-2">
                          <p className="font-medium">{preview.overpaymentBlockReason}</p>
                          <p className="text-red-600">💡 {preview.smartSuggestion}</p>
                          <div className="mt-3 p-3 bg-red-100 rounded border-l-4 border-l-red-600">
                            <p className="text-red-800 font-medium text-sm">
                              ✅ Recommended Action: Pay only ₹{formatNumber(preview.totalInvoiceBalance)} (invoice amount)
                            </p>
                            <p className="text-red-700 text-xs mt-1">
                              This will use ₹{formatNumber(preview.creditWillBeUsed)} from credit balance + ₹{formatNumber(preview.bankPaymentNeeded)} from bank account
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Credit Balance Usage */}
                {!preview.overpaymentBlocked && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-medium text-green-900 mb-3 flex items-center">
                      <FaCreditCard className="mr-2" />
                      Smart Credit Balance Analysis
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-green-700">Available Credit:</span>
                          <span className="font-medium">₹{formatNumber(preview.availableCredit)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700">Credit Will Be Used:</span>
                          <span className="font-medium text-green-800">₹{formatNumber(preview.creditWillBeUsed)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-green-700">Invoice Balance:</span>
                          <span className="font-medium">₹{formatNumber(preview.totalInvoiceBalance)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700">Bank Payment Needed:</span>
                          <span className="font-medium text-blue-800">₹{formatNumber(preview.bankPaymentNeeded)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Breakdown */}
                {!preview.overpaymentBlocked && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <FaUniversity className="mr-2" />
                      Smart Payment Breakdown
                    </h3>
                    
                    <div className="space-y-3">
                      {preview.creditWillBeUsed > 0 && (
                        <div className="flex items-center justify-between p-3 bg-green-100 rounded">
                          <div className="flex items-center">
                            <FaCheckCircle className="text-green-600 mr-2" />
                            <span className="text-green-800">From Credit Balance (Priority 1)</span>
                          </div>
                          <span className="font-medium text-green-800">₹{formatNumber(preview.creditWillBeUsed)}</span>
                        </div>
                      )}
                      
                      {preview.bankPaymentNeeded > 0 && (
                        <div className="flex items-center justify-between p-3 bg-blue-100 rounded">
                          <div className="flex items-center">
                            <FaUniversity className="text-blue-600 mr-2" />
                            <span className="text-blue-800">From Bank Account (Priority 2)</span>
                          </div>
                          <span className="font-medium text-blue-800">₹{formatNumber(preview.bankPaymentNeeded)}</span>
                        </div>
                      )}
                      
                      {preview.willCreateNewCredit && (
                        <div className="flex items-center justify-between p-3 bg-yellow-100 rounded">
                          <div className="flex items-center">
                            <FaInfoCircle className="text-yellow-600 mr-2" />
                            <span className="text-yellow-800">New Credit Balance (Overpayment)</span>
                          </div>
                          <span className="font-medium text-yellow-800">₹{formatNumber(preview.newCreditAmount)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bank Balance Validation */}
                {preview.bankBalanceValidation && preview.bankPaymentNeeded > 0 && (
                  <div className={`rounded-lg p-4 ${
                    preview.bankBalanceValidation.hasSufficientBalance 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <h3 className={`font-medium mb-2 flex items-center ${
                      preview.bankBalanceValidation.hasSufficientBalance 
                        ? 'text-green-900' 
                        : 'text-red-900'
                    }`}>
                      <FaUniversity className="mr-2" />
                      Bank Account Balance Check
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className={preview.bankBalanceValidation.hasSufficientBalance ? 'text-green-700' : 'text-red-700'}>
                          Available Balance:
                        </span>
                        <span className="font-medium">
                          ₹{formatNumber(preview.bankBalanceValidation.availableBalance)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={preview.bankBalanceValidation.hasSufficientBalance ? 'text-green-700' : 'text-red-700'}>
                          Required Amount:
                        </span>
                        <span className="font-medium">
                          ₹{formatNumber(preview.bankPaymentNeeded)}
                        </span>
                      </div>
                      
                      {!preview.bankBalanceValidation.hasSufficientBalance && (
                        <div className="mt-3 p-4 bg-red-100 border-2 border-red-400 rounded-lg border-l-4 border-l-red-600">
                          <div className="flex items-start space-x-3">
                            <FaInfoCircle className="text-red-600 text-lg mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-red-800 font-semibold text-base">⚠️ Insufficient Bank Balance</p>
                              <p className="text-red-700 text-sm mt-2 leading-relaxed">
                                {preview.bankBalanceValidation.errorMessage}
                              </p>
                              <p className="text-red-600 text-xs mt-2 font-medium">
                                Please add funds to your bank account or reduce the payment amount.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {preview.bankBalanceValidation.hasSufficientBalance && (
                        <div className="mt-2 flex items-center text-green-800">
                          <FaCheckCircle className="mr-2" />
                          <span className="font-medium">✅ Sufficient balance available</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Smart Payment Benefits */}
                {!preview.overpaymentBlocked && preview.creditWillBeUsed > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">💡 Smart Payment Benefits</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Automatically uses existing credit balance first (Credit-First Logic)</li>
                      <li>• Reduces bank account usage by ₹{formatNumber(preview.creditWillBeUsed)}</li>
                      <li>• Optimizes cash flow management</li>
                      {preview.bankPaymentNeeded === 0 && (
                        <li>• <strong>No bank payment needed!</strong> Fully covered by credit balance</li>
                      )}
                      <li>• Prevents unnecessary overpayments when credit exists</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            
            <button
              onClick={processPayment}
              disabled={
                isLoading || 
                isProcessing || 
                !preview || 
                preview.overpaymentBlocked ||
                (preview.bankBalanceValidation && !preview.bankBalanceValidation.hasSufficientBalance)
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : preview?.overpaymentBlocked ? (
                <>
                  <FaInfoCircle />
                  <span>Overpayment Blocked</span>
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  <span>Process Smart Payment</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreditAwarePaymentModal;