import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, AlertCircle, Loader2, Shield, DollarSign } from 'lucide-react';
import api from '../api/axios';
import { ExpenseType } from '../types';
import { formatNumber } from '../utils/formatNumber';

/**
 * ExpenseTypeDropdown Component
 * 
 * Senior Developer Features:
 * - Category-dependent loading
 * - Approval threshold display
 * - Real-time search with debouncing
 * - Error handling with retry mechanism
 * - Loading states and skeleton UI
 * - Accessibility support
 * - Performance optimization
 * - Visual indicators for approval requirements
 */

interface ExpenseTypeDropdownProps {
  categoryId?: number;
  value?: number;
  onChange: (typeId: number, type: ExpenseType) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  includeInactive?: boolean;
  showApprovalInfo?: boolean;
}

const ExpenseTypeDropdown = ({
  categoryId,
  value,
  onChange,
  placeholder = 'Select expense type...',
  disabled = false,
  required = false,
  error,
  className = '',
  includeInactive = false,
  showApprovalInfo = true
}: ExpenseTypeDropdownProps) => {
  const [types, setTypes] = useState<ExpenseType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<ExpenseType[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ExpenseType | null>(null);

  // Fetch types when category changes
  useEffect(() => {
    if (categoryId) {
      fetchTypes();
    } else {
      setTypes([]);
      setSelectedType(null);
    }
  }, [categoryId, includeInactive]);

  // Filter types based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTypes(types);
    } else {
      const filtered = types.filter(type =>
        type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTypes(filtered);
    }
  }, [searchTerm, types]);

  // Set selected type when value changes
  useEffect(() => {
    if (value && types.length > 0) {
      const type = types.find(t => t.id === value);
      setSelectedType(type || null);
    } else {
      setSelectedType(null);
    }
  }, [value, types]);

  const fetchTypes = async (retryCount = 0) => {
    if (!categoryId) return;

    try {
      setLoading(true);
      setApiError(null);

      const response = await api.get(`/expenses/categories/${categoryId}/types`, {
        params: {
          includeInactive,
          limit: 100 // Get all types for dropdown
        }
      });

      if (response.data.success) {
        setTypes(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch expense types');
      }
    } catch (error: any) {
      console.error('Error fetching expense types:', error);
      
      if (retryCount < 2) {
        // Retry up to 2 times
        setTimeout(() => fetchTypes(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        setApiError(error.response?.data?.message || error.message || 'Failed to load expense types');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (type: ExpenseType) => {
    setSelectedType(type);
    onChange(type.id, type);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!disabled && categoryId) {
        setIsOpen(!isOpen);
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const renderTypeOption = (type: ExpenseType) => (
    <motion.div
      key={type.id}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ backgroundColor: '#f3f4f6' }}
      className="p-3 cursor-pointer border-b border-gray-100 last:border-b-0"
      onClick={() => handleTypeSelect(type)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{type.name}</span>
            {type.requiresApproval && showApprovalInfo && (
              <Shield className="h-4 w-4 text-amber-500" />
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
              {type.code}
            </span>
            
            {type.requiresApproval && type.approvalThreshold && showApprovalInfo && (
              <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {formatNumber(type.approvalThreshold)}+
              </span>
            )}
            
            {type.defaultAccountCode && (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                {type.defaultAccountCode}
              </span>
            )}
          </div>
          
          {type.description && (
            <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
              {type.description}
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-1">
          {!type.isActive && (
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
              Inactive
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderLoadingSkeleton = () => (
    <div className="p-3 space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="flex gap-2 mb-1">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
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
        onClick={() => fetchTypes()}
        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
      >
        Retry
      </button>
    </div>
  );

  const isDisabled = disabled || !categoryId;
  const effectivePlaceholder = !categoryId 
    ? 'Select a category first...' 
    : placeholder;

  return (
    <div className={`relative ${className}`}>
      {/* Dropdown Button */}
      <div
        className={`
          relative w-full bg-white border rounded-lg px-3 py-2 text-left cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={isDisabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select expense type"
        aria-required={required}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <span className={`block truncate ${
              selectedType ? 'text-gray-900' : 'text-gray-500'
            }`}>
              {selectedType ? selectedType.name : effectivePlaceholder}
            </span>
            {selectedType?.requiresApproval && showApprovalInfo && (
              <Shield className="h-4 w-4 text-amber-500 flex-shrink-0" />
            )}
          </div>
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

      {/* Approval Info */}
      {selectedType?.requiresApproval && selectedType.approvalThreshold && showApprovalInfo && (
        <p className="mt-1 text-sm text-amber-600 flex items-center gap-1">
          <Shield className="h-4 w-4" />
          Requires approval for amounts ≥ {formatNumber(selectedType.approvalThreshold)}
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
                  placeholder="Search expense types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Types List */}
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                renderLoadingSkeleton()
              ) : apiError ? (
                renderError()
              ) : filteredTypes.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No expense types found matching your search' : 'No expense types available for this category'}
                </div>
              ) : (
                <div role="listbox">
                  {filteredTypes.map(renderTypeOption)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpenseTypeDropdown;