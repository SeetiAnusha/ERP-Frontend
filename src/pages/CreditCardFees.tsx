import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Eye, CreditCard, Calendar, X } from 'lucide-react';
import { useTableData } from '../hooks/useTableData';
import { Pagination } from '../components/common/Pagination';
import { SearchBar } from '../components/common/SearchBar';

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
  // ✅ Added AR fields
  accountsReceivable?: {
    id: number;
    registrationNumber: string;
    clientName?: string;
    clientRnc?: string;
    ncf?: string;
    transferNumber?: string;
    transferDate?: string;
    paymentReference?: string;
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

  // ✅ FIX: Use generic table data hook with pagination - MUST be called before any conditional returns
  const {
    data: fees,
    loading,
    error,
    pagination,
    search,
    updateSearch,
    goToPage,
    changeLimit,
    updateFilter
  } = useTableData<CreditCardFeeRecord>({
    endpoint: 'credit-card-fees',  // ✅ FIXED: No leading slash (baseURL already has /api)
    initialLimit: 50,
    initialSortBy: 'transactionDate',
    initialSortOrder: 'DESC'
  });

  // ✅ FIX: Define all callbacks BEFORE any conditional returns (React hooks rule)
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

  const handleDateRangeChange = useCallback((field: 'startDate' | 'endDate', value: string) => {
    setTableDateRange(prev => {
      const newRange = { ...prev, [field]: value };
      // Update filter when both dates are set
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

  // Debug logging
  console.log('🔍 Credit Card Fees Debug:', {
    feesCount: fees?.length || 0,
    feesIsArray: Array.isArray(fees),
    loading,
    error,
    pagination,
    fees: fees?.slice(0, 2) // Show first 2 records
  });

  // ✅ FIX: Show error AFTER all hooks are called
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

  // ✅ FIX: Show loading AFTER all hooks are called
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading credit card fees...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CreditCard className="text-blue-600" />
            Credit Card Fees
          </h1>
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
            <SearchBar
              value={search}
              onChange={updateSearch}
              placeholder="Search fees..."
            />
          </div>
        </div>
      </div>

      {/* Fees Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Info Banner */}
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                About Credit Card Processing Fees
              </h4>
              <p className="text-sm text-blue-800">
                These fees are automatically recorded when collecting AR payments via credit card. 
                They represent the processing costs charged by payment processors (Visa, Mastercard, etc.).
              </p>
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Processing Fee Records ({pagination.total})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            🔒 Read-only records automatically generated from AR collections
          </p>
        </div>

        {/* Table */}
        {!fees || fees.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-gray-500 mt-2">
              {loading ? 'Loading...' : 'No processing fees found for the selected period'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Total records: {pagination.total || 0}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">TRANSACTION #</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">DATE</th>
                  {/* <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">CLIENT NAME</th> */}
                  {/* <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">CLIENT RNC</th> */}
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">FEE AMOUNT</th>
                  {/* <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">NCF</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">CARD TYPE</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">CARD LAST 4</th> */}
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">RELATED AR</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">AR CLIENT NAME</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">AR CLIENT RNC</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">AR NCF</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">TRANSFER REF</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">STATUS</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee: CreditCardFeeRecord, index: number) => (
                  <motion.tr
                    key={fee.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">💳</span>
                        {fee.transactionNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(fee.transactionDate).toLocaleDateString()}
                    </td>
                    {/* <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{fee.customerName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {fee.clientRnc || '-'}
                    </td> */}
                    {/* <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                      {fee.paymentAmount ? `$${fee.paymentAmount.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">
                      {fee.feePercentage ? `${fee.feePercentage}%` : '-'}
                    </td> */}
                    <td className="px-6 py-4 text-sm text-right font-bold text-red-600">
                      {fee.feeAmount ? `${fee.feeAmount}` : '-'}
                    </td>
                    {/* <td className="px-6 py-4 text-sm text-gray-600">
                      {fee.ncf || '-'}
                    </td> */}
                    {/* <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                        {fee.cardType || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">
                      {fee.cardLastFour ? `**** ${fee.cardLastFour}` : '-'}
                    </td> */}
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
                      {fee.accountsReceivable?.clientName || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {fee.accountsReceivable?.clientRnc || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {fee.accountsReceivable?.ncf || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {fee.accountsReceivable?.transferNumber || '-'}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ✅ Pagination - Always visible, sticky at bottom */}
      <div className="bg-white rounded-lg shadow-sm p-4 sticky bottom-0 z-10">
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
          onFirst={() => goToPage(1)}
          onLast={() => goToPage(pagination.totalPages)}
          onNext={() => goToPage(pagination.page + 1)}
          onPrev={() => goToPage(pagination.page - 1)}
        />
      </div>
    </div>
  );
};

export default CreditCardFees;
