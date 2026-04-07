/**
 * Generic Filter Panel Component
 * Reusable filter UI
 */

import React from 'react';

export interface FilterConfig {
  name: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: Array<{ value: string | number; label: string }> | string[];
  placeholder?: string;
}

export interface FilterPanelProps {
  filters: FilterConfig[];
  activeFilters: Record<string, any>;
  onChange: (filters: Record<string, any>) => void;
  onClear?: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  activeFilters,
  onChange,
  onClear
}) => {
  const handleFilterChange = (name: string, value: any) => {
    onChange({
      ...activeFilters,
      [name]: value
    });
  };

  const handleClear = () => {
    const clearedFilters: Record<string, any> = {};
    filters.forEach(filter => {
      clearedFilters[filter.name] = '';
    });
    onChange(clearedFilters);
    onClear?.();
  };

  const hasActiveFilters = Object.values(activeFilters).some(
    value => value !== '' && value !== null && value !== undefined
  );

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: '#f9fafb',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', margin: 0 }}>
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            style={{
              padding: '0.25rem 0.75rem',
              fontSize: '0.75rem',
              color: '#ef4444',
              background: 'none',
              border: '1px solid #ef4444',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {filters.map(filter => (
          <div key={filter.name}>
            <label
              htmlFor={filter.name}
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: '#6b7280',
                marginBottom: '0.25rem'
              }}
            >
              {filter.label}
            </label>

            {filter.type === 'select' ? (
              <select
                id={filter.name}
                value={activeFilters[filter.name] || ''}
                onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <option value="">All</option>
                {filter.options?.map(option => {
                  const value = typeof option === 'string' ? option : option.value;
                  const label = typeof option === 'string' ? option : option.label;
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            ) : (
              <input
                id={filter.name}
                type={filter.type}
                value={activeFilters[filter.name] || ''}
                onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                placeholder={filter.placeholder}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
