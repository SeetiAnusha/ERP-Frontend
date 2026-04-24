import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaCalendar, FaFileAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber } from '../utils/formatNumber';
import { useSales } from '../hooks/queries/useSales';
import { usePurchases } from '../hooks/queries/usePurchases';
import { useProducts } from '../hooks/queries/useProducts';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../lib/queryKeys';
import { CACHE_STRATEGIES } from '../lib/queryClient';
import api from '../api/axios';

const Reports = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // ✅ React Query hooks for data fetching
  const { data: allSales = [], isLoading: salesLoading } = useSales();
  const { data: allPurchases = [], isLoading: purchasesLoading } = usePurchases();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  
  // ✅ Payments hook (reuse existing pattern)
  const { data: allPayments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: QUERY_KEYS.payments,
    queryFn: async () => {
      const response = await api.get('/payments');
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });

  const isLoading = salesLoading || purchasesLoading || productsLoading || paymentsLoading;

  // ✅ Memoized filtered data by date range
  const filteredData = useMemo(() => {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    const sales = allSales.filter((sale: any) => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    const purchases = allPurchases.filter((purchase: any) => {
      const purchaseDate = new Date(purchase.date);
      return purchaseDate >= startDate && purchaseDate <= endDate;
    });

    const payments = allPayments.filter((payment: any) => {
      const paymentDate = new Date(payment.registrationDate);
      return paymentDate >= startDate && paymentDate <= endDate;
    });

    return { sales, purchases, payments };
  }, [allSales, allPurchases, allPayments, dateRange]);

  // ✅ Memoized sales data calculations
  const salesData = useMemo(() => {
    const { sales } = filteredData;
    return {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum: number, sale: any) => sum + parseFloat(sale.total || 0), 0),
      paidSales: sales.filter((s: any) => s.paymentStatus === 'Paid').length,
      unpaidSales: sales.filter((s: any) => s.paymentStatus === 'Unpaid').length,
      salesCount: sales.length,
    };
  }, [filteredData]);

  // ✅ Memoized purchases data calculations
  const purchasesData = useMemo(() => {
    const { purchases } = filteredData;
    return {
      totalPurchases: purchases.length,
      totalCost: purchases.reduce((sum: number, purchase: any) => sum + parseFloat(purchase.total || 0), 0),
      paidPurchases: purchases.filter((p: any) => p.paymentStatus === 'Paid').length,
      unpaidPurchases: purchases.filter((p: any) => p.paymentStatus === 'Unpaid').length,
      purchasesCount: purchases.length,
    };
  }, [filteredData]);

  // ✅ Memoized payments data calculations
  const paymentsData = useMemo(() => {
    const { payments } = filteredData;
    const paymentsIn = payments
      .filter((p: any) => p.type === 'Payment In')
      .reduce((sum: number, p: any) => sum + parseFloat(p.paymentAmount || 0), 0);

    const paymentsOut = payments
      .filter((p: any) => p.type === 'Payment Out')
      .reduce((sum: number, p: any) => sum + parseFloat(p.paymentAmount || 0), 0);

    return {
      paymentsIn,
      paymentsOut,
      netCashFlow: paymentsIn - paymentsOut,
    };
  }, [filteredData]);

  // ✅ Memoized products data calculations
  const productsData = useMemo(() => {
    return {
      totalProducts: products.length,
      lowStockProducts: products.filter((p: any) => parseFloat(p.amount) <= parseFloat(p.minimumStock)).length,
      totalInventoryValue: products.reduce((sum: number, p: any) => 
        sum + (parseFloat(p.amount) * parseFloat(p.unitCost)), 0
      ),
    };
  }, [products]);

  // ✅ Memoized profit calculations
  const profitCalculations = useMemo(() => {
    const profitMargin = salesData.totalRevenue - purchasesData.totalCost;
    const profitMarginPercentage = salesData.totalRevenue > 0 
      ? formatNumber(((profitMargin / salesData.totalRevenue) * 100), 2)
      : '0.00';
    
    return { profitMargin, profitMarginPercentage };
  }, [salesData.totalRevenue, purchasesData.totalCost]);

  const { profitMargin, profitMarginPercentage } = profitCalculations;

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
            <h2 className="text-3xl font-bold text-gray-800">{t('businessReports')}</h2>
            <p className="text-gray-600 mt-1">{t('analyticsAndInsights')}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FaCalendar className="text-gray-500" />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">{t('to')}</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">{t('totalRevenue')}</h3>
            <FaChartLine className="text-2xl opacity-75" />
          </div>
          <p className="text-3xl font-bold">
            {formatNumber(salesData.totalRevenue)}
          </p>
          <p className="text-sm opacity-75 mt-2">{salesData.salesCount} {t('sales').toLowerCase()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">{t('totalCost')}</h3>
            <FaChartLine className="text-2xl opacity-75" />
          </div>
          <p className="text-3xl font-bold">
            {formatNumber(purchasesData.totalCost)}
          </p>
          <p className="text-sm opacity-75 mt-2">{purchasesData.purchasesCount} {t('purchases').toLowerCase()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">{t('grossProfit')}</h3>
            <FaChartLine className="text-2xl opacity-75" />
          </div>
          <p className="text-3xl font-bold">
            {formatNumber(profitMargin)}
          </p>
          <p className="text-sm opacity-75 mt-2">{profitMarginPercentage}% {t('grossMargin').toLowerCase()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">{t('netCashFlow')}</h3>
            <FaChartLine className="text-2xl opacity-75" />
          </div>
          <p className="text-3xl font-bold">
            {formatNumber(paymentsData.netCashFlow)}
          </p>
          <p className="text-sm opacity-75 mt-2">{t('paymentsIn')} - {t('paymentsOut')}</p>
        </motion.div>
      </div>

      {/* Specialized Reports Links */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">{t('reports')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/reports/ppe')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-blue-200 transition text-left"
          >
            <FaFileAlt className="text-2xl text-blue-600 mb-2" />
            <h4 className="font-semibold text-gray-800">{t('fixedAssets')}</h4>
            <p className="text-sm text-gray-600 mt-1">Property, Plant & Equipment with depreciation schedules</p>
          </button>

          <button
            onClick={() => navigate('/reports/investments')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border-2 border-green-200 transition text-left"
          >
            <FaFileAlt className="text-2xl text-green-600 mb-2" />
            <h4 className="font-semibold text-gray-800">{t('investments')}</h4>
            <p className="text-sm text-gray-600 mt-1">Portfolio performance and ROI analysis</p>
          </button>

          <button
            onClick={() => navigate('/master-data/inventory')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border-2 border-purple-200 transition text-left"
          >
            <FaFileAlt className="text-2xl text-purple-600 mb-2" />
            <h4 className="font-semibold text-gray-800">{t('inventory')}</h4>
            <p className="text-sm text-gray-600 mt-1">Detailed inventory tracking with COGS and margins</p>
          </button>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Report */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            {t('salesOverview')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{t('totalSales')}</span>
              <span className="font-semibold">{salesData.salesCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{t('totalRevenue')}</span>
              <span className="font-semibold text-blue-600">
                {formatNumber(salesData.totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{t('paid')} {t('sales')}</span>
              <span className="font-semibold text-green-600">{salesData.paidSales}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{t('unpaid')} {t('sales')}</span>
              <span className="font-semibold text-red-600">{salesData.unpaidSales}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Average Sale Value</span>
              <span className="font-semibold">
                {salesData.salesCount > 0 
                  ? formatNumber(salesData.totalRevenue / salesData.salesCount)
                  : '0.00'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Purchases Report */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            {t('purchasesOverview')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{t('totalPurchases')}</span>
              <span className="font-semibold">{purchasesData.purchasesCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{t('totalCost')}</span>
              <span className="font-semibold text-purple-600">
                {formatNumber(purchasesData.totalCost)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{t('paid')} {t('purchases')}</span>
              <span className="font-semibold text-green-600">{purchasesData.paidPurchases}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{t('unpaid')} {t('purchases')}</span>
              <span className="font-semibold text-red-600">{purchasesData.unpaidPurchases}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Average Purchase Value</span>
              <span className="font-semibold">
                {purchasesData.purchasesCount > 0 
                  ? formatNumber(purchasesData.totalCost / purchasesData.purchasesCount)
                  : '0.00'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Cash Flow Report */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            {t('cashFlowOverview')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-gray-600">{t('paymentsIn')} ({t('received')})</span>
              <span className="font-semibold text-green-600">
                {formatNumber(paymentsData.paymentsIn)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
              <span className="text-gray-600">{t('paymentsOut')} ({t('paid')})</span>
              <span className="font-semibold text-red-600">
                {formatNumber(paymentsData.paymentsOut)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-gray-600 font-medium">{t('netCashFlow')}</span>
              <span className={`font-bold text-lg ${paymentsData.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatNumber(paymentsData.netCashFlow)}
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Report */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            {t('inventoryOverview')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{t('totalProducts')}</span>
              <span className="font-semibold">{productsData.totalProducts}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{t('lowStockProducts')}</span>
              <span className="font-semibold text-red-600">{productsData.lowStockProducts}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{t('totalInventoryValue')}</span>
              <span className="font-semibold text-orange-600">
                {formatNumber(productsData.totalInventoryValue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profitability Analysis */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">{t('profitAnalysis')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">{t('totalRevenue')}</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatNumber(salesData.totalRevenue)}
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600 mb-1">{t('totalCost')}</p>
            <p className="text-2xl font-bold text-red-600">
              {formatNumber(purchasesData.totalCost)}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 mb-1">{t('grossProfit')}</p>
            <p className="text-2xl font-bold text-green-600">
              {formatNumber(profitMargin)}
            </p>
            <p className="text-sm text-gray-600 mt-1">{profitMarginPercentage}% {t('grossMargin').toLowerCase()}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Reports;

