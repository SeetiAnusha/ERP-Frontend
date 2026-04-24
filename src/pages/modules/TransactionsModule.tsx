import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  ShoppingBag,
  FileText,
  CreditCard,
  Settings,
  ArrowLeft,
  Wallet,
  Building2,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface MenuItem {
  path: string;
  icon: typeof ShoppingCart;
  label: string;
  description: string;
}

const TransactionsModule = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const menuItems: MenuItem[] = [
    { 
      path: '/transactions/sales', 
      icon: ShoppingCart, 
      label: t('sales'),
      description: 'Record and manage sales transactions'
    },
    { 
      path: '/transactions/purchases', 
      icon: ShoppingBag, 
      label: t('purchases'),
      description: 'Record and manage purchase orders'
    },
    { 
      path: '/transactions/accounts-receivable', 
      icon: FileText, 
      label: 'Accounts Receivable',
      description: 'Manage customer receivables and collections'
    },
    { 
      path: '/transactions/accounts-payable', 
      icon: CreditCard, 
      label: 'Accounts Payable',
      description: 'Manage supplier payables and payments'
    },
    { 
      path: '/transactions/cash-register', 
      icon: Wallet, 
      label: t('cashRegister'),
      description: 'Cash register transactions and movements'
    },
    { 
      path: '/transactions/bank-register', 
      icon: Building2, 
      label: 'Bank Register',
      description: 'Bank account transactions and reconciliation'
    },
    { 
      path: '/transactions/credit-card-register', 
      icon: CreditCard, 
      label: 'Credit Card Register',
      description: 'Credit card transactions and statements'
    },
    { 
      path: '/transactions/adjustments', 
      icon: Settings, 
      label: t('adjustments'),
      description: 'Inventory and accounting adjustments'
    },
  ];

  const isModuleHome = location.pathname === '/transactions';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-xl overflow-y-auto"
      >
        <div className="p-6 border-b border-blue-500">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors mb-2">
            <ArrowLeft size={20} />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold mt-2">📝 Transactions</h1>
          <p className="text-blue-100 text-sm mt-1">Manage daily operations</p>
        </div>
        <nav className="p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 p-3 rounded-lg mb-2 transition-all ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-lg'
                      : 'hover:bg-blue-700'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {isModuleHome ? (
          <div className="p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto"
            >
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Transaction Management</h1>
              <p className="text-gray-600 text-lg mb-8">
                Record and manage all your business transactions. Select an option from the sidebar to get started.
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Today's Sales</p>
                      <p className="text-3xl font-bold text-gray-800">0</p>
                    </div>
                    <ShoppingCart className="text-green-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Today's Purchases</p>
                      <p className="text-3xl font-bold text-gray-800">0</p>
                    </div>
                    <ShoppingBag className="text-orange-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Pending Receivables</p>
                      <p className="text-3xl font-bold text-gray-800">0</p>
                    </div>
                    <FileText className="text-blue-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Pending Payables</p>
                      <p className="text-3xl font-bold text-gray-800">0</p>
                    </div>
                    <CreditCard className="text-red-500" size={40} />
                  </div>
                </div>
              </div>

              {/* Menu Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} to={item.path}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border border-gray-100"
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Icon className="text-blue-600" size={24} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                              {item.label}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="p-6">
            <Outlet />
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsModule;
