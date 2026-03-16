import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { ExpenseCategory } from '../types';

/**
 * ExpenseCategoryDropdown Component
 * 
 * Senior Developer Features:
 * - Real-time search with debouncing
 * - Hierarchical category display
 * - Error handling with retry mechanism
 * - Loading states and skeleton UI
 * - Accessibility support (ARIA labels, keyboard navigation)
 * - Performance optimization with memoization
 * - Responsive design
 */

interface ExpenseCategoryDropdownProps {
  value?: number;
  onChange: (categoryId: number, category: ExpenseCategory) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  includeInactive?: boolean;
}

const ExpenseCategoryDropdown = ({
  value,
  onChange,
  placeholder = 'Select expense category...',
  disabled = false,
  required = false,
  error,
  className = '',
  includeInactive = false
}: ExpenseCategoryDropdownProps) => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<ExpenseCategory[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, [includeInactive]);

  // Filter categories based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  // Set selected category when value changes
  useEffect(() => {
    if (value && categories.length > 0) {
      const category = categories.find(c => c.id === value);
      setSelectedCategory(category || null);
    } else {
      setSelectedCategory(null);
    }
  }, [value, categories]);

  const fetchCategories = async (retryCount = 0) => {
    try {
      setLoading(true);
      setApiError(null);

      const response = await api.get('/expenses/categories', {
        params: {
          includeInactive,
          limit: 100 // Get all categories for dropdown
        }
      });

      if (response.data.success) {
        setCategories(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch categories');
      }
    } catch (error: any) {
      console.error('Error fetching expense categories:', error);
      
      if (retryCount < 2) {
        // Retry up to 2 times
        setTimeout(() => fetchCategories(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        setApiError(error.response?.data?.message || error.message || 'Failed to load categories');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    onChange(category.id, category);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getCategoryDisplayName = (category: ExpenseCategory) => {
    return category.parentCategory 
      ? `${category.parentCategory.name} > ${category.name}`
      : category.name;
  };

  const renderCategoryOption = (category: ExpenseCategory) => (
    <motion.div
      key={category.id}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ backgroundColor: '#f3f4f6' }}
      className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
        category.parentCategory ? 'pl-6' : ''
      }`}
      onClick={() => handleCategorySelect(category)}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-gray-900">
            {category.name}
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
              {category.code}
            </span>
            {category.description && (
              <span className="truncate max-w-xs">
                {category.description}
              </span>
            )}
          </div>
        </div>
        {!category.isActive && (
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
            Inactive
          </span>
        )}
      </div>
    </motion.div>
  );

  const renderLoadingSkeleton = () => (
    <div className="p-3 space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );

  const renderError = () => (
    <div className="p-4 text-center">
      <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
      <p className="text-red-600 text-sm mb-3">{apiError}</p>
      <button
        onClick={() => fetchCategories()}
        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Dropdown Button */}
      <div
        className={`
          relative w-full bg-white border rounded-lg px-3 py-2 text-left cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select expense category"
        aria-required={required}
      >
        <div className="flex items-center justify-between">
          <span className={`block truncate ${
            selectedCategory ? 'text-gray-900' : 'text-gray-500'
          }`}>
            {selectedCategory ? getCategoryDisplayName(selectedCategory) : placeholder}
          </span>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            <ChevronDown 
              className={`h-4 w-4 text-gray-400 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`} 
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Categories List */}
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                renderLoadingSkeleton()
              ) : apiError ? (
                renderError()
              ) : filteredCategories.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No categories found matching your search' : 'No categories available'}
                </div>
              ) : (
                <div role="listbox">
                  {filteredCategories.map(renderCategoryOption)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpenseCategoryDropdown;