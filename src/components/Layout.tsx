import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  ShoppingBag,
  Package,
  Box,
  DollarSign,
  Wallet,
  Settings,
  BarChart3,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/products', icon: Box, label: 'Products' },
    { path: '/inventory', icon: Package, label: 'Inventory' },
    { path: '/sales', icon: ShoppingCart, label: 'Sales' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/purchases', icon: ShoppingBag, label: 'Purchases' },
    { path: '/suppliers', icon: Package, label: 'Suppliers' },
    { path: '/payments', icon: DollarSign, label: 'Payments' },
    { path: '/cash-register', icon: Wallet, label: 'Cash Register' },
    { path: '/adjustments', icon: Settings, label: 'Adjustments' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    // { path: '/fixed-assets', icon: Package, label: 'Fixed Assets' },
    { path: '/investments', icon: Package, label: 'Investments' },
    { path: '/prepaid-expenses', icon: Package, label: 'Prepaid Expenses' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-xl overflow-y-auto"
      >
        <div className="p-6 border-b border-blue-500">
          <h1 className="text-2xl font-bold">ERP System</h1>
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {menuItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
