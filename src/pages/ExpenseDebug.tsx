import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, FileText, Calendar, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { formatNumber } from '../utils/formatNumber';

interface Expense {
  id: number;
  registrationNumber: string;
  registrationDate: string;
  expenseType: string;
  amount: number;
  description: string;
  relatedDocumentType: string;
  relatedDocumentNumber: string;
  paymentMethod: string;
  status: string;
}

const ExpenseDebugPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [processingFeeExpenses, setProcessingFeeExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenseData();
  }, []);

  const fetchExpenseData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all expenses
      const allExpensesResponse = await api.get('/expenses');
      setExpenses(allExpensesResponse.data);

      // Fetch processing fee expenses specifically
      const processingFeesResponse = await api.get('/expenses/processing-fees');
      setProcessingFeeExpenses(processingFeesResponse.data);
      
    } catch (error: any) {
      console.error('Error fetching expense data:', error);
      setError(error.response?.data?.error || error.message || 'Failed to fetch expense data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'PAID': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };
    
    const styleClass = styles[status] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styleClass}`}>
        {status}
      </span>
    );
  };

  const getExpenseTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'PROCESSING_FEE': 'text-red-600',
      'CREDIT_CARD_FEE': 'text-purple-600',
      'TRANSACTION_FEE': 'text-blue-600',
      'BANK_CHARGES': 'text-orange-600',
    };
    
    return colors[type] || 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Expense Debug Dashboard</h1>
        <p className="text-gray-600">Monitor processing fee expense creation and data</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-600" size={20} />
            <span className="text-red-800 font-medium">Error:</span>
            <span className="text-red-700">{error}</span>
          </div>
          <p className="text-red-600 text-sm mt-2">
            Make sure the backend is running and the expense routes are properly configured.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 rounded-xl p-6 border border-blue-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-blue-900">{expenses.length}</p>
            </div>
            <FileText className="text-blue-600" size={32} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-red-50 rounded-xl p-6 border border-red-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Processing Fee Expenses</p>
              <p className="text-2xl font-bold text-red-900">{processingFeeExpenses.length}</p>
            </div>
            <DollarSign className="text-red-600" size={32} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-green-50 rounded-xl p-6 border border-green-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Processing Fees</p>
              <p className="text-2xl font-bold text-green-900">
                {formatNumber(processingFeeExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0))}
              </p>
            </div>
            <Calendar className="text-green-600" size={32} />
          </div>
        </motion.div>
      </div>

      {/* Instructions */}
      {expenses.length === 0 && (
        <div className="mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Expense Records Found</h3>
          <p className="text-yellow-700 mb-4">To create processing fee expense records:</p>
          <ol className="list-decimal list-inside text-yellow-700 space-y-1">
            <li>Go to <strong>Accounts Receivable</strong> page</li>
            <li>Find a <strong>Credit Card Sale</strong> record</li>
            <li>Click the <strong>"Collect"</strong> button</li>
            <li>Enter an amount <strong>less than</strong> the invoice amount (e.g., ₹9.72 for ₹10.00 invoice)</li>
            <li>Fill in bank account and other details</li>
            <li>Click <strong>"Collect Payment"</strong></li>
            <li>Refresh this page to see the new expense record</li>
          </ol>
        </div>
      )}

      {/* Processing Fee Expenses Table */}
      {processingFeeExpenses.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Processing Fee Expenses</h2>
          <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">REG NUMBER</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">DATE</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">TYPE</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">AMOUNT</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">RELATED TO</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">DESCRIPTION</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {processingFeeExpenses.map((expense, index) => (
                  <motion.tr
                    key={expense.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium">{expense.registrationNumber}</td>
                    <td className="px-6 py-4 text-sm">{new Date(expense.registrationDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-medium ${getExpenseTypeColor(expense.expenseType)}`}>
                        {expense.expenseType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-right text-red-600">
                      {formatNumber(Number(expense.amount))}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {expense.relatedDocumentType} - {expense.relatedDocumentNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={expense.description}>
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 text-center">{getStatusBadge(expense.status)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Expenses Table */}
      {expenses.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Expenses</h2>
          <div className="bg-white rounded-xl shadow-lg overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">REG NUMBER</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">DATE</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">TYPE</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">AMOUNT</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">PAYMENT METHOD</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, index) => (
                  <motion.tr
                    key={expense.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium">{expense.registrationNumber}</td>
                    <td className="px-6 py-4 text-sm">{new Date(expense.registrationDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-medium ${getExpenseTypeColor(expense.expenseType)}`}>
                        {expense.expenseType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-right">
                      {formatNumber(Number(expense.amount))}
                    </td>
                    <td className="px-6 py-4 text-sm">{expense.paymentMethod}</td>
                    <td className="px-6 py-4 text-center">{getStatusBadge(expense.status)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={fetchExpenseData}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default ExpenseDebugPage;