import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  FileText,
  TrendingUp,
  Building,
  ArrowLeft,
} from 'lucide-react';

interface MenuItem {
  path: string;
  icon: typeof BarChart3;
  label: string;
  description: string;
}

const ReportsModule = () => {
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { 
      path: '/reports/general', 
      icon: BarChart3, 
      label: 'General Reports',
      description: 'Business intelligence and analytics'
    },
    { 
      path: '/reports/ppe', 
      icon: Building, 
      label: 'PPE Report',
      description: 'Property, plant, and equipment reports'
    },
    { 
      path: '/reports/investments', 
      icon: TrendingUp, 
      label: 'Investment Report',
      description: 'Investment portfolio performance'
    },
  ];

  const isModuleHome = location.pathname === '/reports';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 bg-gradient-to-b from-pink-600 to-pink-800 text-white shadow-xl overflow-y-auto"
      >
        <div className="p-6 border-b border-pink-500">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-pink-100 transition-colors mb-2">
            <ArrowLeft size={20} />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold mt-2">📊 Reports</h1>
          <p className="text-pink-100 text-sm mt-1">Business intelligence & analytics</p>
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
                      ? 'bg-white text-pink-600 shadow-lg'
                      : 'hover:bg-pink-700'
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
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Reports & Analytics</h1>
              <p className="text-gray-600 text-lg mb-8">
                Generate business intelligence reports and analytics. Select an option from the sidebar to get started.
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-pink-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Available Reports</p>
                      <p className="text-3xl font-bold text-gray-800">3</p>
                    </div>
                    <BarChart3 className="text-pink-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Generated Today</p>
                      <p className="text-3xl font-bold text-gray-800">0</p>
                    </div>
                    <FileText className="text-purple-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Report Types</p>
                      <p className="text-3xl font-bold text-gray-800">3</p>
                    </div>
                    <TrendingUp className="text-blue-500" size={40} />
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
                          <div className="p-3 bg-pink-100 rounded-lg">
                            <Icon className="text-pink-600" size={24} />
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

export default ReportsModule;
