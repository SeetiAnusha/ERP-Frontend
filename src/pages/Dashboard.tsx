import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, ShoppingCart, Package, DollarSign, AlertTriangle } from 'lucide-react';
import { Sale, Purchase, Client, Product } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber } from '../utils/formatNumber';
import CreditBalanceSummaryWidget from '../components/CreditBalanceSummaryWidget';
import { useSales } from '../hooks/queries/useSales';
import { usePurchases } from '../hooks/queries/usePurchases';
import { useClients } from '../hooks/queries/useSharedData';
import { useProducts } from '../hooks/queries/useProducts';

const Dashboard = () => {
  const { t } = useLanguage();
  
  // ✅ REACT QUERY: Replace manual API calls with hooks
  const { data: sales = [], isLoading: isLoadingSales } = useSales();
  const { data: purchases = [], isLoading: isLoadingPurchases } = usePurchases();
  const { data: clients = [], isLoading: isLoadingClients } = useClients();
  const { data: products = [], isLoading: isLoadingProducts } = useProducts();
  
  // ✅ Combined loading state
  const loading = isLoadingSales || isLoadingPurchases || isLoadingClients || isLoadingProducts;

  // ✅ Memoized: Calculate statistics
  const totalSalesAmount = useMemo(() => {
    return Array.isArray(sales) ? sales.reduce((sum, sale) => sum + parseFloat(sale.total.toString()), 0) : 0;
  }, [sales]);

  const totalPurchasesAmount = useMemo(() => {
    return Array.isArray(purchases) ? purchases.reduce((sum, purchase) => sum + parseFloat(purchase.total.toString()), 0) : 0;
  }, [purchases]);

  const totalRevenue = useMemo(() => {
    return totalSalesAmount - totalPurchasesAmount;
  }, [totalSalesAmount, totalPurchasesAmount]);

  const lowStockProducts = useMemo(() => {
    return Array.isArray(products) ? products.filter(p => {
      const amount = p.amount ? parseFloat(p.amount.toString()) : 0;
      const minStock = p.minimumStock ? parseFloat(p.minimumStock.toString()) : 0;
      return amount <= minStock;
    }) : [];
  }, [products]);

  // ✅ Memoized: Get recent sales (last 5)
  const recentSales = useMemo(() => {
    return Array.isArray(sales) ? [...sales]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5) : [];
  }, [sales]);

  // ✅ Memoized: Get recent purchases (last 5)
  const recentPurchases = useMemo(() => {
    return Array.isArray(purchases) ? [...purchases]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5) : [];
  }, [purchases]);

  // ✅ Memoized: Stats array
  const stats = useMemo(() => [
    { 
      label: 'Total Sales', 
      value: `${formatNumber(totalSalesAmount)}`, 
      count: Array.isArray(sales) ? sales.length : 0,
      icon: ShoppingCart, 
      color: 'bg-blue-500' 
    },
    { 
      label: 'Total Clients', 
      value: Array.isArray(clients) ? clients.length.toString() : '0', 
      count: Array.isArray(clients) ? (clients.filter(c => c.status === 'Active').length + ' active') : '0 active',
      icon: Users, 
      color: 'bg-green-500' 
    },
    { 
      label: 'Total Purchases', 
      value: `${formatNumber(totalPurchasesAmount)}`, 
      count: Array.isArray(purchases) ? purchases.length : 0,
      icon: Package, 
      color: 'bg-purple-500' 
    },
    { 
      label: 'Net Revenue', 
      value: `${formatNumber(totalRevenue)}`, 
      count: totalRevenue >= 0 ? 'Profit' : 'Loss',
      icon: TrendingUp, 
      color: totalRevenue >= 0 ? 'bg-orange-500' : 'bg-red-500' 
    },
  ], [totalSalesAmount, totalPurchasesAmount, totalRevenue, sales, purchases, clients]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                  <p className="text-sm text-gray-500 mt-2">{stat.count}</p>
                </div>
                <div className={`${stat.color} p-4 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-yellow-600" size={24} />
            <div>
              <h4 className="font-semibold text-yellow-800">{t('lowStockAlert')}</h4>
              <p className="text-sm text-yellow-700">
                {lowStockProducts.length} {t('product').toLowerCase()}{lowStockProducts.length > 1 ? 's' : ''} {t('stock').toLowerCase()}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('recentSales')}</h3>
            <ShoppingCart className="text-blue-500" size={20} />
          </div>
          <div className="space-y-3">
            {recentSales.length > 0 ? (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div>
                    <p className="font-medium">{sale.registrationNumber}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(sale.date).toLocaleDateString()}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      sale.collectionStatus === 'Collected' 
                        ? 'bg-green-100 text-green-800' 
                        : sale.collectionStatus === 'Partial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {sale.collectionStatus}
                    </span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {formatNumber(parseFloat(sale.total.toString()))}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">{t('noSalesYet')}</p>
            )}
          </div>
        </motion.div>

        {/* Recent Purchases */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('recentPurchases')}</h3>
            <Package className="text-purple-500" size={20} />
          </div>
          <div className="space-y-3">
            {recentPurchases.length > 0 ? (
              recentPurchases.map((purchase) => (
                <div key={purchase.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div>
                    <p className="font-medium">{purchase.registrationNumber}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(purchase.date).toLocaleDateString()}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      purchase.paymentStatus === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : purchase.paymentStatus === 'Partial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {purchase.paymentStatus}
                    </span>
                  </div>
                  <span className="font-semibold text-blue-600">
                    {formatNumber(parseFloat(purchase.total.toString()))}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">{t('noPurchasesYet')}</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <DollarSign className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('unpaidSales')}</p>
              <p className="text-xl font-bold text-gray-800">
                {Array.isArray(sales) ? sales.filter(s => s.collectionStatus === 'Not Collected' || s.collectionStatus === 'Partial').length : 0}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Total: {formatNumber(Array.isArray(sales) ? sales
              .filter(s => s.collectionStatus === 'Not Collected' || s.collectionStatus === 'Partial')
              .reduce((sum, s) => sum + parseFloat(s.balanceAmount.toString()), 0) : 0)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('unpaidPurchases')}</p>
              <p className="text-xl font-bold text-gray-800">
                {Array.isArray(purchases) ? purchases.filter(p => p.paymentStatus === 'Unpaid' || p.paymentStatus === 'Partial').length : 0}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Total: {formatNumber(Array.isArray(purchases) ? purchases
              .filter(p => p.paymentStatus === 'Unpaid' || p.paymentStatus === 'Partial')
              .reduce((sum, p) => sum + parseFloat(p.balanceAmount.toString()), 0) : 0)}
          </p>
        </motion.div>

        {/* Credit Balance Summary Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <CreditBalanceSummaryWidget />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

