import { useMemo } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import {
  Building,
  TrendingUp,
  Clock,
  BarChart3,
  Users,
  Landmark,
  FileText,
  Activity,
} from 'lucide-react';
import { useModulePreferences, MenuItem } from '../../hooks/useModulePreferences';
import { SortableModuleSidebar } from '../../components/SortableModuleSidebar';
import { ModuleHomeContent } from '../../components/ModuleHomeContent';

const AssetsModule = () => {
  const location = useLocation();

  const menuItems: MenuItem[] = useMemo(() => [
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
  } = useModulePreferences('assets', menuItems);

  const isModuleHome = location.pathname === '/assets';

  const stats = [
    { label: 'Fixed Assets', value: '$0', icon: Building, color: 'border-indigo-500' },
    { label: 'Investments', value: '$0', icon: TrendingUp, color: 'border-purple-500' },
    { label: 'Total Loans', value: '$0', icon: Landmark, color: 'border-blue-500' },
    { label: 'Prepaid Exp', value: '$0', icon: Clock, color: 'border-green-500' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <SortableModuleSidebar
        moduleName="Assets & Financing"
        moduleIcon="🏢"
        moduleDescription="Manage assets and investments"
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
            title="Assets & Financing Management"
            description="Manage fixed assets, investments, financing, and generate asset reports. Select an option from the sidebar to get started."
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

export default AssetsModule;
