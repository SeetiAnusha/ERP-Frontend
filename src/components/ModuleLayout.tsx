import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, User, LucideIcon } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../contexts/AuthContext';

interface MenuItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

interface ModuleLayoutProps {
  children: ReactNode;
  moduleName: string;
  moduleIcon: LucideIcon;
  menuItems: MenuItem[];
}

const ModuleLayout = ({ children, moduleName, moduleIcon: ModuleIcon, menuItems }: ModuleLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Module Sidebar */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-xl overflow-y-auto"
      >
        {/* Module Header */}
        <div className="p-6 border-b border-blue-500">
          <div className="flex items-center gap-3 mb-4">
            <ModuleIcon size={32} />
            <h1 className="text-2xl font-bold">{moduleName}</h1>
          </div>
          
          {/* Back to Dashboard Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBackToDashboard}
            className="w-full flex items-center gap-2 p-3 rounded-lg bg-blue-700 hover:bg-blue-600 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Dashboard</span>
          </motion.button>
        </div>

        {/* Module Navigation */}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {menuItems.find((item) => item.path === location.pathname)?.label || moduleName}
            </h2>
            
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              
              {/* User Info and Logout */}
              {isAuthenticated && user && (
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
        </header>

        {/* Main Content */}
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

export default ModuleLayout;
