import { useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  Eye,
  EyeOff,
  GripVertical,
  Settings,
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MenuItem } from '../hooks/useModulePreferences';

interface SortableMenuItemProps {
  item: MenuItem;
  isActive: boolean;
  isCustomizing: boolean;
  isFavorite: boolean;
  onToggleFavorite: (path: string) => void;
  onHide: (path: string) => void;
}

// Sortable Menu Item Component
const SortableMenuItem = ({
  item,
  isActive,
  isCustomizing,
  isFavorite,
  onToggleFavorite,
  onHide,
}: SortableMenuItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.path });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = item.icon;

  const content = (
    <motion.div
      whileHover={!isCustomizing ? { scale: 1.02, x: 5 } : {}}
      whileTap={!isCustomizing ? { scale: 0.98 } : {}}
      className={`flex items-center gap-3 p-3 rounded-lg mb-2 transition-all group ${
        isActive
          ? 'bg-white text-blue-600 shadow-lg'
          : 'hover:bg-blue-700'
      } ${isDragging ? 'ring-2 ring-blue-300' : ''}`}
    >
      {/* Drag Handle */}
      {isCustomizing && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-blue-600 rounded transition-colors"
          title="Drag to reorder"
        >
          <GripVertical size={16} />
        </div>
      )}

      <Icon size={20} />
      <span className="font-medium flex-1 text-sm">{item.label}</span>

      {/* Favorite Button */}
      {!isCustomizing && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(item.path);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-600 rounded"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star 
            size={14} 
            className={isFavorite ? 'fill-yellow-400 text-yellow-400' : ''} 
          />
        </button>
      )}

      {/* Hide Button */}
      {isCustomizing && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onHide(item.path);
          }}
          className="p-1 hover:bg-red-500 rounded transition-colors"
          title="Hide this menu item"
        >
          <EyeOff size={14} />
        </button>
      )}
    </motion.div>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {isCustomizing ? (
        content
      ) : (
        <Link to={item.path}>{content}</Link>
      )}
    </div>
  );
};

interface SortableModuleSidebarProps {
  moduleName: string;
  moduleIcon: string;
  moduleDescription: string;
  orderedMenuItems: MenuItem[];
  hiddenMenuItems: MenuItem[];
  favoriteItems: MenuItem[];
  regularItems: MenuItem[];
  onReorder: (oldIndex: number, newIndex: number) => void;
  onHide: (path: string) => void;
  onShow: (path: string) => void;
  onToggleFavorite: (path: string) => void;
  isFavorite: (path: string) => boolean;
  onReset: () => void;
}

export const SortableModuleSidebar = ({
  moduleName,
  moduleIcon,
  moduleDescription,
  orderedMenuItems,
  hiddenMenuItems,
  onReorder,
  onHide,
  onShow,
  onToggleFavorite,
  isFavorite,
  onReset,
}: SortableModuleSidebarProps) => {
  const location = useLocation();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // No search - show all items
  const filteredItems = orderedMenuItems;

  // Separate filtered favorites and regular items
  const { filteredFavorites, filteredRegular } = useMemo(() => {
    const favs = filteredItems.filter(item => isFavorite(item.path));
    const regs = filteredItems.filter(item => !isFavorite(item.path));
    return { filteredFavorites: favs, filteredRegular: regs };
  }, [filteredItems, isFavorite]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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
      const oldIndex = orderedMenuItems.findIndex(m => m.path === active.id);
      const newIndex = orderedMenuItems.findIndex(m => m.path === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  }, [orderedMenuItems, onReorder]);

  const activeItem = useMemo(() => 
    orderedMenuItems.find(m => m.path === activeId),
    [orderedMenuItems, activeId]
  );

  return (
    <motion.aside
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-xl overflow-y-auto flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-blue-500 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          
          {/* Customize Icon Button */}
          <button
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={`p-2 rounded-lg transition-all ${
              isCustomizing
                ? 'bg-white text-blue-600 shadow-lg'
                : 'bg-blue-700 hover:bg-blue-600'
            }`}
            title={isCustomizing ? 'Done customizing' : 'Customize menu'}
          >
            <Settings size={16} />
          </button>
        </div>
        
        <h1 className="text-2xl font-bold mt-2">{moduleIcon} {moduleName}</h1>
        <p className="text-blue-100 text-sm mt-1">{moduleDescription}</p>
        
        {/* Reset Button (only in customize mode) */}
        {isCustomizing && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => {
              if (confirm('Reset menu to default layout?')) {
                onReset();
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-3 bg-blue-700 hover:bg-blue-600 rounded-lg font-medium transition-all text-sm"
          >
            <RotateCcw size={14} />
            Reset to Default
          </motion.button>
        )}
      </div>

      {/* Menu Items */}
      <nav className="p-4 flex-1 overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={filteredItems.map(m => m.path)} 
            strategy={verticalListSortingStrategy}
            disabled={!isCustomizing}
          >
            {/* Favorites Section */}
            {filteredFavorites.length > 0 && !isCustomizing && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-yellow-400 text-xs font-semibold uppercase tracking-wide mb-2 px-2">
                  <Star size={14} className="fill-yellow-400" />
                  <span>Favorites</span>
                </div>
                {filteredFavorites.map(item => (
                  <SortableMenuItem
                    key={item.path}
                    item={item}
                    isActive={location.pathname === item.path}
                    isCustomizing={isCustomizing}
                    isFavorite={true}
                    onToggleFavorite={onToggleFavorite}
                    onHide={onHide}
                  />
                ))}
                <div className="border-t border-blue-500 my-4"></div>
              </div>
            )}

            {/* Regular Items */}
            {(isCustomizing ? filteredItems : filteredRegular).map(item => (
              <SortableMenuItem
                key={item.path}
                item={item}
                isActive={location.pathname === item.path}
                isCustomizing={isCustomizing}
                isFavorite={isFavorite(item.path)}
                onToggleFavorite={onToggleFavorite}
                onHide={onHide}
              />
            ))}

            {filteredItems.length === 0 && (
              <div className="text-center text-blue-200 text-sm py-4">
                No items available
              </div>
            )}
          </SortableContext>

          <DragOverlay>
            {activeItem && (
              <div className="bg-white text-blue-600 rounded-lg p-3 shadow-2xl opacity-90">
                <div className="flex items-center gap-3">
                  <activeItem.icon size={20} />
                  <span className="font-medium text-sm">{activeItem.label}</span>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* Hidden Items Section */}
        {hiddenMenuItems.length > 0 && isCustomizing && (
          <div className="mt-6 pt-4 border-t border-blue-500">
            <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wide mb-2 px-2">
              <EyeOff size={14} />
              <span>Hidden ({hiddenMenuItems.length})</span>
            </div>
            {hiddenMenuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => onShow(item.path)}
                  className="w-full flex items-center gap-3 p-2 bg-blue-700 hover:bg-blue-600 rounded-lg mb-2 transition-colors group text-left"
                >
                  <Icon size={16} />
                  <span className="text-sm flex-1">{item.label}</span>
                  <Eye size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        )}
      </nav>
    </motion.aside>
  );
};
