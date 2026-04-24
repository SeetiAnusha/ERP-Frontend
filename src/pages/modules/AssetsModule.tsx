import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building,
  TrendingUp,
  Clock,
  BarChart3,
  Users,
  Landmark,
  FileText,
  Activity,
  ArrowLeft,
} from 'lucide-react';

interface MenuItem {
  path: string;
  icon: typeof Building;
  label: string;
  description: string;
}

const AssetsModule = () => {
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { 
      path: '/assets/fixed-assets', 
      icon: Building, 
      label: 'Fixed Assets (PPE)',
      description: 'Manage property, plant, and equipment'
    },
    { 
      path: '/assets/investments', 
      icon: TrendingUp, 
      label: 'Investments',
      description: 'Track investment portfolio and returns'
    },
    { 
      path: '/assets/prepaid-expenses', 
      icon: Clock, 
      label: 'Prepaid Expenses',
      description: 'Manage prepaid expenses and amortization'
    },
    { 
      path: '/assets/investors', 
      icon: Users, 
      label: 'Investors',
      description: 'Manage investor information and agreements'
    },
    { 
      path: '/assets/loans', 
      icon: Landmark, 
      label: 'Loans & Financing',
      description: 'Track loans, financing, and repayments'
    },
    { 
      path: '/assets/investment-agreements', 
      icon: FileText, 
      label: 'Investment Agreements',
      description: 'Manage investment contracts and terms'
    },
    { 
      path: '/assets/activity', 
      icon: Activity, 
      label: 'Recent Activity',
      description: 'View recent asset and investment activities'
    },
    { 
      path: '/assets/reports', 
      icon: BarChart3, 
      label: 'Asset Reports',
      description: 'Generate PPE and investment reports'
    },
  ];

  const isModuleHome = location.pathname === '/assets';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 bg-gradient-to-b from-indigo-600 to-indigo-800 text-white shadow-xl overflow-y-auto"
      >
        <div className="p-6 border-b border-indigo-500">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-indigo-100 transition-colors mb-2">
            <ArrowLeft size={20} />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold mt-2">🏢 Assets & Financing</h1>
          <p className="text-indigo-100 text-sm mt-1">Manage assets and investments</p>
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
                      ? 'bg-white text-indigo-600 shadow-lg'
                      : 'hover:bg-indigo-700'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium text-sm">{item.label}</span>
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
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Assets & Financing Management</h1>
              <p className="text-gray-600 text-lg mb-8">
                Manage fixed assets, investments, financing, and generate asset reports. Select an option from the sidebar to get started.
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Fixed Assets</p>
                      <p className="text-3xl font-bold text-gray-800">$0</p>
                    </div>
                    <Building className="text-indigo-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Investments</p>
                      <p className="text-3xl font-bold text-gray-800">$0</p>
                    </div>
                    <TrendingUp className="text-purple-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Loans</p>
                      <p className="text-3xl font-bold text-gray-800">$0</p>
                    </div>
                    <Landmark className="text-blue-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Prepaid Exp</p>
                      <p className="text-3xl font-bold text-gray-800">$0</p>
                    </div>
                    <Clock className="text-green-500" size={40} />
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
                          <div className="p-3 bg-indigo-100 rounded-lg">
                            <Icon className="text-indigo-600" size={24} />
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

export default AssetsModule;
