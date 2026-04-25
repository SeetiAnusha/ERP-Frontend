import { useState, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface MenuItem {
  path: string;
  icon: any;
  label: string;
  description: string;
  category?: string;
}

export interface ModulePreferences {
  menuOrder: string[];
  hiddenMenus: string[];
  favorites: string[];
}

// Validation helper
const isValidPreferences = (prefs: any): prefs is ModulePreferences => {
  return (
    prefs &&
    typeof prefs === 'object' &&
    Array.isArray(prefs.menuOrder) &&
    Array.isArray(prefs.hiddenMenus) &&
    Array.isArray(prefs.favorites) &&
    prefs.menuOrder.every((id: any) => typeof id === 'string') &&
    prefs.hiddenMenus.every((id: any) => typeof id === 'string') &&
    prefs.favorites.every((id: any) => typeof id === 'string')
  );
};

/**
 * Reusable hook for managing module menu preferences
 * Handles: ordering, hiding, favorites with localStorage persistence
 * 
 * @param moduleName - Unique identifier for the module (e.g., 'master-data', 'accounting')
 * @param menuItems - Array of menu items for the module
 * @returns Object with ordered items, hidden items, favorites, and management functions
 */
export const useModulePreferences = (moduleName: string, menuItems: MenuItem[]) => {
  const { user } = useAuth();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create Map for O(1) lookups - DSA optimization
  const menuMap = useMemo(() => 
    new Map(menuItems.map(m => [m.path, m])), 
    [menuItems]
  );

  // Get default preferences
  const getDefaultPreferences = useCallback((): ModulePreferences => ({
    menuOrder: menuItems.map(m => m.path),
    hiddenMenus: [],
    favorites: [],
  }), [menuItems]);

  // Load preferences from localStorage with error handling
  const loadPreferences = useCallback((): ModulePreferences => {
    if (!user) return getDefaultPreferences();
    
    try {
      const saved = localStorage.getItem(`${moduleName}_prefs_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isValidPreferences(parsed)) {
          return parsed;
        }
        console.warn(`Invalid ${moduleName} preferences structure, using defaults`);
      }
    } catch (error) {
      console.error(`Failed to load ${moduleName} preferences:`, error);
    }
    
    return getDefaultPreferences();
  }, [user, moduleName, getDefaultPreferences]);

  const [preferences, setPreferences] = useState<ModulePreferences>(loadPreferences);

  // Debounced save to localStorage - prevents excessive writes
  const debouncedSave = useCallback((prefs: ModulePreferences) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (user) {
        try {
          localStorage.setItem(`${moduleName}_prefs_${user.id}`, JSON.stringify(prefs));
        } catch (error) {
          console.error(`Failed to save ${moduleName} preferences:`, error);
        }
      }
    }, 300); // 300ms debounce
  }, [user, moduleName]);

  // Save preferences with debouncing
  const savePreferences = useCallback((prefs: ModulePreferences) => {
    setPreferences(prefs);
    debouncedSave(prefs);
  }, [debouncedSave]);

  // Use Set for O(1) lookups instead of Array.includes() - DSA optimization
  const hiddenMenusSet = useMemo(() => 
    new Set(preferences.hiddenMenus), 
    [preferences.hiddenMenus]
  );

  const favoritesSet = useMemo(() => 
    new Set(preferences.favorites), 
    [preferences.favorites]
  );

  // Get ordered menu items with O(1) Map lookups
  const orderedMenuItems = useMemo(() => {
    const ordered = preferences.menuOrder
      .map(path => menuMap.get(path))
      .filter((m): m is MenuItem => m !== undefined && !hiddenMenusSet.has(m.path));
    
    // Add any new menu items that aren't in the order yet
    const existingPaths = new Set(preferences.menuOrder);
    const newItems = menuItems.filter(
      m => !existingPaths.has(m.path) && !hiddenMenusSet.has(m.path)
    );
    
    return [...ordered, ...newItems];
  }, [preferences.menuOrder, menuMap, hiddenMenusSet, menuItems]);

  // Get hidden menu items
  const hiddenMenuItems = useMemo(() => {
    return menuItems.filter(m => hiddenMenusSet.has(m.path));
  }, [menuItems, hiddenMenusSet]);

  // Separate favorites and regular items
  const { favoriteItems, regularItems } = useMemo(() => {
    const favs = orderedMenuItems.filter(item => favoritesSet.has(item.path));
    const regs = orderedMenuItems.filter(item => !favoritesSet.has(item.path));
    return { favoriteItems: favs, regularItems: regs };
  }, [orderedMenuItems, favoritesSet]);

  // Reorder menu items
  const reorderMenuItems = useCallback((oldIndex: number, newIndex: number) => {
    const newOrder = [...orderedMenuItems];
    const [removed] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, removed);
    
    savePreferences({
      ...preferences,
      menuOrder: newOrder.map(m => m.path),
    });
  }, [orderedMenuItems, preferences, savePreferences]);

  // Hide menu item
  const hideMenuItem = useCallback((path: string) => {
    savePreferences({
      ...preferences,
      hiddenMenus: [...preferences.hiddenMenus, path],
    });
  }, [preferences, savePreferences]);

  // Show menu item
  const showMenuItem = useCallback((path: string) => {
    savePreferences({
      ...preferences,
      hiddenMenus: preferences.hiddenMenus.filter(p => p !== path),
    });
  }, [preferences, savePreferences]);

  // Toggle favorite
  const toggleFavorite = useCallback((path: string) => {
    const newFavorites = favoritesSet.has(path)
      ? preferences.favorites.filter(p => p !== path)
      : [...preferences.favorites, path];
    
    savePreferences({
      ...preferences,
      favorites: newFavorites,
    });
  }, [preferences, favoritesSet, savePreferences]);

  // Check if item is favorite
  const isFavorite = useCallback((path: string) => {
    return favoritesSet.has(path);
  }, [favoritesSet]);

  // Reset to default
  const resetToDefault = useCallback(() => {
    savePreferences(getDefaultPreferences());
  }, [savePreferences, getDefaultPreferences]);

  return {
    // Data
    orderedMenuItems,
    hiddenMenuItems,
    favoriteItems,
    regularItems,
    preferences,
    
    // Functions
    reorderMenuItems,
    hideMenuItem,
    showMenuItem,
    toggleFavorite,
    isFavorite,
    resetToDefault,
  };
};
