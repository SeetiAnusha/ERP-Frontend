import { useMemo } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import {
  Shield,
  Users,
  Settings,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useModulePreferences, MenuItem } from '../../hooks/useModulePreferences';
import { SortableModuleSidebar } from '../../components/SortableModuleSidebar';
import { ModuleHomeContent } from '../../components/ModuleHomeContent';

const AdministrationModule = () => {
  const location = useLocation();
  const { user } = useAuth();

  const allMenuItems: MenuItem[] = useMemo(() => [
    { 
      path: '/administration/user-roles', 
      icon: Users, 
      label: 'User Role Management',
      description: 'Manage user roles, permissions, and approval limits',
    },
    { 
      path: '/administration/data-classification', 
      icon: Settings, 
      label: 'Data Classification',
      description: 'Configure data categories and classifications',
    },
    { 
      path: '/administration/transaction-deletion', 
      icon: Trash2, 
      label: 'Transaction Deletion',
      description: 'Manage transaction deletion requests and approvals',
    },
  ], []);

  // Filter menu items based on user role
  const menuItems = useMemo(() => {
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      return allMenuItems; // Show all items for admin/manager
    }
    // Show only non-admin items for regular users
    return allMenuItems.filter(item => 
      item.path !== '/administration/user-roles'
    );
  }, [user, allMenuItems]);

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
  } = useModulePreferences('administration', menuItems);

  const isModuleHome = location.pathname === '/administration';

  return (
    <div className="flex h-screen bg-gray-50">
      <SortableModuleSidebar
        moduleName="Administration"
        moduleIcon="🛡️"
        moduleDescription="System management & security"
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
            title="System Administration"
            description={
              user && (user.role === 'admin' || user.role === 'manager') 
                ? 'Manage users, roles, permissions, and system configuration. Select an option from the sidebar to get started.'
                : 'Manage data classification and transaction deletion requests. Select an option from the sidebar to get started.'
            }
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

export default AdministrationModule;
