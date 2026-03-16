import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Receipt, DollarSign, Calendar, FileText, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import { Supplier } from '../types';
import { formatNumber } from '../utils/formatNumber';
import ExpenseCategoryDropdown from './ExpenseCategoryDropdown';
import ExpenseTypeDropdown from './ExpenseTypeDropdown';

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
    purchaseType: 'Services or other', // Add purchase type for expenses
    // Payment method specific fields
    bankAccountId: '',
    cardId: '',
    chequeNumber: '',
    chequeDate: '',
    transferNumber: '',
    transferDate: '',
    paymentReference: '',
    voucherDate: '',
  });

  const [showAssociatedCosts, setShowAssociatedCosts] = useState(false);
  const [associatedCosts, setAssociatedCosts] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchBankAccounts();
      fetchCards();
    }
  }, [isOpen]);

  const fetchBankAccounts = async () => {
    try {
      const response = await api.get('/bank-accounts');
      setBankAccounts(response.data.filter((acc: any) => acc.status === 'ACTIVE'));
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const fetchCards = async () => {
    try {
      const response = await api.get('/cards');
      setCards(response.data.filter((card: any) => card.status === 'ACTIVE'));
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === parseInt(supplierId));
    setFormData({
      ...formData,
      supplierId,
      supplierName: supplier?.name || ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Validation
    if (!formData.supplierId) {
      alert('Please select a supplier');
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (!formData.expenseCategoryId || formData.expenseCategoryId === 0) {
      alert('Please select an expense category');
      return;
    }
    
    if (!formData.expenseTypeId || formData.expenseTypeId === 0) {
      alert('Please select an expense type');
      return;
    }

    // Payment method validation
    const paymentType = formData.paymentType.toUpperCase();
    
    if (paymentType === 'CHEQUE') {
      if (!formData.bankAccountId || !formData.chequeNumber || !formData.chequeDate) {
        alert('Please fill in all cheque payment details');
        return;
      }
    }
    
    if (paymentType === 'BANK_TRANSFER') {
      if (!formData.bankAccountId || !formData.transferNumber || !formData.transferDate) {
        alert('Please fill in all bank transfer details');
        return;
      }
    }
    
    if (paymentType === 'CREDIT_CARD' || paymentType === 'DEBIT_CARD') {
      if (!formData.cardId || !formData.paymentReference || !formData.voucherDate) {
        alert('Please fill in all card payment details');
        return;
      }
    }

    try {
      const totalAmount = parseFloat(formData.amount);
      const associatedTotal = associatedCosts.reduce((sum, cost) => sum + parseFloat(cost.amount || '0'), 0);
      const grandTotal = totalAmount + associatedTotal;

      // Calculate payment amounts based on payment type
      // Immediate payment methods: BANK_TRANSFER, CHEQUE, DEBIT_CARD, CASH
      // Credit payment methods: CREDIT, CREDIT_CARD
      const immediatePaymentTypes = ['BANK_TRANSFER', 'CHEQUE', 'DEBIT_CARD', 'CASH'];
      const isImmediatePayment = immediatePaymentTypes.includes(formData.paymentType.toUpperCase());
      
      const expenseData = {
        date: formData.date,
        supplierId: parseInt(formData.supplierId),
        supplierRnc: suppliers.find(s => s.id === parseInt(formData.supplierId))?.rnc || '',
        expenseCategoryId: parseInt(formData.expenseCategoryId.toString()),
        expenseTypeId: parseInt(formData.expenseTypeId.toString()),
        description: formData.description,
        amount: grandTotal,
        expenseType: formData.purchaseType, // Use selected expense type
        paymentType: formData.paymentType,
        paidAmount: isImmediatePayment ? grandTotal : 0,
        balanceAmount: isImmediatePayment ? 0 : grandTotal,
        
        // Payment method specific fields
        bankAccountId: formData.bankAccountId ? parseInt(formData.bankAccountId) : null,
        cardId: formData.cardId ? parseInt(formData.cardId) : null,
        chequeNumber: formData.chequeNumber || null,
        chequeDate: formData.chequeDate || null,
        transferNumber: formData.transferNumber || null,
        transferDate: formData.transferDate || null,
        paymentReference: formData.paymentReference || null,
        voucherDate: formData.voucherDate || null,
        
        // Associated costs
        associatedCosts: associatedCosts.map(cost => ({
          supplierRnc: cost.supplierRnc || '',
          supplierName: cost.supplierName || '',
          concept: cost.concept || 'Associated cost',
          ncf: cost.ncf || 'N/A',
          date: cost.date || formData.date,
          amount: parseFloat(cost.amount || '0'),
          expenseType: formData.purchaseType, // Use selected expense type
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
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      supplierId: '',
      supplierName: '',
      amount: '',
      expenseCategoryId: 0,
      expenseTypeId: 0,
      description: '',
      paymentType: 'CREDIT',
      purchaseType: 'Services or other', // Reset to default
      bankAccountId: '',
      cardId: '',
      chequeNumber: '',
      chequeDate: '',
      transferNumber: '',
      transferDate: '',
      paymentReference: '',
      voucherDate: '',
    });
    setShowAssociatedCosts(false);
    setAssociatedCosts([]);
  };

  const addAssociatedCost = () => {
    setAssociatedCosts([...associatedCosts, {
      concept: '',
      amount: '',
      supplierName: '',
      supplierRnc: '',
      paymentType: 'CREDIT',
      date: formData.date
    }]);
  };

  const removeAssociatedCost = (index: number) => {
    setAssociatedCosts(associatedCosts.filter((_, i) => i !== index));
  };

  const updateAssociatedCost = (index: number, field: string, value: string) => {
    const updated = [...associatedCosts];
    updated[index] = { ...updated[index], [field]: value };
    setAssociatedCosts(updated);
  };

  const calculateTotal = () => {
    const mainAmount = parseFloat(formData.amount || '0');
    const associatedTotal = associatedCosts.reduce((sum, cost) => sum + parseFloat(cost.amount || '0'), 0);
    return mainAmount + associatedTotal;
  };

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
            {/* Main Expense Fields - Simple & Clean */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier *
                </label>
                <select
                  required
                  value={formData.supplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select supplier...</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
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
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                  onChange={(categoryId) => setFormData({ 
                    ...formData, 
                    expenseCategoryId: categoryId, 
                    expenseTypeId: 0 
                  })}
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
                  onChange={(typeId) => setFormData({ ...formData, expenseTypeId: typeId })}
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
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, paymentType: e.target.value, cardId: '', bankAccountId: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="CREDIT">Credit (Pay Later)</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Type *
                </label>
                <select
                  required
                  value={formData.purchaseType || 'Services or other'}
                  onChange={(e) => setFormData({ ...formData, purchaseType: e.target.value })}
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

            {/* Payment Method Specific Fields */}
            {formData.paymentType === 'CHEQUE' && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account *</label>
                  <select
                    required
                    value={formData.bankAccountId}
                    onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select account...</option>
                    {bankAccounts.map((account: any) => (
                      <option key={account.id} value={account.id}>
                        {account.bankName} - {account.accountNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.chequeNumber}
                    onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.chequeDate}
                    onChange={(e) => setFormData({ ...formData, chequeDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {formData.paymentType === 'BANK_TRANSFER' && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account *</label>
                  <select
                    required
                    value={formData.bankAccountId}
                    onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select account...</option>
                    {bankAccounts.map((account: any) => (
                      <option key={account.id} value={account.id}>
                        {account.bankName} - {account.accountNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.transferNumber}
                    onChange={(e) => setFormData({ ...formData, transferNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.transferDate}
                    onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {(formData.paymentType === 'CREDIT_CARD' || formData.paymentType === 'DEBIT_CARD') && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-purple-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.paymentType === 'CREDIT_CARD' ? 'Credit Card' : 'Debit Card'} *
                  </label>
                  <select
                    required
                    value={formData.cardId}
                    onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select card...</option>
                    {cards
                      .filter((card: any) => card.cardType === (formData.paymentType === 'CREDIT_CARD' ? 'CREDIT' : 'DEBIT'))
                      .map((card: any) => (
                        <option key={card.id} value={card.id}>
                          {card.cardName || `${card.cardBrand} ****${card.cardNumberLast4}`}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference *</label>
                  <input
                    type="text"
                    required
                    value={formData.paymentReference}
                    onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.voucherDate}
                    onChange={(e) => setFormData({ ...formData, voucherDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Optional Associated Costs - Hidden by Default */}
            <div className="border-t pt-4">
              <button
                type="button"
                onClick={() => setShowAssociatedCosts(!showAssociatedCosts)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Plus size={16} />
                Add Associated Costs (Optional)
                <ChevronDown 
                  size={16} 
                  className={`transform transition-transform ${showAssociatedCosts ? 'rotate-180' : ''}`} 
                />
              </button>

              <AnimatePresence>
                {showAssociatedCosts && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-700">Associated Costs</h4>
                      <button
                        type="button"
                        onClick={addAssociatedCost}
                        className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                      >
                        + Add Cost
                      </button>
                    </div>

                    {associatedCosts.map((cost, index) => (
                      <div key={index} className="grid grid-cols-4 gap-3 mb-3 p-3 bg-white rounded border">
                        <input
                          type="text"
                          placeholder="Description"
                          value={cost.concept}
                          onChange={(e) => updateAssociatedCost(index, 'concept', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          value={cost.amount}
                          onChange={(e) => updateAssociatedCost(index, 'amount', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Supplier"
                          value={cost.supplierName}
                          onChange={(e) => updateAssociatedCost(index, 'supplierName', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeAssociatedCost(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Total Summary */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatNumber(calculateTotal())}
                </span>
              </div>
              {associatedCosts.length > 0 && (
                <div className="text-sm text-gray-600 mt-1">
                  Main: {formatNumber(parseFloat(formData.amount || '0'))} + 
                  Associated: {formatNumber(associatedCosts.reduce((sum, cost) => sum + parseFloat(cost.amount || '0'), 0))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : `Create Expense - ${formatNumber(calculateTotal())}`}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SimpleExpenseForm;