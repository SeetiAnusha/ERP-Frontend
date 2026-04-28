import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, DollarSign, CreditCard, User } from 'lucide-react';
import { formatNumber } from '../utils/formatNumber';

interface OverpaymentAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onAdjust: () => void;
  data: {
    paymentAmount: number;
    outstandingBalance: number;
    overpaymentAmount: number;
    entityName: string;
    entityType: 'CUSTOMER' | 'SUPPLIER';
    message: string;
  };
}

const OverpaymentAlertModal: React.FC<OverpaymentAlertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onAdjust,
  data
}) => {
  if (!isOpen) return null;

  const entityIcon = data.entityType === 'CUSTOMER' ? User : CreditCard;
  const entityColor = data.entityType === 'CUSTOMER' ? 'blue' : 'green';
  const entityLabel = data.entityType === 'CUSTOMER' ? 'Customer' : 'Supplier';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-orange-100 rounded-full">
            <AlertTriangle className="text-orange-600" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Overpayment Detected</h3>
            <p className="text-sm text-gray-600">Payment exceeds outstanding balance</p>
          </div>
        </div>

        {/* Entity Information */}
        <div className={`bg-${entityColor}-50 border border-${entityColor}-200 rounded-lg p-4 mb-6`}>
          <div className="flex items-center gap-2 mb-2">
            {React.createElement(entityIcon, { className: `text-${entityColor}-600`, size: 20 })}
            <span className={`text-sm font-medium text-${entityColor}-800`}>{entityLabel}</span>
          </div>
          <p className="font-semibold text-gray-900">{data.entityName}</p>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Payment Breakdown</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Outstanding Balance:</span>
              <span className="font-semibold text-gray-900">
                ₹{formatNumber(data.outstandingBalance)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Payment Amount:</span>
              <span className="font-semibold text-blue-600">
                ₹{formatNumber(data.paymentAmount)}
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-orange-600">Overpayment:</span>
                <span className="font-bold text-orange-600">
                  ₹{formatNumber(data.overpaymentAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-900 mb-2">What happens if you proceed?</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <DollarSign size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                ₹{formatNumber(data.outstandingBalance)} will be applied to the outstanding balance
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CreditCard size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                ₹{formatNumber(data.overpaymentAmount)} will be created as a credit balance for future use
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onAdjust}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Adjust Payment
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            Create Credit Balance
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </motion.div>
    </div>
  );
};

export default OverpaymentAlertModal;