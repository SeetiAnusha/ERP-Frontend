import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  Settings,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MenuItem {
  path: string;
  icon: typeof Shield;
  label: string;
  description: string;
  requiresAdmin?: boolean; // Flag for admin-only pages
}

const AdministrationModule = () => {
  const location = useLocation();
  const { user } = useAuth();

  const allMenuItems: MenuItem[] = [
    { 
      path: '/administration/user-roles', 
      icon: Users, 
      label: 'User Role Management',
      description: 'Manage user roles, permissions, and approval limits',
      requiresAdmin: true // Only admin/manager can see this
    },
    { 
      path: '/administration/data-classification', 
      icon: Settings, 
      label: 'Data Classification',
      description: 'Configure data categories and classifications',
      requiresAdmin: false // All users can see this
    },
    { 
      path: '/administration/transaction-deletion', 
      icon: Trash2, 
      label: 'Transaction Deletion',
      description: 'Manage transaction deletion requests and approvals',
      requiresAdmin: false // All users can see this
    },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => {
    if (item.requiresAdmin) {
      return user && (user.role === 'admin' || user.role === 'manager');
    }
    return true; // Show to all users
  });

  const isModuleHome = location.pathname === '/administration';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 bg-gradient-to-b from-red-600 to-red-800 text-white shadow-xl overflow-y-auto"
      >
        <div className="p-6 border-b border-red-500">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-red-100 transition-colors mb-2">
            <ArrowLeft size={20} />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold mt-2">🛡️ Administration</h1>
          <p className="text-red-100 text-sm mt-1">System management & security</p>
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
                      ? 'bg-white text-red-600 shadow-lg'
                      : 'hover:bg-red-700'
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
              <h1 className="text-4xl font-bold text-gray-800 mb-2">System Administration</h1>
              <p className="text-gray-600 text-lg mb-8">
                {user && (user.role === 'admin' || user.role === 'manager') 
                  ? 'Manage users, roles, permissions, and system configuration. Select an option from the sidebar to get started.'
                  : 'Manage data classification and transaction deletion requests. Select an option from the sidebar to get started.'}
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Users</p>
                      <p className="text-3xl font-bold text-gray-800">0</p>
                    </div>
                    <Users className="text-red-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Active Roles</p>
                      <p className="text-3xl font-bold text-gray-800">0</p>
                    </div>
                    <Shield className="text-orange-500" size={40} />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Configurations</p>
                      <p className="text-3xl font-bold text-gray-800">3</p>
                    </div>
                    <Settings className="text-purple-500" size={40} />
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
                          <div className="p-3 bg-red-100 rounded-lg">
                            <Icon className="text-red-600" size={24} />
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

export default AdministrationModule;
