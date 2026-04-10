import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaBook, FaFilter, FaDownload } from 'react-icons/fa';
import { useGeneralLedger, useChartOfAccounts } from '../hooks/queries/useAccounting';
import { formatNumber } from '../utils/formatNumber';
import Pagination from '../components/common/Pagination';
import { usePagination } from '../hooks/usePagination';

const GeneralLedger = () => {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    accountCode: '',
    sourceModule: '',
  });

  const { data: accounts = [] } = useChartOfAccounts();
  const { data: entries = [], isLoading } = useGeneralLedger(filters);

  const { pagination, updatePagination, goToPage, nextPage, prevPage, firstPage, lastPage, changeLimit } = 
    usePagination({ initialPage: 1, initialLimit: 50 });

  // Client-side pagination calculation
  const paginatedData = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return entries.slice(startIndex, endIndex);
  }, [entries, pagination.page, pagination.limit]);

  // Update pagination metadata when entries change
  useMemo(() => {
    const totalPages = Math.ceil(entries.length / pagination.limit);
    const from = entries.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
    const to = Math.min(pagination.page * pagination.limit, entries.length);
    
    updatePagination({
      total: entries.length,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
      from,
      to
    });
  }, [entries.length, pagination.page, pagination.limit, updatePagination]);

  const sourceModules = ['PURCHASE', 'SALE', 'PAYMENT', 'ADJUSTMENT', 'CLOSING'];

  const calculateRunningBalance = (entries: any[]) => {
    // Track balance per account (each account has its own balance)
    const accountBalances: Record<number, number> = {};
    
    return entries.map((entry: any) => {
      const accountId = entry.accountId;
      const account = entry.ChartOfAccount;
      
      // If no account info, return 0 balance
      if (!account) {
        return { ...entry, runningBalance: 0 };
      }
      
      // Initialize account balance if first time seeing this account
      if (!(accountId in accountBalances)) {
        accountBalances[accountId] = 0;
      }
      
      // Calculate balance based on account's normal balance type
      if (account.normalBalance === 'DEBIT') {
        // For DEBIT accounts (ASSET, EXPENSE):
        // Debits INCREASE balance, Credits DECREASE balance
        if (entry.entryType === 'DEBIT') {
          accountBalances[accountId] += parseFloat(entry.amount);
        } else {
          accountBalances[accountId] -= parseFloat(entry.amount);
        }
      } else {
        // For CREDIT accounts (LIABILITY, EQUITY, REVENUE):
        // Credits INCREASE balance, Debits DECREASE balance
        if (entry.entryType === 'CREDIT') {
          accountBalances[accountId] += parseFloat(entry.amount);
        } else {
          accountBalances[accountId] -= parseFloat(entry.amount);
        }
      }
      
      return { 
        ...entry, 
        runningBalance: accountBalances[accountId] 
      };
    });
  };

  const entriesWithBalance = calculateRunningBalance(paginatedData);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FaBook className="text-blue-600" />
              General Ledger
            </h2>
            <p className="text-gray-600 mt-1">Complete transaction history</p>
          </div>
          
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <FaDownload />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h3 className="text-lg font-semibold">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account
            </label>
            <select
              value={filters.accountCode}
              onChange={(e) => setFilters({ ...filters, accountCode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Accounts</option>
              {accounts.map((account: any) => (
                <option key={account.id} value={account.accountCode}>
                  {account.accountCode} - {account.accountName}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Module
            </label>
            <select
              value={filters.sourceModule}
              onChange={(e) => setFilters({ ...filters, sourceModule: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Modules</option>
              {sourceModules.map((module) => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Total Entries</h3>
          <p className="text-3xl font-bold">{entries.length}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Total Debits</h3>
          <p className="text-3xl font-bold">
            {formatNumber(entries.filter((e: any) => e.entryType === 'DEBIT').reduce((sum: number, e: any) => sum + e.amount, 0))}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Total Credits</h3>
          <p className="text-3xl font-bold">
            {formatNumber(entries.filter((e: any) => e.entryType === 'CREDIT').reduce((sum: number, e: any) => sum + e.amount, 0))}
          </p>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entry #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entriesWithBalance.map((entry: any) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(entry.entryDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-blue-600">
                      {entry.entryNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {entry.ChartOfAccount?.accountCode}
                    </div>
                    <div className="text-sm text-gray-500">
                      {entry.ChartOfAccount?.accountName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {entry.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                      {entry.sourceModule}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {entry.sourceTransactionNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                    {entry.entryType === 'DEBIT' ? formatNumber(entry.amount) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                    {entry.entryType === 'CREDIT' ? formatNumber(entry.amount) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                    {formatNumber(entry.runningBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {entries.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-lg">No entries found</p>
          </div>
        )}

        {entries.length > 0 && (
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
            onFirst={firstPage}
            onLast={lastPage}
            onNext={nextPage}
            onPrev={prevPage}
          />
        )}
      </div>
    </motion.div>
  );
};

export default GeneralLedger;
