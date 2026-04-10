import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  PieChart, 
  AlertCircle,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react';
import { formatNumber } from '../utils/formatNumber';
import { useBusinessExpenseDashboard } from '../hooks/queries/useFinancial';

/**
 * ExpenseDashboard Component
 * 
 * Senior Developer Features:
 * - Real-time expense analytics
 * - Interactive charts and visualizations
 * - Period filtering (week, month, quarter, year)
 * - Export functionality
 * - Error handling with retry mechanism
 * - Loading states and skeleton UI
 * - Responsive design
 * - Performance optimization with caching
 */

interface ExpenseDashboardProps {
  className?: string;
  showFilters?: boolean;
}

const ExpenseDashboard = ({
  className = '',
  showFilters = true
}: ExpenseDashboardProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // ✅ FIXED: Use React Query hook for dashboard data
  const { data: dashboardData, isLoading: loading, error: queryError, refetch } = useBusinessExpenseDashboard(selectedPeriod);
  
  const error = queryError ? (queryError as any).message : null;

  const periods = [
    { value: 'all', label: 'All Records' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ];

  // ✅ FIXED: Manual refresh now uses React Query refetch
  const handleRefresh = () => {
    refetch();
  };

  const exportData = async () => {
    try {
      // This would typically generate and download a report
      const dataToExport = {
        period: selectedPeriod,
        generatedAt: new Date().toISOString(),
        summary: dashboardData?.summary,
        breakdowns: dashboardData?.breakdowns,
        topCategories: dashboardData?.topCategories
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-dashboard-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const renderMetricCard = (
    title: string,
    value: number,
    icon: React.ElementType,
    color: string,
    trend?: number,
    format: 'currency' | 'number' = 'currency'
  ) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {format === 'currency' ? formatNumber(value || 0) : (value || 0).toLocaleString()}
          </p>
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              trend >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {Math.abs(trend).toFixed(1)}% vs last period
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {React.createElement(icon, { className: 'h-6 w-6 text-white' })}
        </div>
      </div>
    </motion.div>
  );

  const renderTopCategories = () => {
    if (!dashboardData?.topCategories?.length) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Expense Categories</h3>
          <PieChart className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="space-y-4">
          {dashboardData.topCategories.slice(0, 5).map((item: any, index: number) => {
            const totalAmount = dashboardData.summary?.totalAmount || 0;
            const percentage = totalAmount > 0 
              ? ((item.amount || 0) / totalAmount) * 100 
              : 0;
            
            return (
              <div key={`category-${item.category?.id || index}`} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full bg-blue-${500 + index * 100}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.category?.name || 'Unknown Category'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.count || 0} transaction{(item.count || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatNumber(item.amount || 0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderStatusBreakdown = () => {
    if (!dashboardData?.breakdowns?.byStatus?.length) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Payment Status</h3>
          <Receipt className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="space-y-3">
          {dashboardData.breakdowns.byStatus.map((item: any) => {
            const statusColors: Record<string, string> = {
              'PAID': 'bg-green-100 text-green-800',
              'PENDING': 'bg-yellow-100 text-yellow-800',
              'PARTIALLY_PAID': 'bg-blue-100 text-blue-800',
              'CANCELLED': 'bg-red-100 text-red-800'
            };
            
            return (
              <div key={`status-${item.status}`} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    statusColors[item.status] || 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-600">
                    {item.count} expense{item.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatNumber(item.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderLoadingSkeleton = () => (
    <div className="space-y-6">
      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={`skeleton-metric-${i}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={`skeleton-chart-${i}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map(j => (
                  <div key={`skeleton-item-${i}-${j}`} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderError = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h3>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={handleRefresh}
        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 mx-auto"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    </div>
  );

  if (loading && !dashboardData) {
    return (
      <div className={className}>
        {renderLoadingSkeleton()}
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className={className}>
        {renderError()}
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expense Dashboard</h2>
          <p className="text-gray-600">
            Overview for {periods.find(p => p.value === selectedPeriod)?.label}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {showFilters && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {periods.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={exportData}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {renderMetricCard(
          'Total Expenses',
          dashboardData.summary?.totalAmount || 0,
          DollarSign,
          'bg-blue-500'
        )}
        {renderMetricCard(
          'Total Transactions',
          dashboardData.summary?.totalPurchases || 0,
          Receipt,
          'bg-green-500',
          undefined,
          'number'
        )}
        {renderMetricCard(
          'Paid Amount',
          dashboardData.summary?.paidAmount || 0,
          TrendingUp,
          'bg-emerald-500'
        )}
        {renderMetricCard(
          'Outstanding Balance',
          dashboardData.summary?.balanceAmount || 0,
          TrendingDown,
          'bg-amber-500'
        )}
      </div>

      {/* Payment Progress */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Payment Progress</h3>
          <span className="text-sm text-gray-500">
            {(dashboardData.summary?.paymentPercentage || 0).toFixed(1)}% paid
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${dashboardData.summary?.paymentPercentage || 0}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="bg-blue-600 h-3 rounded-full"
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Paid: {formatNumber(dashboardData.summary?.paidAmount || 0)}</span>
          <span>Outstanding: {formatNumber(dashboardData.summary?.balanceAmount || 0)}</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTopCategories()}
        {renderStatusBreakdown()}
      </div>
    </div>
  );
};

export default ExpenseDashboard;