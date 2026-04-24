import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Eye, TrendingUp, FolderTree, BarChart3, Calendar, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../api/axios';
import { formatNumber } from '../utils/formatNumber';
import { extractErrorMessage } from '../utils/errorHandler';
import ExpenseDashboard from '../components/ExpenseDashboard';
import SimpleExpenseForm from '../components/SimpleExpenseForm';
import { QUERY_KEYS } from '../lib/queryKeys';

// ✅ OPTIMIZATION: Use React Query hooks for better performance
import { useBusinessExpenses } from '../hooks/queries/useFinancial';
import { useSuppliers } from '../hooks/queries/useSharedData';

interface ExpenseRecord {
  id: number;
  registrationNumber: string;
  date: string;
  supplier?: {
    id: number;
    name: string;
    rnc?: string;
  };
  expenseCategory: {
    id: number;
    name: string;
    code?: string;
  };
  expenseType: {
    id: number;
    name: string;
    code?: string;
  };
  description: string;
  amount: number;
  paymentType: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  
  deletion_status?: string;
  deleted_at?: string;
  deleted_by?: number;
  deletion_reason_code?: string;
  deletion_memo?: string;
}

const BusinessExpenses = () => {
  const queryClient = useQueryClient();
  
  // ✅ PAGINATION: Add page state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  
  // ✅ FIXED: Show ALL records by default, user can filter by date if needed
  // Dashboard uses its own period selector (independent)
  const [tableDateRange, setTableDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  // ✅ OPTIMIZATION: Use React Query with pagination
  const shouldFilterByDate = tableDateRange.startDate && tableDateRange.endDate;
  const { data: expenseResponse, isLoading: expensesLoading } = useBusinessExpenses({
    dateRange: shouldFilterByDate ? tableDateRange : undefined,
    page: currentPage,
    limit: pageSize
  });
  
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ PAGINATION: Extract data and pagination info
  const rawExpenses = expenseResponse?.data || [];
  const pagination = expenseResponse?.pagination || {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  };

  // ✅ OPTIMIZATION: Combine loading states
  const isLoading = expensesLoading || suppliersLoading;

  // ✅ OPTIMIZATION: Memoized expense transformation
  const expenses = useMemo(() => {
    if (!Array.isArray(rawExpenses)) return [];
    
    return rawExpenses.map((expense: any) => ({
      id: expense.id,
      registrationNumber: expense.registrationNumber,
      date: expense.date,
      supplier: expense.supplier || null,
      expenseCategory: expense.expenseCategory || { id: 0, name: 'Uncategorized', code: '' },
      expenseType: expense.expenseTypeModel || { id: 0, name: 'General', code: '' },
      description: expense.description || 'No description',
      amount: expense.amount || 0,
      paymentType: expense.paymentType,
      paymentStatus: expense.paymentStatus || 'Unpaid',
      status: expense.status,
      createdAt: expense.createdAt,
      deletion_status: expense.deletion_status,
      deleted_at: expense.deleted_at,
      deleted_by: expense.deleted_by,
      deletion_reason_code: expense.deletion_reason_code,
      deletion_memo: expense.deletion_memo,
    }));
  }, [rawExpenses]);

  // ✅ OPTIMIZATION: Memoized status badge function
  const getStatusBadge = useCallback((status: string, isDeleted?: boolean) => {
    if (isDeleted) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
          🗑️ DELETED
        </span>
      );
    }
    
    const styles = {
      'Paid': 'bg-green-100 text-green-800',
      'Partial': 'bg-yellow-100 text-yellow-800',
      'Unpaid': 'bg-red-100 text-red-800',
      'REVERSED': 'bg-orange-100 text-orange-800 border border-orange-300',
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status === 'REVERSED' ? '↩️ REVERSED' : status}
      </span>
    );
  }, []);

  // ✅ OPTIMIZATION: Memoized filtered expenses based on search
  const filteredExpenses = useMemo(() => {
    if (!searchTerm) return expenses;
    
    const lowerSearch = searchTerm.toLowerCase();
    return expenses.filter((expense) =>
      expense.registrationNumber?.toLowerCase().includes(lowerSearch) ||
      expense.description?.toLowerCase().includes(lowerSearch) ||
      expense.supplier?.name?.toLowerCase().includes(lowerSearch) ||
      expense.expenseCategory?.name?.toLowerCase().includes(lowerSearch)
    );
  }, [expenses, searchTerm]);

  // ✅ OPTIMIZATION: Memoized submit handler with React Query cache invalidation
  const handleSubmitExpense = useCallback(async (expenseData: any) => {
    setIsSubmitting(true);
    try {
      await api.post('/business-expenses', expenseData);
      
      // ✅ OPTIMIZATION: Use React Query cache invalidation (parallel execution)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.businessExpenses }),
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] }),
        queryClient.invalidateQueries({ queryKey: ['business-expenses', 'dashboard'] }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cards }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.creditCardTransactions }), // ✅ FIX: Invalidate credit card register
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankRegisters }), // ✅ FIX: Invalidate bank register
      ]);
      
      setShowModal(false);
    } catch (error: any) {
      console.error('Error handling business expense submission:', error);
      
      // ✅ IMPROVED: Show specific error message from backend
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [queryClient]);

  // ✅ OPTIMIZATION: Memoized modal handlers
  const openModal = useCallback(() => setShowModal(true), []);
  const closeModal = useCallback(() => setShowModal(false), []);
  const toggleDashboard = useCallback(() => setShowDashboard(prev => !prev), []);

  // ✅ OPTIMIZATION: Memoized date range handler
  const handleDateRangeChange = useCallback((field: 'startDate' | 'endDate', value: string) => {
    setTableDateRange(prev => ({ ...prev, [field]: value }));
  }, []);

  // ✅ NEW: Clear date filter to show ALL records
  const clearDateFilter = useCallback(() => {
    setTableDateRange({ startDate: '', endDate: '' });
    setCurrentPage(1); // Reset to first page
  }, []);

  // ✅ PAGINATION: Page change handlers
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pagination.hasNextPage]);

  const handlePreviousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pagination.hasPreviousPage]);

  // ✅ OPTIMIZATION: Loading state with better UX
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading expenses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-blue-600" />
            Expense Management
          </h1>
          <div className="flex gap-2">
            <button
              onClick={toggleDashboard}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                showDashboard 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <BarChart3 size={16} />
              Dashboard
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Date Range Filter */}
          <div className="flex gap-2 items-center">
            <Calendar size={16} className="text-gray-500" />
            <input
              type="date"
              value={tableDateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              placeholder="Start Date"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={tableDateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              placeholder="End Date"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            {shouldFilterByDate && (
              <button
                onClick={clearDateFilter}
                className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 flex items-center gap-1"
                title="Clear date filter and show all records"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Add Expense Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openModal}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-lg whitespace-nowrap"
          >
            <Plus size={20} />
            Add Expense
          </motion.button>
        </div>
      </div>

      {/* Dashboard */}
      {showDashboard && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ExpenseDashboard />
        </motion.div>
      )}

      {/* Expenses List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Expenses List Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Supplier Expense Records ({filteredExpenses.length})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            💡 Unpaid expenses are automatically shown in Accounts Payable for payment processing
          </p>
        </div>

        {/* Expenses Table */}
        {filteredExpenses.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <ExpenseTable
              expenses={filteredExpenses}
              getStatusBadge={getStatusBadge}
            />
            
            {/* ✅ PAGINATION CONTROLS */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span> of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={!pagination.hasPreviousPage}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            pagination.page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={handleNextPage}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Simple Expense Form Modal */}
      <SimpleExpenseForm
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={handleSubmitExpense}
        suppliers={suppliers}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

// ✅ OPTIMIZATION: Memoized Empty State Component
const EmptyState = () => (
  <div className="p-8 text-center">
    <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
    <p className="text-gray-500 mt-2">No expenses found for the selected period</p>
  </div>
);

// ✅ OPTIMIZATION: Memoized Expense Table Component
const ExpenseTable = ({ expenses, getStatusBadge }: any) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">REGISTRATION #</th>
          <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">DATE</th>
          <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">SUPPLIER</th>
          <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">CATEGORY</th>
          <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">TYPE</th>
          <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">DESCRIPTION</th>
          <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">AMOUNT</th>
          <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">PAYMENT</th>
          <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">STATUS</th>
          <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        {expenses.map((expense: ExpenseRecord, index: number) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            index={index}
            getStatusBadge={getStatusBadge}
          />
        ))}
      </tbody>
    </table>
  </div>
);

// ✅ OPTIMIZATION: Memoized Expense Row Component
const ExpenseRow = ({ expense, index, getStatusBadge }: any) => {
  const isDeleted = expense.deletion_status === 'EXECUTED';
  
  return (
    <motion.tr
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isDeleted ? 'bg-red-50 opacity-75' : ''
      }`}
    >
      <td className="px-6 py-4 text-sm font-medium">
        <div className="flex items-center gap-2">
          {isDeleted && <span className="text-red-500">🗑️</span>}
          <span className={isDeleted ? 'line-through text-gray-500' : ''}>
            {expense.registrationNumber}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm">{new Date(expense.date).toLocaleDateString()}</td>
      <td className="px-6 py-4 text-sm">
        {expense.supplier ? (
          <div>
            <div className={isDeleted ? 'line-through text-gray-500' : ''}>
              {expense.supplier.name}
            </div>
            {expense.supplier.rnc && (
              <div className="text-xs text-gray-500">RNC: {expense.supplier.rnc}</div>
            )}
          </div>
        ) : (
          <span className="text-gray-400">N/A</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm">
        {expense.expenseCategory ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
            <FolderTree size={12} className="mr-1" />
            {expense.expenseCategory.name}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm">
        {expense.expenseType ? (
          <div className="flex items-center gap-1">
            {expense.expenseType.name}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm max-w-xs truncate" title={expense.description}>
        <span className={isDeleted ? 'line-through text-gray-500' : ''}>
          {expense.description}
        </span>
      </td>
      <td className="px-6 py-4 text-sm font-semibold text-right">
        <span className={isDeleted ? 'line-through text-gray-500' : ''}>
          {formatNumber(expense.amount)}
        </span>
      </td>
      <td className="px-6 py-4 text-sm">
        {expense.paymentType}
      </td>
      <td className="px-6 py-4 text-center">
        {getStatusBadge(expense.paymentStatus, isDeleted)}
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2 justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="View Details"
          >
            <Eye size={18} />
          </motion.button>
        </div>
      </td>
    </motion.tr>
  );
};

export default BusinessExpenses;
