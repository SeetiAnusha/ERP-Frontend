import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { MenuItem } from '../hooks/useModulePreferences';

interface StatCard {
  label: string;
  value: string | number;
  icon: any;
  color: string;
}

interface ModuleHomeContentProps {
  title: string;
  description: string;
  stats: StatCard[];
  favoriteItems: MenuItem[];
  regularItems: MenuItem[];
  isFavorite: (path: string) => boolean;
  onToggleFavorite: (path: string) => void;
  groupedItems?: Record<string, MenuItem[]>;
  categoryLabels?: Record<string, string>;
}

export const ModuleHomeContent = ({
  title,
  description,
  stats,
  favoriteItems,
  regularItems,
  onToggleFavorite,
  groupedItems,
  categoryLabels,
}: ModuleHomeContentProps) => {
  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2">{title}</h1>
        <p className="text-gray-600 text-lg mb-8">{description}</p>

        {/* Quick Stats */}
        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(stats.length, 4)} gap-6 mb-8`}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${stat.color}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                  <Icon className={stat.color.replace('border-', 'text-')} size={40} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Favorites Section */}
        {favoriteItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Star className="text-yellow-500 fill-yellow-500" size={24} />
              Quick Access
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-br from-yellow-50 to-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border-2 border-yellow-200"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <Icon className="text-yellow-600" size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                            {item.label}
                            <Star className="text-yellow-500 fill-yellow-500" size={16} />
                          </h3>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* All Items - Grouped or Flat */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {favoriteItems.length > 0 ? 'All Modules' : 'Available Modules'}
        </h2>

        {groupedItems && categoryLabels ? (
          // Grouped display
          Object.entries(groupedItems).map(([category, items]) => {
            if (items.length === 0) return null;
            
            return (
              <div key={category} className="mb-8">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">
                  {categoryLabels[category]}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.path} to={item.path}>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.05, y: -5 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border border-gray-100 group"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                              <Icon className="text-blue-600" size={24} />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                                {item.label}
                              </h3>
                              <p className="text-sm text-gray-600">{item.description}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggleFavorite(item.path);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-lg"
                              title="Add to favorites"
                            >
                              <Star size={18} className="text-gray-400 hover:text-yellow-500" />
                            </button>
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          // Flat display
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all cursor-pointer border border-gray-100 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Icon className="text-blue-600" size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                          {item.label}
                        </h3>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleFavorite(item.path);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-lg"
                        title="Add to favorites"
                      >
                        <Star size={18} className="text-gray-400 hover:text-yellow-500" />
                      </button>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};
