import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, X, Calendar, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import { extractErrorMessage } from '../utils/errorHandler';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { PaymentFields, SupplierSelector } from '../components/shared';
import { useLanguage } from '../contexts/LanguageContext';
// ✅ Server-Side Pagination
import { useTableData } from '../hooks/useTableData';
import { Pagination } from '../components/common/Pagination';
// ✅ Modal pattern matching Products/Purchases
import Modal from '../components/common/Modal';
import { useModal } from '../hooks/useModal';
// ✅ Only mutations — no useQuery (useTableData handles data fetching)
import { useCreatePrepaidExpense, useUpdatePrepaidExpense, useDeletePrepaidExpense } from '../hooks/queries/usePrepaidExpenses';
import { notify } from '../utils/notifications';

interface PrepaidExpense {
  id: number;
  code: string;
  name: string;
  type: string;
  description: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  amortizedAmount: number;
  remainingAmount: number;
  monthlyAmortization: number;
  status: string;
  supplierId?: number;
  daysRemaining?: number;
  amortizationPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

const PrepaidExpenses = () => {
  const { t } = useLanguage();
  // ✅ Server-Side Pagination — single source of truth for data
  const { data: expenses = [], loading, pagination, goToPage, changeLimit, updateSearch, refresh } = useTableData({ endpoint: 'prepaid-expenses' });
  // ✅ Only mutations — useTableData handles the GET
  const createExpenseMutation = useCreatePrepaidExpense();
  const updateExpenseMutation = useUpdatePrepaidExpense();
  const deleteExpenseMutation = useDeletePrepaidExpense();

  // ✅ Modal pattern matching Products/Purchases
  const expenseModal = useModal<PrepaidExpense>();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [summary, setSummary] = useState({
    totalPrepaid: 0,
    totalAmortized: 0,
    totalRemaining: 0,
    activeCount: 0,
    expiringCount: 0,
  });

  const { confirm, dialogProps } = useConfirm();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'Insurance',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    totalAmount: '',
    supplierId: '',
    supplierRnc: '',
    // Payment fields
    paymentType: 'CREDIT',
    bankAccountId: '',
    cardId: '',
    chequeNumber: '',
    chequeDate: new Date().toISOString().split('T')[0],
    transferNumber: '',
    transferDate: new Date().toISOString().split('T')[0],
    paymentReference: '',
    voucherDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    // ✅ Only fetch summary (expenses are fetched by useTableData)
    fetchSummary();
  }, []);

  // ✅ Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, updateSearch]);

  // Filter by status and type (client-side for now, can be moved to backend)
  const filteredExpenses = expenses.filter((expense) => {
    const matchesStatus = filterStatus === 'All' || expense.status === filterStatus;
    const matchesType = filterType === 'All' || expense.type === filterType;
    return matchesStatus && matchesType;
  });

  const fetchSummary = async () => {
    try {
      const response = await api.get('/prepaid-expenses/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Manual validation — HTML5 required doesn't work inside overflow containers
    if (!formData.code?.trim()) { notify.error('Validation Error', 'Code is required'); return; }
    if (!formData.name?.trim()) { notify.error('Validation Error', 'Name is required'); return; }
    if (!formData.type) { notify.error('Validation Error', 'Type is required'); return; }
    if (!formData.description?.trim()) { notify.error('Validation Error', 'Description is required'); return; }
    if (!formData.startDate) { notify.error('Validation Error', 'Start date is required'); return; }
    if (!formData.endDate) { notify.error('Validation Error', 'End date is required'); return; }
    if (formData.endDate <= formData.startDate) { notify.error('Validation Error', 'End date must be after start date'); return; }
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) { notify.error('Validation Error', 'Total amount must be greater than 0'); return; }

    try {
      const data = {
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        // ✅ Convert all integer fields — empty string → null to prevent "invalid input syntax for type integer"
        supplierId: formData.supplierId && formData.supplierId !== '' ? parseInt(formData.supplierId) : null,
        bankAccountId: formData.bankAccountId && formData.bankAccountId !== '' ? parseInt(formData.bankAccountId) : null,
        cardId: formData.cardId && formData.cardId !== '' ? parseInt(formData.cardId) : null,
      };

      // ✅ Use React Query mutations instead of manual API calls
      if (expenseModal.data) {
        updateExpenseMutation.mutate({ id: expenseModal.data.id, data }, {
          onSuccess: () => {
            notify.success('Prepaid Expense Updated', 'Prepaid expense updated successfully');
            refresh(); // ✅ Refresh server-side paginated data
            fetchSummary();
            expenseModal.close();
          },
          onError: (error: any) => {
            notify.error('Update Failed', extractErrorMessage(error));
          }
        });
      } else {
        createExpenseMutation.mutate(data, {
          onSuccess: () => {
            notify.success('Prepaid Expense Created', 'Prepaid expense created successfully');
            refresh(); // ✅ Refresh server-side paginated data
            fetchSummary();
            expenseModal.close();
          },
          onError: (error: any) => {
            notify.error('Creation Failed', extractErrorMessage(error));
          }
        });
      }
    } catch (error: any) {
      console.error('Error saving prepaid expense:', error);
      notify.error('Error', extractErrorMessage(error));
    }
  };

  const handleDelete = useCallback(async (id: number) => {
    const confirmed = await confirm({
      title: 'Delete Prepaid Expense',
      message: 'Are you sure you want to delete this prepaid expense? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;

    deleteExpenseMutation.mutate(id, {
      onSuccess: () => {
        notify.success('Prepaid Expense Deleted', 'Prepaid expense deleted successfully');
        refresh(); // ✅ Refresh server-side paginated data
        fetchSummary();
      },
      onError: (error: any) => {
        notify.error('Deletion Failed', extractErrorMessage(error));
      }
    });
  }, [confirm, deleteExpenseMutation, refresh]);

  const handleAmortize = async (id: number) => {
    const confirmed = await confirm({
      title: 'Process Amortization',
      message: 'This will record this month\'s amortization. Continue?',
      confirmText: 'Process',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;

    try {
      await api.post(`/prepaid-expenses/${id}/amortize`);
      notify.success('Amortization Processed', 'Amortization processed successfully');
      // ✅ React Query will auto-refresh the data
      fetchSummary(); // Refresh summary
    } catch (error: any) {
      console.error('Error processing amortization:', error);
      notify.error('Amortization Failed', extractErrorMessage(error));
    }
  };

  const openModal = useCallback((expense?: PrepaidExpense) => {
    if (expense) {
      setFormData({
        code: expense.code,
        name: expense.name,
        type: expense.type,
        description: expense.description,
        startDate: expense.startDate.split('T')[0],
        endDate: expense.endDate.split('T')[0],
        totalAmount: expense.totalAmount.toString(),
        supplierId: expense.supplierId?.toString() || '',
        supplierRnc: (expense as any).supplierRnc || '',
        paymentType: (expense as any).paymentType || 'CREDIT',
        bankAccountId: (expense as any).bankAccountId?.toString() || '',
        cardId: (expense as any).cardId?.toString() || '',
        chequeNumber: (expense as any).chequeNumber || '',
        chequeDate: (expense as any).chequeDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        transferNumber: (expense as any).transferNumber || '',
        transferDate: (expense as any).transferDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        paymentReference: (expense as any).paymentReference || '',
        voucherDate: (expense as any).voucherDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        code: '',
        name: '',
        type: 'Insurance',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        totalAmount: '',
        supplierId: '',
        supplierRnc: '',
        paymentType: 'CREDIT',
        bankAccountId: '',
        cardId: '',
        chequeNumber: '',
        chequeDate: new Date().toISOString().split('T')[0],
        transferNumber: '',
        transferDate: new Date().toISOString().split('T')[0],
        paymentReference: '',
        voucherDate: new Date().toISOString().split('T')[0],
      });
    }
    expenseModal.open(expense);
  }, [expenseModal]);

  const closeModal = useCallback(() => {
    expenseModal.close();
  }, [expenseModal]);



  // Get unique types for filter
  const uniqueTypes = Array.from(new Set(expenses.map(e => e.type)));

  return (
    <div>
      {/* Header with Summary Cards */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{t('prepaidExpenses')}</h2>
            <p className="text-gray-600 mt-1">{t('prepaidExpensesDesc')}</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            {t('newPrepaidExpense')}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">{t('totalPrepaid')}</p>
                <p className="text-2xl font-bold text-blue-700">
                  {summary.totalPrepaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="text-blue-400" size={32} />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">{t('totalAmortized')}</p>
                <p className="text-2xl font-bold text-green-700">
                  {summary.totalAmortized.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="text-green-400" size={32} />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">{t('remainingBalance')}</p>
                <p className="text-2xl font-bold text-orange-700">
                  {summary.totalRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Calendar className="text-orange-400" size={32} />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Active / Expiring</p>
                <p className="text-2xl font-bold text-purple-700">
                  {summary.activeCount} / {summary.expiringCount}
                </p>
              </div>
              <AlertCircle className="text-purple-400" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t('placeholders_searchPrepaid')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRING_SOON">Expiring Soon</option>
            <option value="FULLY_AMORTIZED">Fully Amortized</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>


        </div>
      </div>

      {/* Expenses Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full min-w-[1400px]">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">CODE</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">NAME</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">TYPE</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">PERIOD</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">TOTAL AMOUNT</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">MONTHLY AMT</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">AMORTIZED</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">REMAINING</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">PROGRESS</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">PAYMENT</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">STATUS</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-800 sticky right-0 bg-gray-50">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredExpenses.map((expense, index) => (
                    <motion.tr
                      key={expense.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium">{expense.code}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{expense.name}</div>
                        <div className="text-xs text-gray-500">{expense.description.substring(0, 50)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          {expense.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <div>{new Date(expense.startDate).toLocaleDateString('en-IN')}</div>
                        <div className="text-xs text-gray-500">to</div>
                        <div>{new Date(expense.endDate).toLocaleDateString('en-IN')}</div>
                        {expense.daysRemaining !== undefined && expense.daysRemaining > 0 && (
                          <div className="text-xs text-orange-600 mt-1">
                            {expense.daysRemaining} days left
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold">
                        {parseFloat(expense.totalAmount.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-indigo-600 font-medium">
                        {parseFloat(expense.monthlyAmortization.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                        {parseFloat(expense.amortizedAmount.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-orange-600 font-medium">
                        {parseFloat(expense.remainingAmount.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${expense.amortizationPercentage || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">
                            {(expense.amortizationPercentage || 0).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {(expense as any).paymentType ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                            (expense as any).paymentType === 'CASH' ? 'bg-green-100 text-green-800' :
                            (expense as any).paymentType === 'BANK_TRANSFER' ? 'bg-blue-100 text-blue-800' :
                            (expense as any).paymentType === 'CHEQUE' ? 'bg-yellow-100 text-yellow-800' :
                            (expense as any).paymentType === 'CREDIT' ? 'bg-orange-100 text-orange-800' :
                            (expense as any).paymentType === 'CREDIT_CARD' ? 'bg-purple-100 text-purple-800' :
                            (expense as any).paymentType === 'DEBIT_CARD' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {(expense as any).paymentType.replace('_', ' ')}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          expense.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          expense.status === 'EXPIRING_SOON' ? 'bg-yellow-100 text-yellow-800' :
                          expense.status === 'FULLY_AMORTIZED' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {expense.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 sticky right-0 bg-white">
                        <div className="flex gap-2 justify-center">
                          {expense.status === 'ACTIVE' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleAmortize(expense.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Process Amortization"
                            >
                              <TrendingUp size={18} />
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openModal(expense)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(expense.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredExpenses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No prepaid expenses found</p>
          </div>
        )}

      </motion.div>

      {/* ✅ Pagination — outside table card, matching Products/Suppliers pattern */}
      <div className="mt-6">
        {pagination && pagination.total > 0 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            from={pagination.from}
            to={pagination.to}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
            onPageChange={goToPage}
            onLimitChange={changeLimit}
          />
        )}
      </div>

      {/* ✅ Modal — using shared Modal component matching Products/Purchases pattern */}
      <Modal
        isOpen={expenseModal.isOpen}
        onClose={closeModal}
        title={expenseModal.data ? 'Edit Prepaid Expense' : 'New Prepaid Expense'}
        size="lg"
        maxHeight="90vh"
      >
        <div className="overflow-y-auto px-6 py-4 space-y-6" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="PE-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Insurance">Insurance</option>
                        <option value="Rent">Rent</option>
                        <option value="Software Subscription">Software Subscription</option>
                        <option value="Maintenance Contract">Maintenance Contract</option>
                        <option value="License">License</option>
                        <option value="Membership">Membership</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Annual Office Insurance"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Detailed description of the prepaid expense"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">Financial Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        min={formData.startDate}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.totalAmount}
                        onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="120000"
                      />
                      <p className="text-xs text-gray-500 mt-1">Total prepaid amount</p>
                    </div>
                  </div>
                </div>

                {/* ✅ Supplier Selection — linked to Suppliers table for AP tracking */}
                <div>
                  <SupplierSelector
                    value={formData.supplierId}
                    onChange={(value, supplier) => setFormData({
                      ...formData,
                      supplierId: value,
                      supplierRnc: supplier?.rnc || '',
                    })}
                    label="Supplier (for Credit/AP tracking)"
                    showRnc={true}
                    filterActive={false}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required when payment type is Credit or Credit Card — links to Accounts Payable
                  </p>
                </div>

                {/* Payment Information - Reusable Component */}
                <PaymentFields
                  paymentType={formData.paymentType}
                  onPaymentTypeChange={(value) => setFormData({ ...formData, paymentType: value })}
                  bankAccountId={formData.bankAccountId}
                  onBankAccountChange={(value) => setFormData({ ...formData, bankAccountId: value })}
                  cardId={formData.cardId}
                  onCardChange={(value) => setFormData({ ...formData, cardId: value })}
                  chequeNumber={formData.chequeNumber}
                  onChequeNumberChange={(value) => setFormData({ ...formData, chequeNumber: value })}
                  chequeDate={formData.chequeDate}
                  onChequeDateChange={(value) => setFormData({ ...formData, chequeDate: value })}
                  transferNumber={formData.transferNumber}
                  onTransferNumberChange={(value) => setFormData({ ...formData, transferNumber: value })}
                  transferDate={formData.transferDate}
                  onTransferDateChange={(value) => setFormData({ ...formData, transferDate: value })}
                  paymentReference={formData.paymentReference}
                  onPaymentReferenceChange={(value) => setFormData({ ...formData, paymentReference: value })}
                  voucherDate={formData.voucherDate}
                  onVoucherDateChange={(value) => setFormData({ ...formData, voucherDate: value })}
                  showCreditOption={true}
                  showCashOption={false}
                />

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {(createExpenseMutation.isPending || updateExpenseMutation.isPending)
                      ? 'Saving...'
                      : expenseModal.data ? 'Update Expense' : 'Create Expense'}
                  </button>
                </div>
              </form>
        </div>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default PrepaidExpenses;
