import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  CreditCard,
  FolderTree,
  Receipt,
  ArrowLeft,
} from 'lucide-react';

interface MenuItem {
  path: string;
  icon: typeof TrendingUp;
  label: string;
  description: string;
}

const ExpensesModule = () => {
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { 
      path: '/expenses/business-expenses', 
      icon: TrendingUp, 
      label: 'Business Expenses',
      description: 'Manage and track business expenses'
    },
    { 
      path: '/expenses/credit-card-fees', 
      icon: CreditCard, 
      label: 'Credit Card Fees',
      description: 'Track credit card processing fees'
    },
    { 
      path: '/expenses/expense-categories', 
      icon: FolderTree, 
      label: 'Expense Categories',
      description: 'Configure expense categories and types'
    },
    { 
      path: '/expenses/credit-balances', 
      icon: Receipt, 
      label: 'Credit Balances',
      description: 'Manage credit balances and adjustments'
    },
  ];

  const isModuleHome = location.pathname === '/expenses';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 bg-gradient-to-b from-orange-600 to-orange-800 text-white shadow-xl overflow-y-auto"
      >
        <div className="p-6 border-b border-orange-500">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-orange-100 transition-colors mb-2">
            <ArrowLeft size={20} />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold mt-2">💰 Expenses</h1>
          <p className="text-orange-100 text-sm mt-1">Track and manage expenses</p>
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
                      ? 'bg-white text-orange-600 shadow-lg'
                      : 'hover:bg-orange-700'
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
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Expense Management</h1>
              <p className="text-gray-600 text-lg mb-8">
                Track and manage all your business expenses. Select an option from the sidebar to get started.
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Expenses</p>
                      <p className="text-3xl font-bold text-gray-800">$0</p>
                    </div>
                    <TrendingUp className="text-orange-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Card Fees</p>
                      <p className="text-3xl font-bold text-gray-800">$0</p>
                    </div>
                    <CreditCard className="text-red-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Categories</p>
                      <p className="text-3xl font-bold text-gray-800">0</p>
                    </div>
                    <FolderTree className="text-purple-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Credit Balance</p>
                      <p className="text-3xl font-bold text-gray-800">$0</p>
                    </div>
                    <Receipt className="text-green-500" size={40} />
                  </div>
                </div>
              </div>

              {/* Menu Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <div className="p-3 bg-orange-100 rounded-lg">
                            <Icon className="text-orange-600" size={24} />
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

export default ExpensesModule;
