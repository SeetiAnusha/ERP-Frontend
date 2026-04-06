import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../lib/queryKeys';

/**
 * Centralized cache invalidation utilities
 * Eliminates duplication of cache invalidation logic across components
 */

export const invalidateFinancialCaches = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountsPayable });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountsReceivable });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cards });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashRegisters });
};

export const invalidatePaymentCaches = (queryClient: QueryClient) => {
  invalidateFinancialCaches(queryClient);
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers });
};

export const invalidatePurchaseCaches = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.purchases });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountsPayable });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cards });
};

export const invalidateSalesCaches = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sales });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountsReceivable });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashRegisters });
};

export const invalidateExpenseCaches = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.businessExpenses });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountsPayable });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cards });
  queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
};

export const invalidateInventoryCaches = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.purchases });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sales });
};

export const invalidateAllCaches = (queryClient: QueryClient) => {
  queryClient.invalidateQueries();
};

/**
 * Invalidate caches based on transaction type
 */
export const invalidateCachesByTransactionType = (
  queryClient: QueryClient,
  transactionType: 'PURCHASE' | 'SALE' | 'PAYMENT' | 'EXPENSE' | 'INVENTORY'
) => {
  switch (transactionType) {
    case 'PURCHASE':
      invalidatePurchaseCaches(queryClient);
      break;
    case 'SALE':
      invalidateSalesCaches(queryClient);
      break;
    case 'PAYMENT':
      invalidatePaymentCaches(queryClient);
      break;
    case 'EXPENSE':
      invalidateExpenseCaches(queryClient);
      break;
    case 'INVENTORY':
      invalidateInventoryCaches(queryClient);
      break;
  }
};

/**
 * ✅ NEW: Invalidate all caches after deletion execution
 * This ensures balances and lists update immediately without page refresh
 */
export const invalidateDeletionCaches = (queryClient: QueryClient) => {
  // Invalidate all transaction lists
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sales });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.purchases });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountsPayable });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountsReceivable });
  
  // Invalidate register transactions
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankTransactions });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashTransactions });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.creditCardTransactions });
  
  // ✅ CRITICAL: Invalidate master balances (this fixes the refresh issue)
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashRegisters });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cards });
  
  // Invalidate expenses (for processing fees)
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.businessExpenses });
  
  // Invalidate recent activity
  queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
  
  // Invalidate credit balances
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.creditBalances });
  
  // Invalidate master data
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
  
  console.log('✅ [Cache Invalidation] All deletion-related caches invalidated');
};
