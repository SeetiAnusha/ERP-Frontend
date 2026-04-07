/**
 * Generic Pagination Hook
 * Manages pagination state and logic
 * Reusable across all pages
 */

import { useState, useCallback } from 'react';

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  from: number;
  to: number;
}

export interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export function usePagination(options: UsePaginationOptions = {}) {
  const {
    initialPage = 1,
    initialLimit = 50,
    onPageChange,
    onLimitChange
  } = options;

  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
    from: 0,
    to: 0
  });

  // Update pagination metadata from API response
  const updatePagination = useCallback((metadata: Partial<PaginationState>) => {
    setPagination(prev => ({
      ...prev,
      ...metadata
    }));
  }, []);

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page }));
      onPageChange?.(page);
    }
  }, [pagination.totalPages, onPageChange]);

  // Go to next page
  const nextPage = useCallback(() => {
    if (pagination.hasNext) {
      goToPage(pagination.page + 1);
    }
  }, [pagination.hasNext, pagination.page, goToPage]);

  // Go to previous page
  const prevPage = useCallback(() => {
    if (pagination.hasPrev) {
      goToPage(pagination.page - 1);
    }
  }, [pagination.hasPrev, pagination.page, goToPage]);

  // Go to first page
  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  // Go to last page
  const lastPage = useCallback(() => {
    goToPage(pagination.totalPages);
  }, [pagination.totalPages, goToPage]);

  // Change page size
  const changeLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 })); // Reset to page 1
    onLimitChange?.(limit);
  }, [onLimitChange]);

  // Reset pagination
  const reset = useCallback(() => {
    setPagination({
      page: initialPage,
      limit: initialLimit,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
      from: 0,
      to: 0
    });
  }, [initialPage, initialLimit]);

  return {
    pagination,
    updatePagination,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    changeLimit,
    reset
  };
}
