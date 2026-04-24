import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  Users,
  Package,
  Building2,
  CreditCard,
  DollarSign,
  Landmark,
  ArrowLeft,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface MenuItem {
  path: string;
  icon: typeof Box;
  label: string;
  description: string;
}

const MasterDataModule = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const menuItems: MenuItem[] = [
    { 
      path: '/master-data/products', 
      icon: Box, 
      label: t('products'),
      description: 'Manage product catalog and inventory items'
    },
    { 
      path: '/master-data/inventory', 
      icon: Package, 
      label: t('inventory'),
      description: 'Track stock levels, movements, and valuation'
    },
    { 
      path: '/master-data/inventory-assistant', 
      icon: Package, 
      label: 'Inventory Assistant',
      description: 'View inventory snapshot by date with total value'
    },
    { 
      path: '/master-data/suppliers', 
      icon: Package, 
      label: t('suppliers'),
      description: 'Manage supplier information and contacts'
    },
    { 
      path: '/master-data/clients', 
      icon: Users, 
      label: t('clients'),
      description: 'Manage customer information and accounts'
    },
    { 
      path: '/master-data/bank-accounts', 
      icon: Building2, 
      label: t('bankAccounts'),
      description: 'Manage company bank accounts'
    },
    { 
      path: '/master-data/cards', 
      icon: CreditCard, 
      label: t('cards'),
      description: 'Manage credit and debit cards'
    },
    { 
      path: '/master-data/cash-registers', 
      icon: DollarSign, 
      label: t('cashRegisters'),
      description: 'Manage cash register configurations'
    },
    { 
      path: '/master-data/financers', 
      icon: Landmark, 
      label: t('financers'),
      description: 'Manage financing institutions'
    },
    { 
      path: '/master-data/card-networks', 
      icon: CreditCard, 
      label: 'Card Payment Networks',
      description: 'Manage credit card payment networks'
    },
  ];

  const isModuleHome = location.pathname === '/master-data';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 bg-gradient-to-b from-green-600 to-green-800 text-white shadow-xl overflow-y-auto"
      >
        <div className="p-6 border-b border-green-500">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-green-100 transition-colors mb-2">
            <ArrowLeft size={20} />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold mt-2">📦 Master Data</h1>
          <p className="text-green-100 text-sm mt-1">Configure your business data</p>
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
                      ? 'bg-white text-green-600 shadow-lg'
                      : 'hover:bg-green-700'
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
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Master Data Management</h1>
              <p className="text-gray-600 text-lg mb-8">
                Configure and manage your core business data. Select an option from the sidebar to get started.
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Items</p>
                      <p className="text-3xl font-bold text-gray-800">9</p>
                    </div>
                    <Box className="text-green-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Categories</p>
                      <p className="text-3xl font-bold text-gray-800">4</p>
                    </div>
                    <Package className="text-blue-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Active</p>
                      <p className="text-3xl font-bold text-gray-800">8</p>
                    </div>
                    <Users className="text-purple-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Configured</p>
                      <p className="text-3xl font-bold text-gray-800">100%</p>
                    </div>
                    <Building2 className="text-orange-500" size={40} />
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
                          <div className="p-3 bg-green-100 rounded-lg">
                            <Icon className="text-green-600" size={24} />
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

export default MasterDataModule;
