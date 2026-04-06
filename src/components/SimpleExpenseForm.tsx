import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Receipt, DollarSign, Calendar, FileText } from 'lucide-react';
import { Supplier } from '../types';
import ExpenseCategoryDropdown from './ExpenseCategoryDropdown';
import ExpenseTypeDropdown from './ExpenseTypeDropdown';

// ✅ OPTIMIZATION: Use React Query hooks
import { useBankAccounts, useCards } from '../hooks/queries/useSharedData';

// ✅ Import shared components for Phase 1 refactoring
import { SupplierSelector, BankAccountSelector, CardSelector } from './shared';

interface SimpleExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: any) => void;
  suppliers: Supplier[];
  isSubmitting?: boolean;
}

const SimpleExpenseForm = ({
  isOpen,
  onClose,
  onSubmit,
  suppliers,
  isSubmitting = false
}: SimpleExpenseFormProps) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    supplierName: '',
    amount: '',
    expenseCategoryId: 0,
    expenseTypeId: 0,
    description: '',
    paymentType: 'CREDIT',
    purchaseType: 'Services or other',
    bankAccountId: '',
    cardId: '',
    chequeNumber: '',
    chequeDate: '',
    transferNumber: '',
    transferDate: '',
    paymentReference: '',
    voucherDate: '',
  });

  const [associatedCosts, setAssociatedCosts] = useState<any[]>([]);

  // ✅ OPTIMIZATION: Use React Query instead of manual API calls
  const { data: allBankAccounts = [] } = useBankAccounts();
  const { data: allCards = [] } = useCards();

  // ✅ OPTIMIZATION: Memoized filtered data
  const bankAccounts = useMemo(() => 
    allBankAccounts.filter((acc: any) => acc.status === 'ACTIVE'),
    [allBankAccounts]
  );

  const cards = useMemo(() => 
    allCards.filter((card: any) => card.status === 'ACTIVE'),
    [allCards]
  );

  // ✅ OPTIMIZATION: Memoized total calculation
  const calculateTotal = useCallback(() => {
    const mainAmount = parseFloat(formData.amount || '0');
    const associatedTotal = associatedCosts.reduce((sum, cost) => sum + parseFloat(cost.amount || '0'), 0);
    return mainAmount + associatedTotal;
  }, [formData.amount, associatedCosts]);

  // ✅ OPTIMIZATION: Memoized validation
  const validateForm = useCallback(() => {
    if (!formData.supplierId) {
      alert('Please select a supplier');
      return false;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return false;
    }
    
    if (!formData.expenseCategoryId || formData.expenseCategoryId === 0) {
      alert('Please select an expense category');
      return false;
    }
    
    if (!formData.expenseTypeId || formData.expenseTypeId === 0) {
      alert('Please select an expense type');
      return false;
    }

    const paymentType = formData.paymentType.toUpperCase();
    const bankPaymentMethods = ['CHEQUE', 'CHECK', 'BANK_TRANSFER', 'DEPOSIT', 'BANK_DEPOSIT'];
    const cardPaymentMethods = ['CREDIT_CARD', 'DEBIT_CARD'];
    
    if (bankPaymentMethods.includes(paymentType)) {
      if (!formData.bankAccountId) {
        alert('Please select a bank account for this payment method');
        return false;
      }
      
      const selectedBankAccount = bankAccounts.find(acc => acc.id === parseInt(formData.bankAccountId));
      if (selectedBankAccount) {
        const availableBalance = Number(selectedBankAccount.balance || 0);
        const grandTotal = calculateTotal();
        
        if (availableBalance < grandTotal) {
          alert(`Insufficient balance in ${selectedBankAccount.bankName} (${selectedBankAccount.accountNumber}). Available: ₹${availableBalance.toFixed(2)}, Required: ₹${grandTotal.toFixed(2)}`);
          return false;
        }
      }
      
      if ((paymentType === 'CHEQUE' || paymentType === 'CHECK') && (!formData.chequeNumber || !formData.chequeDate)) {
        alert('Please fill in cheque number and date');
        return false;
      }
      
      if (paymentType === 'BANK_TRANSFER' && (!formData.transferNumber || !formData.transferDate)) {
        alert('Please fill in transfer number and date');
        return false;
      }
    }
    
    if (cardPaymentMethods.includes(paymentType)) {
      if (!formData.cardId || !formData.paymentReference || !formData.voucherDate) {
        alert('Please fill in all card payment details');
        return false;
      }
      
      if (paymentType === 'CREDIT_CARD') {
        const selectedCard = cards.find(card => card.id === parseInt(formData.cardId));
        if (selectedCard && selectedCard.cardType === 'CREDIT') {
          const creditLimit = Number(selectedCard.creditLimit || 0);
          const usedCredit = Number(selectedCard.usedCredit || 0);
          const availableCredit = creditLimit - usedCredit;
          const grandTotal = calculateTotal();
          
          if (availableCredit < grandTotal) {
            alert(`Insufficient credit limit on ${selectedCard.cardName || 'Credit Card'}. Available: ₹${availableCredit.toFixed(2)}, Required: ₹${grandTotal.toFixed(2)}`);
            return false;
          }
        }
      }
    }

    return true;
  }, [formData, bankAccounts, cards, calculateTotal]);

  // ✅ OPTIMIZATION: Memoized submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    if (!validateForm()) return;

    try {
      const grandTotal = calculateTotal();
      const immediatePaymentTypes = ['BANK_TRANSFER', 'CHEQUE', 'CHECK', 'DEPOSIT', 'BANK_DEPOSIT', 'DEBIT_CARD', 'CASH'];
      const isImmediatePayment = immediatePaymentTypes.includes(formData.paymentType.toUpperCase());
      
      const expenseData = {
        date: formData.date,
        supplierId: parseInt(formData.supplierId),
        supplierRnc: suppliers.find(s => s.id === parseInt(formData.supplierId))?.rnc || '',
        expenseCategoryId: parseInt(formData.expenseCategoryId.toString()),
        expenseTypeId: parseInt(formData.expenseTypeId.toString()),
        description: formData.description,
        amount: grandTotal,
        expenseType: formData.purchaseType,
        paymentType: formData.paymentType,
        paidAmount: isImmediatePayment ? grandTotal : 0,
        balanceAmount: isImmediatePayment ? 0 : grandTotal,
        bankAccountId: formData.bankAccountId ? parseInt(formData.bankAccountId) : null,
        cardId: formData.cardId ? parseInt(formData.cardId) : null,
        chequeNumber: formData.chequeNumber || null,
        chequeDate: formData.chequeDate || null,
        transferNumber: formData.transferNumber || null,
        transferDate: formData.transferDate || null,
        paymentReference: formData.paymentReference || null,
        voucherDate: formData.voucherDate || null,
        associatedCosts: associatedCosts.map(cost => ({
          supplierRnc: cost.supplierRnc || '',
          supplierName: cost.supplierName || '',
          concept: cost.concept || 'Associated cost',
          ncf: cost.ncf || 'N/A',
          date: cost.date || formData.date,
          amount: parseFloat(cost.amount || '0'),
          expenseType: formData.purchaseType,
          paymentType: cost.paymentType || 'CREDIT',
          cardId: cost.cardId ? parseInt(cost.cardId) : null,
          bankAccountId: cost.bankAccountId ? parseInt(cost.bankAccountId) : null
        }))
      };

      onSubmit(expenseData);
      resetForm();
    } catch (error: any) {
      console.error('Error creating expense:', error);
      alert(error.response?.data?.error || 'Error creating expense');
    }
  }, [formData, suppliers, associatedCosts, isSubmitting, validateForm, calculateTotal, onSubmit]);

  // ✅ OPTIMIZATION: Memoized reset handler
  const resetForm = useCallback(() => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      supplierId: '',
      supplierName: '',
      amount: '',
      expenseCategoryId: 0,
      expenseTypeId: 0,
      description: '',
      paymentType: 'CREDIT',
      purchaseType: 'Services or other',
      bankAccountId: '',
      cardId: '',
      chequeNumber: '',
      chequeDate: '',
      transferNumber: '',
      transferDate: '',
      paymentReference: '',
      voucherDate: '',
    });
    setAssociatedCosts([]);
  }, []);

  if (!isOpen) return null;

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
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Receipt className="text-green-600" />
              Create Expense
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Main Expense Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <SupplierSelector
                  value={formData.supplierId}
                  onChange={(value, supplier) => {
                    setFormData(prev => ({
                      ...prev,
                      supplierId: value,
                      supplierName: supplier?.name || ''
                    }));
                  }}
                  required
                  label="Supplier"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Category *
                </label>
                <ExpenseCategoryDropdown
                  value={formData.expenseCategoryId}
                  onChange={(categoryId) => setFormData(prev => ({ 
                    ...prev, 
                    expenseCategoryId: categoryId, 
                    expenseTypeId: 0 
                  }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Type *
                </label>
                <ExpenseTypeDropdown
                  categoryId={formData.expenseCategoryId || undefined}
                  value={formData.expenseTypeId}
                  onChange={(typeId) => setFormData(prev => ({ ...prev, expenseTypeId: typeId }))}
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows={2}
                    placeholder="Brief description of the expense..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <select
                  required
                  value={formData.paymentType}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentType: e.target.value, cardId: '', bankAccountId: '' }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="CREDIT">Credit (Pay Later)</option>
                  <optgroup label="Bank Payments (Immediate)">
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CHECK">Check</option>
                    <option value="DEPOSIT">Bank Deposit</option>
                  </optgroup>
                  <optgroup label="Card Payments">
                    <option value="DEBIT_CARD">Debit Card (Immediate)</option>
                    <option value="CREDIT_CARD">Credit Card (Creates Payable)</option>
                  </optgroup>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  💡 Bank payments → Expense + Bank Register | Credit payments → Expense + Accounts Payable
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Type *
                </label>
                <select
                  required
                  value={formData.purchaseType || 'Services or other'}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseType: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="Services or other">Services or Other</option>
                  <option value="Prepaid expenses">Prepaid Expenses</option>
                  <option value="Policies and guarantee">Policies and Guarantee</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  💡 For physical goods/inventory, use the Purchases page
                </p>
              </div>
            </div>

            {/* Bank Payment Methods */}
            {['CHEQUE', 'CHECK', 'BANK_TRANSFER', 'DEPOSIT', 'BANK_DEPOSIT'].includes(formData.paymentType) && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  {formData.paymentType === 'CHEQUE' || formData.paymentType === 'CHECK' ? 'Check Payment Details' :
                   formData.paymentType === 'BANK_TRANSFER' ? 'Bank Transfer Details' :
                   'Bank Deposit Details'}
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <BankAccountSelector
                      value={formData.bankAccountId}
                      onChange={(value) => setFormData(prev => ({ ...prev, bankAccountId: value }))}
                      required
                      showBalance
                      label="Bank Account"
                    />
                  </div>

                  {(formData.paymentType === 'CHEQUE' || formData.paymentType === 'CHECK') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Check Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.chequeNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, chequeNumber: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          placeholder="Enter check number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Check Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.chequeDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, chequeDate: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </>
                  )}

                  {formData.paymentType === 'BANK_TRANSFER' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Transfer Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.transferNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, transferNumber: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          placeholder="Enter transfer reference"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Transfer Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.transferDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, transferDate: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Card Payment Methods */}
            {['CREDIT_CARD', 'DEBIT_CARD'].includes(formData.paymentType) && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  {formData.paymentType === 'CREDIT_CARD' ? 'Credit Card Payment Details' : 'Debit Card Payment Details'}
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <CardSelector
                      value={formData.cardId}
                      onChange={(value) => setFormData(prev => ({ ...prev, cardId: value }))}
                      cardType={formData.paymentType === 'CREDIT_CARD' ? 'CREDIT' : 'DEBIT'}
                      required
                      showAvailableLimit={formData.paymentType === 'CREDIT_CARD'}
                      label="Card"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Reference *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.paymentReference}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentReference: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Transaction ID or reference"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Voucher Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.voucherDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, voucherDate: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Total Display */}
            {associatedCosts.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Grand Total:</span>
                  <span className="text-green-600">₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Expense'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SimpleExpenseForm;
