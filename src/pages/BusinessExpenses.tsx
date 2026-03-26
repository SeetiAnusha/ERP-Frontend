import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Eye, TrendingUp, FolderTree, BarChart3, Calendar } from 'lucide-react';
import api from '../api/axios';
import { formatNumber } from '../utils/formatNumber';
import { Supplier } from '../types';
import ExpenseDashboard from '../components/ExpenseDashboard';
import SimpleExpenseForm from '../components/SimpleExpenseForm';

interface ExpenseRecord {
  id: number;
  registrationNumber: string;
  date: string;
  supplier: {
    id: number;
    name: string;
    rnc?: string;
  };
  expenseCategory: {
    id: number;
    name: string;
  };
  expenseType: {
    id: number;
    name: string;
  };
  description: string;
  amount: number;
  paymentType: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  
  // ✅ NEW: Deletion tracking fields
  deletion_status?: string;
  deleted_at?: string;
  deleted_by?: number;
  deletion_reason_code?: string;
  deletion_memo?: string;
}

const Expenses = () => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchExpenses();
    fetchSuppliers();
  }, [selectedDateRange]);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      // Fetch business expenses from dedicated endpoint
      const response = await api.get('/business-expenses', {
        params: {
          dateFrom: selectedDateRange.startDate,
          dateTo: selectedDateRange.endDate
        }
      });
      
      console.log("Business Expenses API response:", response.data);
      
      // Handle response structure
      let expensesData = [];
      if (response.data.success && Array.isArray(response.data.data)) {
        expensesData = response.data.data;
      } else {
        console.warn('Unexpected business expenses API response structure:', response.data);
        expensesData = [];
      }
      
      // Transform business expense data to display format
      const transformedData = expensesData.map((expense: any) => ({
        id: expense.id,
        registrationNumber: expense.registrationNumber,
        date: expense.date,
        supplier: expense.supplier || { id: 0, name: 'Unknown' },
        expenseCategory: expense.expenseCategory || { id: 0, name: 'Uncategorized' },
        expenseType: expense.expenseTypeModel || { id: 0, name: 'General' },
        description: expense.description || 'No description',
        amount: expense.amount || 0,
        paymentType: expense.paymentType,
        paymentStatus: expense.paymentStatus || 'Unpaid',
        status: expense.status,
        createdAt: expense.createdAt
      }));
      
      setExpenses(transformedData);
    } catch (error) {
      console.error('Error fetching business expenses:', error);
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    fetchExpenses(); // Refresh data after modal closes
  };

  const handleSubmitExpense = async (expenseData: any) => {
    setIsSubmitting(true);
    try {
      await api.post('/business-expenses', expenseData);
      await fetchExpenses();
      setShowModal(false);
    } catch (error) {
      console.error('Error handling business expense submission:', error);
      throw error; // Let the form handle the error display
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string, isDeleted?: boolean) => {
    // ✅ NEW: Show deletion status with priority
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
      'REVERSED': 'bg-orange-100 text-orange-800 border border-orange-300', // ✅ NEW
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status === 'REVERSED' ? '↩️ REVERSED' : status}
      </span>
    );
  };

  const filteredExpenses = Array.isArray(expenses) ? expenses.filter((expense) =>
    Object.values(expense).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) : [];

  // const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  // const paidExpenses = filteredExpenses.filter(e => e.paymentStatus === 'Paid').reduce((sum, expense) => sum + expense.amount, 0);

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
              onClick={() => setShowDashboard(!showDashboard)}
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
              value={selectedDateRange.startDate}
              onChange={(e) => setSelectedDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={selectedDateRange.endDate}
              onChange={(e) => setSelectedDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Expense Records ({filteredExpenses.length})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            💡 Unpaid expenses are automatically shown in Accounts Payable for payment processing
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading expenses...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-8 text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-gray-500 mt-2">No expenses found for the selected period</p>
            <button
              onClick={openModal}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Your First Expense
            </button>
          </div>
        ) : (
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
                {filteredExpenses.map((expense, index) => {
                  const isDeleted = expense.deletion_status === 'EXECUTED';
                  return (
                  <motion.tr
                    key={expense.id}
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
                      <span className={isDeleted ? 'line-through text-gray-500' : ''}>
                        {expense.supplier.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        <FolderTree size={12} className="mr-1" />
                        {expense.expenseCategory.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{expense.expenseType.name}</td>
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
                    <td className="px-6 py-4 text-sm">{expense.paymentType}</td>
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
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

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

export default Expenses;