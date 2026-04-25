import { useMemo } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  TrendingUp,
  Building,
} from 'lucide-react';
import { useModulePreferences, MenuItem } from '../../hooks/useModulePreferences';
import { SortableModuleSidebar } from '../../components/SortableModuleSidebar';
import { ModuleHomeContent } from '../../components/ModuleHomeContent';

const ReportsModule = () => {
  const location = useLocation();

  const menuItems: MenuItem[] = useMemo(() => [
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
  } = useModulePreferences('reports', menuItems);

  const isModuleHome = location.pathname === '/reports';

  const stats = [
    { label: 'Available Reports', value: 3, icon: BarChart3, color: 'border-pink-500' },
    { label: 'Generated Today', value: 0, icon: FileText, color: 'border-purple-500' },
    { label: 'Report Types', value: 3, icon: TrendingUp, color: 'border-blue-500' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <SortableModuleSidebar
        moduleName="Reports"
        moduleIcon="📊"
        moduleDescription="Business intelligence & analytics"
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
            title="Reports & Analytics"
            description="Generate business intelligence reports and analytics. Select an option from the sidebar to get started."
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

export default ReportsModule;
