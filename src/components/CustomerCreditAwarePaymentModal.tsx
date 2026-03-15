import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCreditCard, FaMoneyBillWave, FaTimes, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import axios from '../api/axios';
import { formatNumber } from '../utils/formatNumber';

interface CustomerCreditAwarePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerId: number;
  customerName: string;
  invoiceIds: number[];
  requestedAmount: number;
  paymentMethod: string;
  cashRegisterId: number;
  registrationDate: string;
  description: string;
}

interface CustomerPaymentPreview {
  totalInvoiceBalance: number;
  availableCredit: number;
  creditWillBeUsed: number;
  cashPaymentNeeded: number;
  willCreateNewCredit: boolean;
  newCreditAmount: number;
}

const CustomerCreditAwarePaymentModal: React.FC<CustomerCreditAwarePaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customerId,
  customerName,
  invoiceIds,
  requestedAmount,
  paymentMethod,
  cashRegisterId,
  registrationDate,
  description
}) => {
  const [preview, setPreview] = useState<CustomerPaymentPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment preview when modal opens
  useEffect(() => {
    if (isOpen && customerId && invoiceIds.length > 0) {
      fetchPaymentPreview();
    }
  }, [isOpen, customerId, invoiceIds, requestedAmount]);

  const fetchPaymentPreview = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/customer-credit-aware-payment/preview', {
        customerId,
        invoiceIds,
        requestedAmount
      });
      
      setPreview(response.data);
    } catch (error: any) {
      console.error('Error fetching customer payment preview:', error);
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
        customerId,
        customerName,
        invoiceIds,
        requestedPaymentAmount: requestedAmount,
        paymentMethod,
        cashRegisterId,
        registrationDate,
        description
      };
      
      const response = await axios.post('/customer-credit-aware-payment/process', paymentRequest);
      
      if (response.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.data.message || 'Payment processing failed');
      }
    } catch (error: any) {
      console.error('Error processing customer payment:', error);
      setError(error.response?.data?.error || 'Payment processing failed');
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
              <FaCreditCard className="text-green-600 text-xl" />
              <h2 className="text-xl font-semibold text-gray-800">
                Smart Customer Payment with Credit Balance
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
            {/* Customer Info */}
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-green-900 mb-2">Payment Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700">Customer:</span>
                  <span className="ml-2 font-medium">{customerName}</span>
                </div>
                <div>
                  <span className="text-green-700">Payment Amount:</span>
                  <span className="ml-2 font-medium">₹{formatNumber(requestedAmount)}</span>
                </div>
                <div>
                  <span className="text-green-700">Payment Method:</span>
                  <span className="ml-2 font-medium">{paymentMethod}</span>
                </div>
                <div>
                  <span className="text-green-700">Invoices:</span>
                  <span className="ml-2 font-medium">{invoiceIds.length} selected</span>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Calculating optimal payment strategy...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <FaInfoCircle className="text-red-600" />
                  <span className="text-red-800 font-medium">Error</span>
                </div>
                <p className="text-red-700 mt-2">{error}</p>
              </div>
            )}

            {/* Payment Preview */}
            {preview && !isLoading && (
              <div className="space-y-6">
                {/* Credit Balance Usage */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-3 flex items-center">
                    <FaCreditCard className="mr-2" />
                    Customer Credit Balance Analysis
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Available Credit:</span>
                        <span className="font-medium">₹{formatNumber(preview.availableCredit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Credit Will Be Used:</span>
                        <span className="font-medium text-blue-800">₹{formatNumber(preview.creditWillBeUsed)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Invoice Balance:</span>
                        <span className="font-medium">₹{formatNumber(preview.totalInvoiceBalance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Cash Payment Needed:</span>
                        <span className="font-medium text-green-800">₹{formatNumber(preview.cashPaymentNeeded)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <FaMoneyBillWave className="mr-2" />
                    Payment Breakdown
                  </h3>
                  
                  <div className="space-y-3">
                    {preview.creditWillBeUsed > 0 && (
                      <div className="flex items-center justify-between p-3 bg-blue-100 rounded">
                        <div className="flex items-center">
                          <FaCheckCircle className="text-blue-600 mr-2" />
                          <span className="text-blue-800">From Customer Credit Balance</span>
                        </div>
                        <span className="font-medium text-blue-800">₹{formatNumber(preview.creditWillBeUsed)}</span>
                      </div>
                    )}
                    
                    {preview.cashPaymentNeeded > 0 && (
                      <div className="flex items-center justify-between p-3 bg-green-100 rounded">
                        <div className="flex items-center">
                          <FaMoneyBillWave className="text-green-600 mr-2" />
                          <span className="text-green-800">Cash Payment Required</span>
                        </div>
                        <span className="font-medium text-green-800">₹{formatNumber(preview.cashPaymentNeeded)}</span>
                      </div>
                    )}
                    
                    {preview.willCreateNewCredit && (
                      <div className="flex items-center justify-between p-3 bg-yellow-100 rounded">
                        <div className="flex items-center">
                          <FaInfoCircle className="text-yellow-600 mr-2" />
                          <span className="text-yellow-800">New Credit Balance</span>
                        </div>
                        <span className="font-medium text-yellow-800">₹{formatNumber(preview.newCreditAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Benefits */}
                {preview.creditWillBeUsed > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-medium text-green-900 mb-2">💡 Smart Payment Benefits</h3>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Automatically uses customer's existing credit balance first</li>
                      <li>• Reduces cash handling by ₹{formatNumber(preview.creditWillBeUsed)}</li>
                      <li>• Optimizes customer account management</li>
                      {preview.cashPaymentNeeded === 0 && (
                        <li>• <strong>No cash payment needed!</strong> Fully covered by credit balance</li>
                      )}
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
              disabled={isLoading || isProcessing || !preview}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
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

export default CustomerCreditAwarePaymentModal;