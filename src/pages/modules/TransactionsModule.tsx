import { useMemo } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import {
  ShoppingCart,
  ShoppingBag,
  FileText,
  CreditCard,
  Settings,
  Wallet,
  Building2,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModulePreferences, MenuItem } from '../../hooks/useModulePreferences';
import { SortableModuleSidebar } from '../../components/SortableModuleSidebar';
import { ModuleHomeContent } from '../../components/ModuleHomeContent';

const TransactionsModule = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const menuItems: MenuItem[] = useMemo(() => [
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
  ], [t]);

  const {
    orderedMenuItems,
    hiddenMenuItems,
    favoriteItems,
    regularItems,
    reorderMenuItems,
    hideMenuItem,
    showMenuItem,
    toggleFavorite,
    isFavorite,
    resetToDefault,
  } = useModulePreferences('transactions', menuItems);

  const isModuleHome = location.pathname === '/transactions';

  return (
    <div className="flex h-screen bg-gray-50">
      <SortableModuleSidebar
        moduleName="Transactions"
        moduleIcon="📝"
        moduleDescription="Manage daily operations"
        orderedMenuItems={orderedMenuItems}
        hiddenMenuItems={hiddenMenuItems}
        favoriteItems={favoriteItems}
        regularItems={regularItems}
        onReorder={reorderMenuItems}
        onHide={hideMenuItem}
        onShow={showMenuItem}
        onToggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
        onReset={resetToDefault}
      />

      <div className="flex-1 overflow-auto">
        {isModuleHome ? (
          <ModuleHomeContent
            title="Transaction Management"
            description="Record and manage all your business transactions. Select an option from the sidebar to get started."
            favoriteItems={favoriteItems}
            regularItems={regularItems}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
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
