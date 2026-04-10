import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  ShoppingBag,
  Package,
  Box,
  // DollarSign,
  Wallet,
  Building2,
  Settings,
  BarChart3,
  FileText,
  CreditCard,
  Landmark,
  DollarSign,
  UserCheck,
  Clock,
  Receipt,
  TrendingUp,
  FolderTree,
  LogOut,
  User,
  Shield,
  Trash2,
  // BookOpen,
  // Scale,
  // FileBarChart,
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { t } = useLanguage();
  const { user, logout, isAuthenticated } = useAuth();
  const [myApprovalRole, setMyApprovalRole] = useState<any>(null);

  const handleLogout = () => {
    logout();
  };

  // Fetch user's approval role
  useEffect(() => {
    const fetchMyRole = async () => {
      if (isAuthenticated) {
        try {
          const api = (await import('../api/axios')).default;
          const response = await api.get('/user-roles/my-roles');
          if (response.data.data.approvalRoles && response.data.data.approvalRoles.length > 0) {
            setMyApprovalRole(response.data.data.approvalRoles[0]);
          }
        } catch (error) {
          console.error('Failed to fetch user role:', error);
        }
      }
    };
    fetchMyRole();
  }, [isAuthenticated]);

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/products', icon: Box, label: t('products') },
    { path: '/inventory', icon: Package, label: t('inventory') },
    { path: '/sales', icon: ShoppingCart, label: t('sales') },
    { path: '/clients', icon: Users, label: t('clients') },
    { path: '/purchases', icon: ShoppingBag, label: t('purchases') },
    { path: '/suppliers', icon: Package, label: t('suppliers') },
    // Expense Management Section
    { path: '/business-expenses', icon: TrendingUp, label: 'Expense Management' },
    { path: '/credit-card-fees', icon: CreditCard, label: 'Credit Card Fees' },
    { path: '/expense-categories', icon: FolderTree, label: 'Expense Categories' },
    // { path: '/payments', icon: DollarSign, label: t('payments') },
    { path: '/accounts-receivable', icon: FileText, label: 'Accounts Receivable' },
    { path: '/accounts-payable', icon: CreditCard, label: 'Accounts Payable' },
    { path: '/credit-balances', icon: Receipt, label: 'Credit Balances' },
    { path: '/cash-register', icon: Wallet, label: t('cashRegister') },
    { path: '/bank-register', icon: Building2, label: 'Bank Register' },
    { path: '/credit-card-register', icon: CreditCard, label: 'Credit Card Register' },
    { path: '/bank-accounts', icon: Building2, label: t('bankAccounts') },
    { path: '/cash-register-masters', icon: DollarSign, label: t('cashRegisters') },
    { path: '/cards', icon: CreditCard, label: t('cards') },
    { path: '/card-payment-networks', icon: CreditCard, label: 'Credit Card Red' },
    { path: '/financers', icon: Landmark, label: t('financers') },
    { path: '/investors', icon: UserCheck, label: 'Investors' },
    { path: '/banks', icon: Building2, label: 'Loans' },
    { path: '/recent-activity', icon: Clock, label: 'Investors And Loans Recent Activity' },
    { path: '/investment-agreements', icon: FileText, label: 'Investment Agreements' },
    { path: '/adjustments', icon: Settings, label: t('adjustments') },
    { path: '/data-classification', icon: Shield, label: 'Data Classification' },
    { path: '/transaction-deletion', icon: Trash2, label: 'Transaction Deletion' },
    // Only show User Role Management for admins and managers
    ...(user && (user.role === 'admin' || user.role === 'manager') ? [
      { path: '/user-roles', icon: Shield, label: 'User Role Management' }
    ] : []),
    { path: '/reports', icon: BarChart3, label: t('reports') },
    // Accounting & Financial Reporting Section
    // { path: '/accounting/chart-of-accounts', icon: BookOpen, label: 'Chart of Accounts' },
    // { path: '/accounting/general-ledger', icon: FileText, label: 'General Ledger' },
    // { path: '/accounting/trial-balance', icon: Scale, label: 'Trial Balance' },
    // { path: '/accounting/financial-reports', icon: FileBarChart, label: 'Financial Reports' },
    //  { path: '/investments', icon: Package, label: t('investments') },
    // { path: '/prepaid-expenses', icon: Package, label: t('prepaidExpenses') },
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
              {menuItems.find((item) => item.path === location.pathname)?.label || t('dashboard')}
            </h2>
            
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              
              {/* User Info and Logout - only show if authenticated */}
              {isAuthenticated && user && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User size={16} />
                    <span>{user.firstName} {user.lastName}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {user.role}
                    </span>
                    {myApprovalRole && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold" title="Approval Role & Limit">
                        {myApprovalRole.role_name} (${myApprovalRole.approval_limit?.toLocaleString()})
                      </span>
                    )}
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
