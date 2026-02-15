import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, ShoppingCart, Package, DollarSign, AlertTriangle } from 'lucide-react';
import axios from '../api/axios';
import { Sale, Purchase, Client, Product } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const Dashboard = () => {
  const { t } = useLanguage();
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [salesRes, purchasesRes, clientsRes, productsRes] = await Promise.all([
        axios.get('/sales'),
        axios.get('/purchases'),
        axios.get('/clients'),
        axios.get('/products'),
      ]);

      setSales(salesRes.data);
      setPurchases(purchasesRes.data);
      setClients(clientsRes.data);
      setProducts(productsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalSalesAmount = sales.reduce((sum, sale) => sum + parseFloat(sale.total.toString()), 0);
  const totalPurchasesAmount = purchases.reduce((sum, purchase) => sum + parseFloat(purchase.total.toString()), 0);
  const totalRevenue = totalSalesAmount - totalPurchasesAmount;
  const lowStockProducts = products.filter(p => {
    const amount = p.amount ? parseFloat(p.amount.toString()) : 0;
    const minStock = p.minimumStock ? parseFloat(p.minimumStock.toString()) : 0;
    return amount <= minStock;
  });

  // Get recent sales (last 5)
  const recentSales = [...sales]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Get recent purchases (last 5)
  const recentPurchases = [...purchases]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const stats = [
    { 
      label: 'Total Sales', 
      value: `${totalSalesAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 
      count: sales.length,
      icon: ShoppingCart, 
      color: 'bg-blue-500' 
    },
    { 
      label: 'Total Clients', 
      value: clients.length.toString(), 
      count: clients.filter(c => c.status === 'Active').length + ' active',
      icon: Users, 
      color: 'bg-green-500' 
    },
    { 
      label: 'Total Purchases', 
      value: `${totalPurchasesAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 
      count: purchases.length,
      icon: Package, 
      color: 'bg-purple-500' 
    },
    { 
      label: 'Net Revenue', 
      value: `${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 
      count: totalRevenue >= 0 ? 'Profit' : 'Loss',
      icon: TrendingUp, 
      color: totalRevenue >= 0 ? 'bg-orange-500' : 'bg-red-500' 
    },
  ];

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
                      sale.paymentStatus === 'Paid' 
                        ? 'bg-green-100 text-green-800' 
                        : sale.paymentStatus === 'Partial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {sale.paymentStatus}
                    </span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {parseFloat(sale.total.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                    {parseFloat(purchase.total.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                {sales.filter(s => s.paymentStatus === 'Unpaid' || s.paymentStatus === 'Partial').length}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Total: {sales
              .filter(s => s.paymentStatus === 'Unpaid' || s.paymentStatus === 'Partial')
              .reduce((sum, s) => sum + parseFloat(s.balanceAmount.toString()), 0)
              .toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                {purchases.filter(p => p.paymentStatus === 'Unpaid' || p.paymentStatus === 'Partial').length}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Total: {purchases
              .filter(p => p.paymentStatus === 'Unpaid' || p.paymentStatus === 'Partial')
              .reduce((sum, p) => sum + parseFloat(p.balanceAmount.toString()), 0)
              .toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Package className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('totalProducts')}</p>
              <p className="text-xl font-bold text-gray-800">{products.length}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {products.filter(p => p.status === 'ACTIVE').length} {t('activeProducts').toLowerCase()}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

