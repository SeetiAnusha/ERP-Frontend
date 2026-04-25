import { useState, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  FileText,
  TrendingUp,
  BookOpen,
  Shield,
  Building,
  BarChart3,
  LogOut,
  User,
  Settings,
  Eye,
  EyeOff,
  GripVertical,
  RotateCcw,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

interface Module {
  id: string;
  title: string;
  description: string;
  icon: typeof Box;
  path: string;
  color: string;
  bgColor: string;
  count?: number;
}

interface DashboardPreferences {
  moduleOrder: string[];
  hiddenModules: string[];
}

// Validation helper
const isValidPreferences = (prefs: any): prefs is DashboardPreferences => {
  return (
    prefs &&
    typeof prefs === 'object' &&
    Array.isArray(prefs.moduleOrder) &&
    Array.isArray(prefs.hiddenModules) &&
    prefs.moduleOrder.every((id: any) => typeof id === 'string') &&
    prefs.hiddenModules.every((id: any) => typeof id === 'string')
  );
};

// Sortable Module Card Component
const SortableModuleCard = ({ module, isCustomizing, onHide }: { 
  module: Module; 
  isCustomizing: boolean;
  onHide: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = module.icon;

  const cardContent = (
    <motion.div
      whileHover={!isCustomizing ? { scale: 1.03, y: -5 } : {}}
      whileTap={!isCustomizing ? { scale: 0.98 } : {}}
      className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden ${
        isCustomizing ? 'cursor-default' : 'cursor-pointer'
      } group h-full ${isDragging ? 'ring-2 ring-blue-400 shadow-2xl' : ''} flex flex-col`}
    >
      <div className="p-6 flex-1">
        <div className="flex items-center gap-4 mb-4">
          {/* Drag Handle */}
          {isCustomizing && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-2 hover:bg-blue-50 rounded-lg transition-colors border-2 border-dashed border-gray-300 hover:border-blue-400"
              title="Drag to reorder"
            >
              <GripVertical className="text-blue-500" size={20} />
            </div>
          )}
          
          <div className={`p-3 ${module.bgColor} rounded-xl group-hover:scale-110 transition-transform flex-shrink-0`}>
            <Icon className={module.color} size={28} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
              {module.title}
            </h3>
            {module.count && (
              <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                {module.count} items
              </span>
            )}
          </div>

          {/* Hide Button */}
          {isCustomizing && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onHide(module.id);
              }}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors group/hide border-2 border-dashed border-gray-300 hover:border-red-400"
              title="Hide this module"
            >
              <EyeOff className="text-gray-400 group-hover/hide:text-red-500" size={18} />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          {module.description}
        </p>
      </div>
      <div className={`h-1.5 ${module.bgColor} group-hover:h-2 transition-all duration-200 flex-shrink-0`}></div>
    </motion.div>
  );

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {isCustomizing ? (
        cardContent
      ) : (
        <Link to={module.path}>
          {cardContent}
        </Link>
      )}
    </div>
  );
};

const ModuleDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const allModules: Module[] = useMemo(() => [
    {
      id: 'master-data',
      title: 'Master Data',
      description: 'Manage products, suppliers, customers, inventory, and core business data',
      icon: Box,
      path: '/master-data',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      count: 9,
    },
    {
      id: 'transactions',
      title: 'Transactions',
      description: 'Record sales, purchases, and daily business operations',
      icon: FileText,
      path: '/transactions',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      count: 8,
    },
    {
      id: 'expenses',
      title: 'Expenses',
      description: 'Track and manage business expenses and credit card fees',
      icon: TrendingUp,
      path: '/expenses',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      count: 4,
    },
    {
      id: 'accounting',
      title: 'Accounting',
      description: 'Financial management, general ledger, and reporting',
      icon: BookOpen,
      path: '/accounting',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      count: 5,
    },
    {
      id: 'assets',
      title: 'Assets & Financing',
      description: 'Manage fixed assets, investments, loans, and financing',
      icon: Building,
      path: '/assets',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      count: 8,
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'Generate business intelligence and analytical reports',
      icon: BarChart3,
      path: '/reports',
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      count: 3,
    },
    {
      id: 'administration',
      title: 'Administration',
      description: user && (user.role === 'admin' || user.role === 'manager')
        ? 'User management, roles, permissions, and system configuration'
        : 'Data classification and transaction deletion management',
      icon: Shield,
      path: '/administration',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      count: user && (user.role === 'admin' || user.role === 'manager') ? 3 : 2,
    },
  ], [user]);

  // Create Map for O(1) lookups - DSA optimization
  const moduleMap = useMemo(() => 
    new Map(allModules.map(m => [m.id, m])), 
    [allModules]
  );

  // Get default preferences
  const getDefaultPreferences = useCallback((): DashboardPreferences => ({
    moduleOrder: allModules.map(m => m.id),
    hiddenModules: [],
  }), [allModules]);

  // Load preferences from localStorage with error handling
  const loadPreferences = useCallback((): DashboardPreferences => {
    if (!user) return getDefaultPreferences();
    
    try {
      const saved = localStorage.getItem(`dashboard_prefs_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isValidPreferences(parsed)) {
          return parsed;
        }
        console.warn('Invalid preferences structure, using defaults');
      }
    } catch (error) {
      console.error('Failed to load dashboard preferences:', error);
    }
    
    return getDefaultPreferences();
  }, [user, getDefaultPreferences]);

  const [preferences, setPreferences] = useState<DashboardPreferences>(loadPreferences);

  // Debounced save to localStorage - prevents excessive writes
  const debouncedSave = useCallback((prefs: DashboardPreferences) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (user) {
        try {
          localStorage.setItem(`dashboard_prefs_${user.id}`, JSON.stringify(prefs));
        } catch (error) {
          console.error('Failed to save dashboard preferences:', error);
        }
      }
    }, 300); // 300ms debounce
  }, [user]);

  // Save preferences with debouncing
  const savePreferences = useCallback((prefs: DashboardPreferences) => {
    setPreferences(prefs);
    debouncedSave(prefs);
  }, [debouncedSave]);

  // Use Set for O(1) lookups instead of Array.includes() - DSA optimization
  const hiddenModulesSet = useMemo(() => 
    new Set(preferences.hiddenModules), 
    [preferences.hiddenModules]
  );

  // Get ordered modules with O(1) Map lookups
  const orderedModules = useMemo(() => {
    const ordered = preferences.moduleOrder
      .map(id => moduleMap.get(id))
      .filter((m): m is Module => m !== undefined && !hiddenModulesSet.has(m.id));
    
    // Add any new modules that aren't in the order yet
    const existingIds = new Set(preferences.moduleOrder);
    const newModules = allModules.filter(
      m => !existingIds.has(m.id) && !hiddenModulesSet.has(m.id)
    );
    
    return [...ordered, ...newModules];
  }, [preferences.moduleOrder, moduleMap, hiddenModulesSet, allModules]);

  // Get hidden modules
  const hiddenModules = useMemo(() => {
    return allModules.filter(m => hiddenModulesSet.has(m.id));
  }, [allModules, hiddenModulesSet]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = orderedModules.findIndex(m => m.id === active.id);
      const newIndex = orderedModules.findIndex(m => m.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(orderedModules, oldIndex, newIndex);
        savePreferences({
          ...preferences,
          moduleOrder: newOrder.map(m => m.id),
        });
      }
    }
  }, [orderedModules, preferences, savePreferences]);

  const handleHideModule = useCallback((moduleId: string) => {
    savePreferences({
      ...preferences,
      hiddenModules: [...preferences.hiddenModules, moduleId],
    });
  }, [preferences, savePreferences]);

  const handleShowModule = useCallback((moduleId: string) => {
    savePreferences({
      ...preferences,
      hiddenModules: preferences.hiddenModules.filter(id => id !== moduleId),
    });
  }, [preferences, savePreferences]);

  const handleResetToDefault = useCallback(() => {
    if (confirm('Reset dashboard to default layout?')) {
      savePreferences(getDefaultPreferences());
    }
  }, [savePreferences, getDefaultPreferences]);

  const activeModule = useMemo(() => 
    orderedModules.find(m => m.id === activeId),
    [orderedModules, activeId]
  );

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 leading-tight">ERP System</h2>
                <p className="text-xs text-gray-500">Enterprise Resource Planning</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              
              {user && (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-600 border-l pl-3">
                    <User size={14} />
                    <span className="font-medium">{user.firstName} {user.lastName}</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                      {user.role}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Logout"
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome to Your ERP System
            </h1>
            <p className="text-base text-gray-600">
              {isCustomizing 
                ? 'Drag modules to reorder • Click eye icon to hide • Click again to save'
                : 'Select a module to get started with your business operations'}
            </p>
          </motion.div>

          {/* Customize Controls */}
          <div className="flex justify-center gap-3 mb-8">
            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isCustomizing
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
              }`}
            >
              <Settings size={16} />
              {isCustomizing ? 'Done Customizing' : 'Customize Dashboard'}
            </button>

            {isCustomizing && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleResetToDefault}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 rounded-lg font-medium shadow transition-all"
              >
                <RotateCcw size={16} />
                Reset to Default
              </motion.button>
            )}
          </div>

          {/* Module Cards with Drag and Drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={orderedModules.map(m => m.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 gap-6 mb-8">
                {orderedModules.map((module) => (
                  <SortableModuleCard
                    key={module.id}
                    module={module}
                    isCustomizing={isCustomizing}
                    onHide={handleHideModule}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeModule && (
                <div className="bg-white rounded-xl shadow-2xl p-6 opacity-90 rotate-3">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 ${activeModule.bgColor} rounded-xl`}>
                      <activeModule.icon className={activeModule.color} size={28} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{activeModule.title}</h3>
                      {activeModule.count && (
                        <span className="text-xs text-gray-600">{activeModule.count} items</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {/* Hidden Modules Section */}
          <AnimatePresence>
            {hiddenModules.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <EyeOff size={20} className="text-gray-400" />
                    Hidden Modules ({hiddenModules.length})
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {hiddenModules.map((module) => {
                    const Icon = module.icon;
                    return (
                      <motion.button
                        key={module.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => handleShowModule(module.id)}
                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors group"
                      >
                        <div className={`p-2 ${module.bgColor} rounded-lg`}>
                          <Icon className={module.color} size={20} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                            {module.title}
                          </p>
                        </div>
                        <Eye size={16} className="text-gray-400 group-hover:text-blue-600" />
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ModuleDashboard;
