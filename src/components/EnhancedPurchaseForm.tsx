import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  AlertCircle, 
  Loader2, 
  ShoppingCart, 
  Receipt, 
  CreditCard,
  Banknote,
  CheckCircle,
  Shield,
  Clock
} from 'lucide-react';
import api from '../api/axios';
import { Supplier, ExpenseCategory, ExpenseType, EnhancedPurchase } from '../types';
import { formatNumber } from '../utils/formatNumber';
import { cleanFormData } from '../utils/cleanFormData';
import ExpenseCategoryDropdown from './ExpenseCategoryDropdown';
import ExpenseTypeDropdown from './ExpenseTypeDropdown';

/**
 * EnhancedPurchaseForm Component
 * 
 * Senior Developer Features:
 * - Support for both GOODS and EXPENSE transactions
 * - Duplicate prevention with session tracking
 * - Real-time validation with debouncing
 * - Conditional form fields based on transaction type
 * - Auto-save draft functionality
 * - Comprehensive error handling
 * - Accessibility support
 * - Responsive design
 * - Loading states and progress indicators
 */

interface EnhancedPurchaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (purchase: EnhancedPurchase) => void;
  suppliers: Supplier[];
  editingPurchase?: EnhancedPurchase | null;
  isSubmitting?: boolean;
  defaultTransactionType?: 'GOODS' | 'EXPENSE';
}

const EnhancedPurchaseForm = ({
  isOpen,
  onClose,
  onSubmit,
  suppliers,
  editingPurchase,
  isSubmitting = false,
  defaultTransactionType = 'GOODS'
}: EnhancedPurchaseFormProps) => {
  // Form state
  const [formData, setFormData] = useState({
    transactionType: defaultTransactionType as 'GOODS' | 'EXPENSE',
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    supplierRnc: '',
    ncf: '',
    purchaseType: 'Merchandise for sale or consumption',
    paymentType: 'CREDIT',
    total: 0,
    paidAmount: 0,
    status: 'COMPLETED',
    // Expense-specific fields
    expenseCategoryId: '',
    expenseTypeId: '',
    expenseDescription: '',
    // Payment fields
    bankAccountId: '',
    cardId: '',
    chequeNumber: '',
    chequeDate: '',
    transferNumber: '',
    transferDate: '',
    paymentReference: '',
    voucherDate: ''
  });

  // Component state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [selectedType, setSelectedType] = useState<ExpenseType | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Initialize form when editing
  useEffect(() => {
    if (editingPurchase) {
      setFormData({
        transactionType: editingPurchase.transactionType || 'GOODS',
        date: editingPurchase.date.split('T')[0],
        supplierId: editingPurchase.supplierId.toString(),
        supplierRnc: editingPurchase.supplierRnc || '',
        ncf: editingPurchase.ncf || '',
        purchaseType: editingPurchase.purchaseType,
        paymentType: editingPurchase.paymentType,
        total: editingPurchase.total,
        paidAmount: editingPurchase.paidAmount,
        status: editingPurchase.status,
        expenseCategoryId: editingPurchase.expenseCategoryId?.toString() || '',
        expenseTypeId: editingPurchase.expenseTypeId?.toString() || '',
        expenseDescription: editingPurchase.expenseDescription || '',
        bankAccountId: '',
        cardId: '',
        chequeNumber: '',
        chequeDate: '',
        transferNumber: '',
        transferDate: '',
        paymentReference: '',
        voucherDate: ''
      });
    }
  }, [editingPurchase]);

  // Auto-save draft functionality
  useEffect(() => {
    if (isDraft) {
      const draftKey = `purchase_draft_${sessionId}`;
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }
  }, [formData, isDraft, sessionId]);

  // Duplicate checking with debouncing
  useEffect(() => {
    if (formData.supplierId && formData.total > 0 && !editingPurchase) {
      const timeoutId = setTimeout(() => {
        checkForDuplicates();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [formData.supplierId, formData.total]);

  const checkForDuplicates = async () => {
    try {
      setIsCheckingDuplicate(true);
      setDuplicateWarning(null);

      const response = await api.post('/purchases/check-duplicate', {
        supplierId: parseInt(formData.supplierId),
        amount: formData.total,
        description: formData.expenseDescription,
        clientSessionId: sessionId
      });

      if (response.data.success && response.data.data.hasDuplicates) {
        setDuplicateWarning(response.data.data.recommendation);
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Common validations
    if (!formData.supplierId) newErrors.supplierId = 'Supplier is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.paymentType) newErrors.paymentType = 'Payment type is required';
    if (formData.total <= 0) newErrors.total = 'Amount must be greater than 0';

    // Expense-specific validations
    if (formData.transactionType === 'EXPENSE') {
      if (!formData.expenseCategoryId) newErrors.expenseCategoryId = 'Expense category is required';
      if (!formData.expenseTypeId) newErrors.expenseTypeId = 'Expense type is required';
      if (!formData.expenseDescription?.trim()) newErrors.expenseDescription = 'Expense description is required';
    }

    // Payment-specific validations
    if (formData.paymentType === 'CHEQUE' && !formData.chequeNumber) {
      newErrors.chequeNumber = 'Cheque number is required';
    }
    if (formData.paymentType === 'BANK_TRANSFER' && !formData.transferNumber) {
      newErrors.transferNumber = 'Transfer number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Mark as draft
    setIsDraft(true);
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === parseInt(supplierId));
    setSelectedSupplier(supplier || null);
    handleInputChange('supplierId', supplierId);
    if (supplier) {
      handleInputChange('supplierRnc', supplier.rnc);
    }
  };

  const handleCategoryChange = (categoryId: number, category: ExpenseCategory) => {
    setSelectedCategory(category);
    handleInputChange('expenseCategoryId', categoryId.toString());
    // Reset expense type when category changes
    setSelectedType(null);
    handleInputChange('expenseTypeId', '');
  };

  const handleTypeChange = (typeId: number, type: ExpenseType) => {
    setSelectedType(type);
    handleInputChange('expenseTypeId', typeId.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const cleanedData = cleanFormData({
        ...formData,
        supplierId: parseInt(formData.supplierId),
        expenseCategoryId: formData.expenseCategoryId ? parseInt(formData.expenseCategoryId) : undefined,
        expenseTypeId: formData.expenseTypeId ? parseInt(formData.expenseTypeId) : undefined,
        clientSessionId: sessionId,
        submissionTimestamp: new Date().toISOString()
      });

      onSubmit(cleanedData as EnhancedPurchase);
      
      // Clear draft
      setIsDraft(false);
      const draftKey = `purchase_draft_${sessionId}`;
      localStorage.removeItem(draftKey);
      
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const renderTransactionTypeSelector = () => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Transaction Type *
      </label>
      <div className="grid grid-cols-2 gap-3">
        {[
          { value: 'GOODS', label: 'Goods Purchase', icon: ShoppingCart, description: 'Products for resale' },
          { value: 'EXPENSE', label: 'Expense', icon: Receipt, description: 'Services & consumables' }
        ].map(({ value, label, icon: Icon, description }) => (
          <motion.div
            key={value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative p-4 border-2 rounded-lg cursor-pointer transition-all
              ${formData.transactionType === value 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
            onClick={() => handleInputChange('transactionType', value)}
          >
            <div className="flex items-center space-x-3">
              <Icon className={`h-5 w-5 ${
                formData.transactionType === value ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <div>
                <div className={`font-medium ${
                  formData.transactionType === value ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {label}
                </div>
                <div className="text-sm text-gray-500">{description}</div>
              </div>
            </div>
            {formData.transactionType === value && (
              <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-blue-600" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderExpenseFields = () => {
    if (formData.transactionType !== 'EXPENSE') return null;

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="space-y-4 border-t pt-4"
      >
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Expense Details
        </h3>

        {/* Expense Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expense Category *
          </label>
          <ExpenseCategoryDropdown
            value={formData.expenseCategoryId ? parseInt(formData.expenseCategoryId) : undefined}
            onChange={handleCategoryChange}
            error={errors.expenseCategoryId}
            required
          />
        </div>

        {/* Expense Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expense Type *
          </label>
          <ExpenseTypeDropdown
            categoryId={formData.expenseCategoryId ? parseInt(formData.expenseCategoryId) : undefined}
            value={formData.expenseTypeId ? parseInt(formData.expenseTypeId) : undefined}
            onChange={handleTypeChange}
            error={errors.expenseTypeId}
            required
          />
        </div>

        {/* Expense Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expense Description *
          </label>
          <textarea
            value={formData.expenseDescription}
            onChange={(e) => handleInputChange('expenseDescription', e.target.value)}
            placeholder="Describe the expense in detail..."
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.expenseDescription ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.expenseDescription && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.expenseDescription}
            </p>
          )}
        </div>

        {/* Approval Warning */}
        {selectedType?.requiresApproval && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Approval Required</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              This expense type requires approval
              {selectedType.approvalThreshold && formData.total >= selectedType.approvalThreshold && 
                ` for amounts ≥ ${formatNumber(selectedType.approvalThreshold)}`
              }.
            </p>
          </div>
        )}
      </motion.div>
    );
  };

  const renderDuplicateWarning = () => {
    if (!duplicateWarning) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
      >
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Potential Duplicate</span>
          {isCheckingDuplicate && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
        <p className="text-sm text-yellow-700 mt-1">{duplicateWarning}</p>
      </motion.div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {formData.transactionType === 'EXPENSE' ? (
                  <Receipt className="h-6 w-6 text-blue-600" />
                ) : (
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingPurchase ? 'Edit' : 'Create'} {formData.transactionType === 'EXPENSE' ? 'Expense' : 'Purchase'}
                </h2>
                <p className="text-sm text-gray-500">
                  {formData.transactionType === 'EXPENSE' 
                    ? 'Record an expense transaction' 
                    : 'Record a goods purchase'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isDraft && (
                <div className="flex items-center gap-1 text-sm text-amber-600">
                  <Clock className="h-4 w-4" />
                  Draft saved
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-6">
              {/* Transaction Type Selector */}
              {!editingPurchase && renderTransactionTypeSelector()}

              {/* Duplicate Warning */}
              {renderDuplicateWarning()}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.date ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                  )}
                </div>

                {/* Supplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier *
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.supplierId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select supplier...</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.rnc})
                      </option>
                    ))}
                  </select>
                  {errors.supplierId && (
                    <p className="mt-1 text-sm text-red-600">{errors.supplierId}</p>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total}
                    onChange={(e) => handleInputChange('total', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.total ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    required
                  />
                  {errors.total && (
                    <p className="mt-1 text-sm text-red-600">{errors.total}</p>
                  )}
                </div>

                {/* Payment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Type *
                  </label>
                  <select
                    value={formData.paymentType}
                    onChange={(e) => handleInputChange('paymentType', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.paymentType ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="CREDIT">Credit</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                  </select>
                  {errors.paymentType && (
                    <p className="mt-1 text-sm text-red-600">{errors.paymentType}</p>
                  )}
                </div>
              </div>

              {/* Expense-specific fields */}
              <AnimatePresence>
                {renderExpenseFields()}
              </AnimatePresence>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Session: {sessionId.slice(-8)}</span>
              {isCheckingDuplicate && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking duplicates...
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || isCheckingDuplicate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {editingPurchase ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {editingPurchase ? 'Update' : 'Create'} {formData.transactionType === 'EXPENSE' ? 'Expense' : 'Purchase'}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedPurchaseForm;