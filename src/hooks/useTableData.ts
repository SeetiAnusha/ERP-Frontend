/**
 * Generic Table Data Hook
 * Fetches paginated data with search and filters
 * Reusable across all pages
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { usePagination } from './usePagination';

export interface UseTableDataOptions {
  endpoint: string;
  initialPage?: number;
  initialLimit?: number;
  initialFilters?: Record<string, any>;
  initialSearch?: string;
  initialSortBy?: string;
  initialSortOrder?: 'ASC' | 'DESC';
  autoFetch?: boolean;
}

export function useTableData<T = any>(options: UseTableDataOptions) {
  const {
    endpoint,
    initialPage = 1,
    initialLimit = 50,
    initialFilters = {},
    initialSearch = '',
    initialSortBy = 'createdAt',
    initialSortOrder = 'DESC',
    autoFetch = true
  } = options;

  // State
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState(initialSearch);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(initialSortOrder);

  // Pagination
  const {
    pagination,
    updatePagination,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    changeLimit
  } = usePagination({
    initialPage,
    initialLimit
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder
      };

      // Add search
      if (search) {
        params.search = search;
      }

      // Add filters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params[key] = filters[key];
        }
      });

      const response = await axios.get(endpoint, { params });
      console.log('📦 useTableData response:', {
        endpoint,
        params,
        hasData: !!response.data.data,
        dataLength: response.data.data?.length,
        hasPagination: !!response.data.pagination,
        fullResponse: response.data
      });

      setData(response.data.data || []);
      updatePagination(response.data.pagination || {});
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, pagination.page, pagination.limit, search, filters, sortBy, sortOrder, updatePagination]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  // Update filter
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    goToPage(1); // Reset to first page when filter changes
  }, [goToPage]);

  // Update multiple filters
  const updateFilters = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
    goToPage(1);
  }, [goToPage]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setSearch('');
    goToPage(1);
  }, [goToPage]);

  // Update search
  const updateSearch = useCallback((value: string) => {
    setSearch(value);
    goToPage(1); // Reset to first page when search changes
  }, [goToPage]);

  // Update sort
  const updateSort = useCallback((field: string, order?: 'ASC' | 'DESC') => {
    setSortBy(field);
    setSortOrder(order || (sortBy === field && sortOrder === 'ASC' ? 'DESC' : 'ASC'));
    goToPage(1);
  }, [sortBy, sortOrder, goToPage]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    // Data
    data,
    loading,
    error,

    // Pagination
    pagination,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    changeLimit,

    // Filters
    filters,
    updateFilter,
    updateFilters,
    clearFilters,

    // Search
    search,
    updateSearch,

    // Sort
    sortBy,
    sortOrder,
    updateSort,

    // Actions
    refresh,
    fetchData
  };
}
