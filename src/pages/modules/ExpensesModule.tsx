import { useMemo } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import {
  TrendingUp,
  CreditCard,
  FolderTree,
  Receipt,
} from 'lucide-react';
import { useModulePreferences, MenuItem } from '../../hooks/useModulePreferences';
import { SortableModuleSidebar } from '../../components/SortableModuleSidebar';
import { ModuleHomeContent } from '../../components/ModuleHomeContent';

const ExpensesModule = () => {
  const location = useLocation();

  const menuItems: MenuItem[] = useMemo(() => [
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
  ], []);

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
  } = useModulePreferences('expenses', menuItems);

  const isModuleHome = location.pathname === '/expenses';

  const stats = [
    { label: 'Total Expenses', value: '$0', icon: TrendingUp, color: 'border-orange-500' },
    { label: 'Card Fees', value: '$0', icon: CreditCard, color: 'border-red-500' },
    { label: 'Categories', value: 0, icon: FolderTree, color: 'border-purple-500' },
    { label: 'Credit Balance', value: '$0', icon: Receipt, color: 'border-green-500' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <SortableModuleSidebar
        moduleName="Expenses"
        moduleIcon="💰"
        moduleDescription="Track and manage expenses"
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
            title="Expense Management"
            description="Track and manage all your business expenses. Select an option from the sidebar to get started."
            stats={stats}
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

export default ExpensesModule;
