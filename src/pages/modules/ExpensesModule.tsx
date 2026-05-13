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
import { useLanguage } from '../../contexts/LanguageContext';

const ExpensesModule = () => {
  const location = useLocation();
  const { t } = useLanguage();

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

  return (
    <div className="flex h-screen bg-gray-50">
      <SortableModuleSidebar
        moduleName={t('expensesModule')}
        moduleIcon="💰"
        moduleDescription={t('expensesDesc')}
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

      <div className="flex-1 overflow-auto pt-14 md:pt-0">
        {isModuleHome ? (
          <ModuleHomeContent
            title={t('expensesTitle')}
            description={t('expensesSubtitle')}
            favoriteItems={favoriteItems}
            regularItems={regularItems}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpensesModule;
