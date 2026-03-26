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
  paymentMethod: string; // Required - use Cash Register's selected payment method
  cashRegisterId: number; // Required - use Cash Register's selected cash register
  bankAccountId?: number; // Optional - for bank payments
  registrationDate: string;
  description: string;
  useExistingCredit?: boolean; // Optional flag to control credit usage
  simpleMode?: boolean; // Optional flag for simple mode (debugging)
}

interface CustomerPaymentPreview {
  totalInvoiceBalance: number;
  availableCredit: number;
  creditWillBeUsed: number;
  cashPaymentNeeded: number;
  willCreateNewCredit: boolean;
  newCreditAmount: number;
  paymentTypeRequired: boolean;
  recordInCashRegister: boolean;
  errorMessage?: string;
}

const CustomerCreditAwarePaymentModal: React.FC<CustomerCreditAwarePaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customerId,
  customerName,
  invoiceIds,
  requestedAmount,
  paymentMethod, // Use Cash Register's selected payment method
  cashRegisterId, // Use Cash Register's selected cash register
  bankAccountId,
  registrationDate,
  description,
  useExistingCredit = true
  // simpleMode = false // Unused parameter
}) => {
  const [preview, setPreview] = useState<CustomerPaymentPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Remove duplicate payment method selection - use Cash Register's values
  const [cashRegisters, setCashRegisters] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  // Fetch payment preview when modal opens
  useEffect(() => {
    if (isOpen && customerId && invoiceIds.length > 0) {
      fetchPaymentPreview();
    }
  }, [isOpen, customerId, invoiceIds, requestedAmount]);

  // Fetch cash registers and bank accounts for display purposes only
  useEffect(() => {
    if (isOpen) {
      fetchCashRegisters();
      fetchBankAccounts();
    }
  }, [isOpen]);

  const fetchCashRegisters = async () => {
    try {
      const response = await axios.get('/cash-register-masters');
      const activeRegisters = response.data.filter((r: any) => r.status === 'ACTIVE');
      setCashRegisters(activeRegisters);
    } catch (error) {
      console.error('Error fetching cash registers:', error);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const response = await axios.get('/bank-accounts');
      const activeAccounts = response.data.filter((a: any) => a.status === 'ACTIVE');
      setBankAccounts(activeAccounts);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const fetchPaymentPreview = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/customer-credit-aware-payment/preview', {
        customerId,
        invoiceIds,
        requestedAmount,
        useExistingCredit
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
      // Check for error conditions first
      if (preview?.errorMessage) {
        setError(preview.errorMessage);
        setIsProcessing(false);
        return;
      }
      
      // Check if this is a credit-only payment (no payment type required)
      const isCreditOnlyPayment = preview && !preview.paymentTypeRequired;
      
      if (isCreditOnlyPayment) {
        // Scenarios 2️⃣, 4️⃣, 6️⃣ - Process credit-only payment directly
        const paymentRequest = {
          customerId,
          customerName,
          invoiceIds,
          requestedPaymentAmount: requestedAmount,
          registrationDate,
          description,
          useExistingCredit: true
        };
        
        const response = await axios.post('/customer-credit-aware-payment/process', paymentRequest);
        
        if (response.data.success) {
          onSuccess();
          onClose();
        } else {
          setError(response.data.message || 'Payment processing failed');
        }
      } else {
        // Scenarios 1️⃣, 3️⃣, 🔟 - Payment type required, use Cash Register's selected values
        
        // Validate that Cash Register has provided required values
        if (!paymentMethod) {
          setError('Payment method must be selected in Cash Register form');
          return;
        }
        
        // Validate cash register for cash payments
        if (paymentMethod === 'CASH' && !cashRegisterId) {
          setError('Cash register must be selected in Cash Register form for cash payments');
          return;
        }
        
        // Validate bank account for bank payments
        const bankMethods = ['UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'DEBIT_CARD', 'CREDIT_CARD'];
        if (bankMethods.includes(paymentMethod) && !bankAccountId) {
          setError('Bank account must be selected in Cash Register form for bank payments');
          return;
        }
        
        // Process payment using Cash Register's selected values
        const paymentRequest = {
          customerId,
          customerName,
          invoiceIds,
          requestedPaymentAmount: requestedAmount,
          paymentMethod: paymentMethod,
          cashRegisterId: paymentMethod === 'CASH' ? cashRegisterId : undefined,
          bankAccountId: bankMethods.includes(paymentMethod) ? bankAccountId : undefined,
          registrationDate,
          description,
          useExistingCredit: true
        };
        
        const response = await axios.post('/customer-credit-aware-payment/process', paymentRequest);
        
        if (response.data.success) {
          onSuccess();
          onClose();
        } else {
          setError(response.data.message || 'Payment processing failed');
        }
      }
    } catch (error: any) {
      console.error('Error processing customer payment:', error);
      
      // Handle specific validation errors
      if (error.response?.data?.error?.includes('sufficient credit')) {
        setError(error.response.data.error);
      } else if (error.response?.data?.error?.includes('Amount') && error.response?.data?.error?.includes('Invoice')) {
        setError(error.response.data.error);
      } else {
        setError(error.response?.data?.error || 'Payment processing failed');
      }
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
                {paymentMethod === 'CASH' && cashRegisterId && (
                  <div className="col-span-2">
                    <span className="text-green-700">Cash Register:</span>
                    <span className="ml-2 font-medium">
                      {cashRegisters.find(r => r.id === cashRegisterId)?.name || `ID: ${cashRegisterId}`}
                    </span>
                  </div>
                )}
                {bankAccountId && (
                  <div className="col-span-2">
                    <span className="text-green-700">Bank Account:</span>
                    <span className="ml-2 font-medium">
                      {bankAccounts.find(a => a.id === bankAccountId)?.bankName || `ID: ${bankAccountId}`}
                    </span>
                  </div>
                )}
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

                {/* Payment Method Display - Show Cash Register's selected values */}
                {preview && preview.paymentTypeRequired && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-3 flex items-center">
                      <FaMoneyBillWave className="mr-2" />
                      Cash Register Payment Configuration
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">Selected Payment Method:</span>
                          <span className="font-medium text-blue-800">{paymentMethod}</span>
                        </div>
                      </div>
                      
                      {paymentMethod === 'CASH' && cashRegisterId && (
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-blue-700">Cash Register:</span>
                            <span className="font-medium text-blue-800">
                              {cashRegisters.find(r => r.id === cashRegisterId)?.name || `ID: ${cashRegisterId}`}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {bankAccountId && (
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-blue-700">Bank Account:</span>
                            <span className="font-medium text-blue-800">
                              {bankAccounts.find(a => a.id === bankAccountId)?.bankName || `ID: ${bankAccountId}`}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-blue-100 rounded p-3">
                        <p className="text-xs text-blue-700">
                          💡 <strong>FULL AMOUNT (₹{formatNumber(requestedAmount)}) will be recorded</strong> in {paymentMethod === 'CASH' ? 'Cash Register' : 'Bank Register'}.
                          Credit portion (₹{formatNumber(preview.creditWillBeUsed)}) will be applied silently in the background.
                        </p>
                        {preview.willCreateNewCredit && (
                          <p className="text-xs text-blue-700 mt-1">
                            ✨ New credit balance of ₹{formatNumber(preview.newCreditAmount)} will be created from overpayment.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Credit-Only Payment Notice */}
                {preview && !preview.paymentTypeRequired && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-medium text-green-900 mb-2 flex items-center">
                      <FaCheckCircle className="mr-2" />
                      Credit-Only Payment
                    </h3>
                    <p className="text-sm text-green-800">
                      This payment will be processed entirely using the customer's existing credit balance. 
                      No payment method or cash register selection is required.
                    </p>
                  </div>
                )}

                {/* Error Display */}
                {preview?.errorMessage && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="font-medium text-red-900 mb-2 flex items-center">
                      <FaInfoCircle className="mr-2" />
                      Payment Not Allowed
                    </h3>
                    <p className="text-sm text-red-800">
                      {preview.errorMessage}
                    </p>
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
              disabled={isLoading || isProcessing || !preview || !!preview?.errorMessage}
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
                  <span>
                    {preview && preview.paymentTypeRequired 
                      ? 'Process Payment' 
                      : 'Process Credit Payment'
                    }
                  </span>
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