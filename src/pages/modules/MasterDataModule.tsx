import { useMemo } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import {
  Box,
  Users,
  Package,
  Building2,
  CreditCard,
  DollarSign,
  Landmark,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModulePreferences, MenuItem } from '../../hooks/useModulePreferences';
import { SortableModuleSidebar } from '../../components/SortableModuleSidebar';
import { ModuleHomeContent } from '../../components/ModuleHomeContent';

const MasterDataModule = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const menuItems: MenuItem[] = useMemo(() => [
    { 
      path: '/master-data/products', 
      icon: Box, 
      label: t('products'),
      description: 'Manage product catalog and inventory items'
    },
    { 
      path: '/master-data/inventory', 
      icon: Package, 
      label: t('inventory'),
      description: 'Track stock levels, movements, and valuation'
    },
    { 
      path: '/master-data/inventory-assistant', 
      icon: Package, 
      label: 'Inventory Assistant',
      description: 'View inventory snapshot by date with total value'
    },
    { 
      path: '/master-data/suppliers', 
      icon: Package, 
      label: t('suppliers'),
      description: 'Manage supplier information and contacts'
    },
    { 
      path: '/master-data/clients', 
      icon: Users, 
      label: t('clients'),
      description: 'Manage customer information and accounts'
    },
    { 
      path: '/master-data/bank-accounts', 
      icon: Building2, 
      label: t('bankAccounts'),
      description: 'Manage company bank accounts'
    },
    { 
      path: '/master-data/cards', 
      icon: CreditCard, 
      label: t('cards'),
      description: 'Manage credit and debit cards'
    },
    { 
      path: '/master-data/cash-registers', 
      icon: DollarSign, 
      label: t('cashRegisters'),
      description: 'Manage cash register configurations'
    },
    { 
      path: '/master-data/financers', 
      icon: Landmark, 
      label: t('financers'),
      description: 'Manage financing institutions'
    },
    { 
      path: '/master-data/card-networks', 
      icon: CreditCard, 
      label: 'Credit Card Red',
      description: 'Manage credit card payment networks'
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
  } = useModulePreferences('master-data', menuItems);

  const isModuleHome = location.pathname === '/master-data';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sortable Sidebar */}
      <SortableModuleSidebar
        moduleName={t('masterData')}
        moduleIcon="📦"
        moduleDescription={t('masterDataDesc')}
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

      {/* Main Content */}
      {/* ✅ Mobile: add top padding for hamburger button. Desktop: unchanged */}
      <div className="flex-1 overflow-auto pt-14 md:pt-0">
        {isModuleHome ? (
          <ModuleHomeContent
            title={t('masterDataTitle')}
            description={t('masterDataSubtitle')}
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

export default MasterDataModule;
