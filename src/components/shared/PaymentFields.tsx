/**
 * ============================================================================
 * PAYMENT FIELDS COMPONENT - REUSABLE ACROSS ALL MODULES
 * ============================================================================
 * 
 * This component eliminates code duplication across:
 * - Fixed Assets
 * - Investments
 * - Prepaid Expenses
 * - Purchases
 * - Business Expenses
 * 
 * Architecture: Single Responsibility Principle + DRY
 * 
 * @author Senior Developer
 * @date 2026-05-04
 */

import React from 'react';
import { CreditCard } from 'lucide-react';
import BankAccountSelector from './BankAccountSelector';
import CardSelector from './CardSelector';

interface PaymentFieldsProps {
  // Payment type
  paymentType: string;
  onPaymentTypeChange: (value: string) => void;
  
  // Bank account fields
  bankAccountId: string | number;
  onBankAccountChange: (value: string) => void;
  
  // Card fields
  cardId: string | number;
  onCardChange: (value: string) => void;
  
  // Cheque fields
  chequeNumber: string;
  onChequeNumberChange: (value: string) => void;
  chequeDate: string;
  onChequeDateChange: (value: string) => void;
  
  // Bank transfer fields
  transferNumber: string;
  onTransferNumberChange: (value: string) => void;
  transferDate: string;
  onTransferDateChange: (value: string) => void;
  
  // Card payment fields
  paymentReference: string;
  onPaymentReferenceChange: (value: string) => void;
  voucherDate: string;
  onVoucherDateChange: (value: string) => void;
  
  // Validation errors
  errors?: {
    paymentType?: string;
    bankAccountId?: string;
    cardId?: string;
    chequeNumber?: string;
    chequeDate?: string;
    transferNumber?: string;
    transferDate?: string;
    paymentReference?: string;
    voucherDate?: string;
  };
  
  // Optional customization
  showCreditOption?: boolean;
  showCashOption?: boolean;
  className?: string;
}

const PaymentFields: React.FC<PaymentFieldsProps> = ({
  paymentType,
  onPaymentTypeChange,
  bankAccountId,
  onBankAccountChange,
  cardId,
  onCardChange,
  chequeNumber,
  onChequeNumberChange,
  chequeDate,
  onChequeDateChange,
  transferNumber,
  onTransferNumberChange,
  transferDate,
  onTransferDateChange,
  paymentReference,
  onPaymentReferenceChange,
  voucherDate,
  onVoucherDateChange,
  errors = {},
  showCreditOption = true,
  showCashOption = false,
  className = '',
}) => {
  return (
    <div className={className}>
      {/* Payment Type Section Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
          <CreditCard size={20} className="text-blue-600" />
          Payment Information
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Type Dropdown */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Type <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={paymentType}
            onChange={(e) => onPaymentTypeChange(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.paymentType ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select payment type...</option>
            {showCreditOption && <option value="CREDIT">Credit (Pay Later)</option>}
            {showCashOption && <option value="CASH">Cash</option>}
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
            <option value="DEBIT_CARD">Debit Card</option>
            <option value="CREDIT_CARD">Credit Card</option>
          </select>
          {errors.paymentType && (
            <p className="mt-1 text-sm text-red-600">{errors.paymentType}</p>
          )}
          
          {/* Payment Type Hints */}
          {paymentType === 'CREDIT' && (
            <p className="text-xs text-blue-600 mt-1">
              💡 Creates Accounts Payable - Pay supplier later
            </p>
          )}
          {paymentType === 'CREDIT_CARD' && (
            <p className="text-xs text-orange-600 mt-1">
              💳 Creates Accounts Payable - Pay card company later
            </p>
          )}
          {(paymentType === 'BANK_TRANSFER' || paymentType === 'CHEQUE' || paymentType === 'DEBIT_CARD') && (
            <p className="text-xs text-green-600 mt-1">
              ✅ Money deducted from bank account immediately
            </p>
          )}
        </div>

        {/* CHEQUE Payment Fields */}
        {paymentType === 'CHEQUE' && (
          <>
            <div className="col-span-2">
              <BankAccountSelector
                value={bankAccountId}
                onChange={onBankAccountChange}
                required
                showBalance
                label="Bank Account"
                error={errors.bankAccountId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cheque Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={chequeNumber}
                onChange={(e) => onChequeNumberChange(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.chequeNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter cheque number"
              />
              {errors.chequeNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.chequeNumber}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cheque Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={chequeDate}
                onChange={(e) => onChequeDateChange(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.chequeDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.chequeDate && (
                <p className="mt-1 text-sm text-red-600">{errors.chequeDate}</p>
              )}
            </div>
          </>
        )}

        {/* BANK_TRANSFER Payment Fields */}
        {paymentType === 'BANK_TRANSFER' && (
          <>
            <div className="col-span-2">
              <BankAccountSelector
                value={bankAccountId}
                onChange={onBankAccountChange}
                required
                showBalance
                label="Bank Account"
                error={errors.bankAccountId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={transferNumber}
                onChange={(e) => onTransferNumberChange(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.transferNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter transfer reference number"
              />
              {errors.transferNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.transferNumber}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={transferDate}
                onChange={(e) => onTransferDateChange(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.transferDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.transferDate && (
                <p className="mt-1 text-sm text-red-600">{errors.transferDate}</p>
              )}
            </div>
          </>
        )}

        {/* DEBIT_CARD Payment Fields */}
        {paymentType === 'DEBIT_CARD' && (
          <>
            <div className="col-span-2">
              <CardSelector
                value={cardId}
                onChange={onCardChange}
                cardType="DEBIT"
                required
                label="Select Debit Card"
                showAvailableLimit={false}
                error={errors.cardId}
              />
              <p className="text-xs text-gray-500 mt-1">
                💳 DEBIT: Money deducted from linked bank account immediately
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Reference/Voucher <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={paymentReference}
                onChange={(e) => onPaymentReferenceChange(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.paymentReference ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter voucher/authorization number"
              />
              {errors.paymentReference && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentReference}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voucher Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={voucherDate}
                onChange={(e) => onVoucherDateChange(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.voucherDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.voucherDate && (
                <p className="mt-1 text-sm text-red-600">{errors.voucherDate}</p>
              )}
            </div>
          </>
        )}

        {/* CREDIT_CARD Payment Fields */}
        {paymentType === 'CREDIT_CARD' && (
          <>
            <div className="col-span-2">
              <CardSelector
                value={cardId}
                onChange={onCardChange}
                cardType="CREDIT"
                required
                label="Select Credit Card"
                showAvailableLimit={true}
                error={errors.cardId}
              />
              <p className="text-xs text-gray-500 mt-1">
                💳 CREDIT: Creates Accounts Payable - Pay card company later
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Reference/Voucher <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={paymentReference}
                onChange={(e) => onPaymentReferenceChange(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.paymentReference ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter voucher/authorization number"
              />
              {errors.paymentReference && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentReference}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voucher Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={voucherDate}
                onChange={(e) => onVoucherDateChange(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.voucherDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.voucherDate && (
                <p className="mt-1 text-sm text-red-600">{errors.voucherDate}</p>
              )}
            </div>
          </>
        )}

        {/* CREDIT Payment - No additional fields needed */}
        {paymentType === 'CREDIT' && (
          <div className="col-span-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Credit Payment:</strong> This will create an Accounts Payable entry. 
                You can pay the supplier later through the Accounts Payable module.
              </p>
            </div>
          </div>
        )}

        {/* CASH Payment - No additional fields needed */}
        {paymentType === 'CASH' && (
          <div className="col-span-2">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Cash Payment:</strong> This will reduce your cash register balance immediately.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentFields;
