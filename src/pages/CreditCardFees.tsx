import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Eye, CreditCard, Calendar, X, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { useTableData } from '../hooks/useTableData';
import { Pagination } from '../components/common/Pagination';
import { SearchBar } from '../components/common/SearchBar';
import { formatNumber } from '../utils/formatNumber';

interface CreditCardFeeRecord {
  id: number;
  transactionNumber: string;
  transactionDate: string;
  customerId?: number;
  customerName: string;
  clientRnc?: string;
  ncf?: string;
  paymentAmount?: number;
  feeAmount?: number;
  feePercentage?: number;
  netAmount?: number;
  cardType?: string;
  cardLastFour?: string;
  arId?: number;
  arRegistrationNumber?: string;
  
  // ✅ Expense categorization from backend
  expenseType?: string; // 'CARD_PROCESSING_FEE', 'BANK_CHARGE', etc.
  expenseCategory?: string; // 'Card Expenses', 'Bank Expenses', etc.
  
  // ✅ AR fields
  accountsReceivable?: {
    id: number;
    registrationNumber: string;
    clientName?: string;
    clientRnc?: string;
    ncf?: string;
    transferReference?: string;
    amount?: number;
    receivedAmount?: number;
  };
  status: string;
  notes?: string;
  createdAt: string;
}

const CreditCardFees = () => {
  const [tableDateRange, setTableDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  // ✅ PROFESSIONAL: Simple grouping by expense type (like AR groups by type)
  const [groupByType, setGroupByType] = useState<boolean>(true);

  // ✅ Use table data hook with pagination
  const {
    data: fees,
    loading,
    error,
    pagination,
    search,
    updateSearch,
    goToPage,
    changeLimit,
    updateFilter,
  } = useTableData<CreditCardFeeRecord>({
    endpoint: 'credit-card-fees',
    initialLimit: 50,
    initialSortBy: 'transactionDate',
    initialSortOrder: 'DESC'
  });

  // ✅ Status badge helper
  const getStatusBadge = useCallback((status: string) => {
    const styles = {
      'RECORDED': 'bg-yellow-100 text-yellow-800',
      'RECONCILED': 'bg-green-100 text-green-800',
      'DISPUTED': 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  }, []);

  // ✅ Date range filter handlers
  const handleDateRangeChange = useCallback((field: 'startDate' | 'endDate', value: string) => {
    setTableDateRange(prev => {
      const newRange = { ...prev, [field]: value };
      if (field === 'startDate') {
        updateFilter('startDate', value);
      } else {
        updateFilter('endDate', value);
      }
      return newRange;
    });
  }, [updateFilter]);

  const clearDateFilter = useCallback(() => {
    setTableDateRange({ startDate: '', endDate: '' });
    updateFilter('startDate', '');
    updateFilter('endDate', '');
  }, [updateFilter]);

  const shouldFilterByDate = tableDateRange.startDate && tableDateRange.endDate;
  
  // ✅ PROFESSIONAL: Group fees by expense type (like AR groups by type)
  const groupedFees = useMemo(() => {
    if (!groupByType) return null;
    
    const groups: Record<string, CreditCardFeeRecord[]> = {};
    
    fees.forEach(fee => {
      const expenseType = fee.expenseType || 'CARD_PROCESSING_FEE';
      if (!groups[expenseType]) {
        groups[expenseType] = [];
      }
      groups[expenseType].push(fee);
    });
    
    return groups;
  }, [fees, groupByType]);
  
  // ✅ Calculate totals
  const { totalFees, totalTransactions } = useMemo(() => {
    const totalFees = fees.reduce((sum, fee) => sum + Number(fee.feeAmount || 0), 0);
    const totalTransactions = fees.length;
    return { totalFees, totalTransactions };
  }, [fees]);

  // ✅ PROFESSIONAL: Render fee table (like AR table)
  const renderFeeTable = useCallback((feeList: CreditCardFeeRecord[], title?: string) => (
    <div className="mb-6">
      {title && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600">
            {feeList.length} records • Total Fees: ${formatNumber(feeList.reduce((sum, fee) => sum + Number(fee.feeAmount || 0), 0))}
          </p>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">TRANSACTION #</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">DATE</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">EXPENSE TYPE</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">EXPENSE CATEGORY</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">RELATED AR</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">CLIENT NAME</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">CLIENT RNC</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">NCF</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">TRANSFER REF</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">PAYMENT AMOUNT</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">FEE %</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-red-800">FEE AMOUNT</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-green-800">NET AMOUNT</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">STATUS</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {feeList.length === 0 ? (
              <tr>
                <td colSpan={15} className="px-6 py-12 text-center text-gray-500">
                  No credit card fees found
                </td>
              </tr>
            ) : (
              feeList.map((fee, index) => (
                <motion.tr
                  key={fee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-500">💳</span>
                      {fee.transactionNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(fee.transactionDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {fee.expenseType || 'CARD_PROCESSING_FEE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {fee.expenseCategory || 'Card Expenses'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {fee.arRegistrationNumber ? (
                      <span className="text-blue-600 font-medium">
                        {fee.arRegistrationNumber}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {fee.accountsReceivable?.clientName || fee.customerName || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {fee.accountsReceivable?.clientRnc || fee.clientRnc || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {fee.accountsReceivable?.ncf || fee.ncf || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {fee.accountsReceivable?.transferReference || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-semibold">
                    {formatNumber(Number(fee.paymentAmount || 0))}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {Number(fee.feePercentage || 0).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-red-600">
                    {formatNumber(Number(fee.feeAmount || 0))}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-green-600">
                    {formatNumber(Number(fee.netAmount || 0))}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(fee.status)}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  ), [getStatusBadge]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">❌</div>
          <p className="text-red-600 font-semibold">Error loading credit card fees</p>
          <p className="text-gray-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Loading credit card fees...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <CreditCard className="text-purple-600" />
          Credit Card Processing Fees
        </h1>
        <p className="text-gray-600">Track and manage credit card processing fees</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 rounded-xl p-6 border border-red-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Total Fees</p>
              <p className="text-2xl font-bold text-red-900">${formatNumber(totalFees)}</p>
            </div>
            <DollarSign className="text-red-600" size={32} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-purple-50 rounded-xl p-6 border border-purple-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Transactions</p>
              <p className="text-2xl font-bold text-purple-900">{totalTransactions}</p>
            </div>
            <TrendingUp className="text-purple-600" size={32} />
          </div>
        </motion.div>
      </div>

      {/* Info Banner */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <AlertCircle className="text-purple-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">About Processing Fees</h3>
                <p className="text-sm text-gray-600">Automatically recorded from AR collections</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            💡 These fees are automatically recorded when collecting AR payments via credit card. 
            They represent the processing costs charged by payment processors (Visa, Mastercard, etc.).
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 items-center flex-wrap">
        <SearchBar
          value={search}
          onChange={updateSearch}
          placeholder="Search fees..."
        />
        
        {/* Date Range Filter */}
        <div className="flex gap-2 items-center">
          <Calendar size={16} className="text-gray-500" />
          <input
            type="date"
            value={tableDateRange.startDate}
            onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
            placeholder="Start Date"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={tableDateRange.endDate}
            onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
            placeholder="End Date"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          />
          {shouldFilterByDate && (
            <button
              onClick={clearDateFilter}
              className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 flex items-center gap-1"
              title="Clear date filter"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
        
        {/* Group By Type Toggle */}
        <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-300">
          <input
            type="checkbox"
            checked={groupByType}
            onChange={(e) => setGroupByType(e.target.checked)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span className="text-sm font-medium text-gray-700">Group by Type</span>
        </label>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {groupByType && groupedFees ? (
          <div>
            {Object.entries(groupedFees).map(([expenseType, typeFees]) => (
              <div key={expenseType}>
                {renderFeeTable(typeFees, `💳 ${expenseType.replace(/_/g, ' ')}`)}
              </div>
            ))}
            
            {fees.length === 0 && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <p className="text-gray-500">No credit card fees found</p>
              </div>
            )}
          </div>
        ) : (
          <>{renderFeeTable(fees)}</>
        )}
      </motion.div>

      {/* Pagination */}
      <div className="mt-6">
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
      </div>
    </div>
  );
};

export default CreditCardFees;
