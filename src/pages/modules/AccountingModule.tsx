import { useMemo } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Scale,
  DollarSign,
  FileBarChart,
} from 'lucide-react';
import { useModulePreferences, MenuItem } from '../../hooks/useModulePreferences';
import { SortableModuleSidebar } from '../../components/SortableModuleSidebar';
import { ModuleHomeContent } from '../../components/ModuleHomeContent';

const AccountingModule = () => {
  const location = useLocation();

  const menuItems: MenuItem[] = useMemo(() => [
    { 
      path: '/accounting/chart-of-accounts', 
      icon: BookOpen, 
      label: 'Chart of Accounts',
      description: 'Manage your chart of accounts structure'
    },
    { 
      path: '/accounting/general-ledger', 
      icon: FileText, 
      label: 'General Ledger',
      description: 'View and manage general ledger entries'
    },
    { 
      path: '/accounting/trial-balance', 
      icon: Scale, 
      label: 'Trial Balance',
      description: 'Generate trial balance reports'
    },
    { 
      path: '/accounting/opening-balance', 
      icon: DollarSign, 
      label: 'Opening Balance',
      description: 'Configure opening balances for accounts'
    },
    { 
      path: '/accounting/financial-reports', 
      icon: FileBarChart, 
      label: 'Financial Reports',
      description: 'Generate financial statements and reports'
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
  } = useModulePreferences('accounting', menuItems);

  const isModuleHome = location.pathname === '/accounting';

  return (
    <div className="flex h-screen bg-gray-50">
      <SortableModuleSidebar
        moduleName="Accounting"
        moduleIcon="📊"
        moduleDescription="Financial management & reporting"
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
            title="Accounting & Financial Management"
            description="Manage your financial records and generate reports. Select an option from the sidebar to get started."
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

export default AccountingModule;
