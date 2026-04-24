import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  FileText,
  TrendingUp,
  BookOpen,
  Package,
  Shield,
  Building,
  BarChart3,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

interface Module {
  id: string;
  title: string;
  description: string;
  icon: typeof Box;
  path: string;
  color: string;
  bgColor: string;
  count?: number;
}

const ModuleDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const modules: Module[] = [
    {
      id: 'master-data',
      title: 'Master Data',
      description: 'Manage products, suppliers, customers, inventory, and core business data',
      icon: Box,
      path: '/master-data',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      count: 9,
    },
    {
      id: 'transactions',
      title: 'Transactions',
      description: 'Record sales, purchases, and daily business operations',
      icon: FileText,
      path: '/transactions',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      count: 8,
    },
    {
      id: 'expenses',
      title: 'Expenses',
      description: 'Track and manage business expenses and credit card fees',
      icon: TrendingUp,
      path: '/expenses',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      count: 4,
    },
    {
      id: 'accounting',
      title: 'Accounting',
      description: 'Financial management, general ledger, and reporting',
      icon: BookOpen,
      path: '/accounting',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      count: 5,
    },
    {
      id: 'assets',
      title: 'Assets & Financing',
      description: 'Manage fixed assets, investments, loans, and financing',
      icon: Building,
      path: '/assets',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      count: 8,
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'Generate business intelligence and analytical reports',
      icon: BarChart3,
      path: '/reports',
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      count: 3,
    },
  ];

  // Add Administration module for ALL users (everyone needs data classification and transaction deletion)
  // Count varies by role: admin/manager see 3 items, regular users see 2 items
  const adminCount = user && (user.role === 'admin' || user.role === 'manager') ? 3 : 2;
  
  modules.push({
    id: 'administration',
    title: 'Administration',
    description: user && (user.role === 'admin' || user.role === 'manager')
      ? 'User management, roles, permissions, and system configuration'
      : 'Data classification and transaction deletion management',
    icon: Shield,
    path: '/administration',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    count: adminCount,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with User Info and Logout */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">ERP System</h2>
              <p className="text-sm text-gray-600">Enterprise Resource Planning</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              
              {/* User Info and Logout */}
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User size={16} />
                    <span>{user.firstName} {user.lastName}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {user.role}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Logout"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to Your ERP System
          </h1>
          <p className="text-xl text-gray-600">
            Select a module to get started with your business operations
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
        >
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">$0</p>
                <p className="text-green-600 text-sm mt-1">+0% from last month</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="text-green-600" size={32} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Expenses</p>
                <p className="text-3xl font-bold text-gray-900">$0</p>
                <p className="text-blue-600 text-sm mt-1">+0% from last month</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={32} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Net Profit</p>
                <p className="text-3xl font-bold text-gray-900">$0</p>
                <p className="text-purple-600 text-sm mt-1">+0% from last month</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BookOpen className="text-purple-600" size={32} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Inventory Value</p>
                <p className="text-3xl font-bold text-gray-900">$0</p>
                <p className="text-orange-600 text-sm mt-1">0 items in stock</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="text-orange-600" size={32} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Link key={module.id} to={module.path}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group"
                >
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-4 ${module.bgColor} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={module.color} size={32} />
                      </div>
                      {module.count && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                          {module.count} items
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {module.description}
                    </p>
                  </div>
                  <div className={`h-2 ${module.bgColor} group-hover:h-3 transition-all duration-300`}></div>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center text-gray-500 text-sm"
        >
          <p>Click on any module to access its features and manage your business operations</p>
        </motion.div>
      </div>
    </div>
  );
};

export default ModuleDashboard;
