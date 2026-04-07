/**
 * Generic Pagination Component
 * Reusable pagination UI
 */

import React from 'react';

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  from: number;
  to: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onFirst?: () => void;
  onLast?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  limit,
  from,
  to,
  hasNext,
  hasPrev,
  onPageChange,
  onLimitChange,
  onFirst,
  onLast,
  onNext,
  onPrev
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current, and nearby pages
      pages.push(1);

      if (page > 3) {
        pages.push('...');
      }

      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="pagination-container" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '1rem',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb'
    }}>
      {/* Left: Info */}
      <div className="pagination-info" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        Showing <strong>{from}</strong> to <strong>{to}</strong> of <strong>{total}</strong> results
      </div>

      {/* Center: Page Navigation */}
      <div className="pagination-controls" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {/* First Page */}
        <button
          onClick={onFirst}
          disabled={!hasPrev}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            backgroundColor: hasPrev ? 'white' : '#f3f4f6',
            cursor: hasPrev ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem'
          }}
          title="First Page"
        >
          ««
        </button>

        {/* Previous Page */}
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            backgroundColor: hasPrev ? 'white' : '#f3f4f6',
            cursor: hasPrev ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem'
          }}
          title="Previous Page"
        >
          «
        </button>

        {/* Page Numbers */}
        {pageNumbers.map((pageNum, index) => (
          pageNum === '...' ? (
            <span key={`ellipsis-${index}`} style={{ padding: '0.5rem' }}>...</span>
          ) : (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum as number)}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                backgroundColor: page === pageNum ? '#3b82f6' : 'white',
                color: page === pageNum ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: page === pageNum ? 'bold' : 'normal'
              }}
            >
              {pageNum}
            </button>
          )
        ))}

        {/* Next Page */}
        <button
          onClick={onNext}
          disabled={!hasNext}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            backgroundColor: hasNext ? 'white' : '#f3f4f6',
            cursor: hasNext ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem'
          }}
          title="Next Page"
        >
          »
        </button>

        {/* Last Page */}
        <button
          onClick={onLast}
          disabled={!hasNext}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            backgroundColor: hasNext ? 'white' : '#f3f4f6',
            cursor: hasNext ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem'
          }}
          title="Last Page"
        >
          »»
        </button>
      </div>

      {/* Right: Page Size Selector */}
      <div className="pagination-limit" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label htmlFor="page-limit" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Per page:
        </label>
        <select
          id="page-limit"
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
      </div>
    </div>
  );
};
