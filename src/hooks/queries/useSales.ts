import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { CACHE_STRATEGIES } from '../../lib/queryClient';
import { Sale } from '../../types';
import { notify } from '../../utils/notifications';

// Sales query hook
export const useSales = () => {
  return useQuery({
    queryKey: QUERY_KEYS.sales,
    queryFn: async (): Promise<Sale[]> => {
      const response = await api.get('/sales');
      return Array.isArray(response.data) ? response.data : [];
    },
    ...CACHE_STRATEGIES.TRANSACTION_DATA, // 2 min stale time, 10 min cache time
    throwOnError: false,
  });
};

// Individual sale query hook
export const useSale = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.sale(id),
    queryFn: async (): Promise<Sale> => {
      const response = await api.get(`/sales/${id}`);
      return response.data;
    },
    ...CACHE_STRATEGIES.TRANSACTION_DATA,
    enabled: !!id,
    throwOnError: false,
  });
};

// Sale details query hook
export const useSaleDetails = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.saleDetails(id),
    queryFn: async (): Promise<Sale> => {
      const response = await api.get(`/sales/${id}/details`);
      return response.data;
    },
    ...CACHE_STRATEGIES.TRANSACTION_DATA,
    enabled: !!id,
    throwOnError: false,
  });
};

// Create sale mutation - simplified without optimistic updates to match Purchases pattern
export const useCreateSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (saleData: Partial<Sale>): Promise<Sale> => {
      const response = await api.post('/sales', saleData);
      return response.data;
    },
    onSuccess: () => {
      // ✅ Invalidate sales cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sales });
      
      // ✅ CRITICAL: Invalidate products cache to update inventory after sale
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      
      // ✅ CRITICAL FIX: Invalidate AccountsReceivable cache when creating credit sales
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountsReceivable });
      
      // ✅ Also invalidate related caches that might be affected by inventory changes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients }); // Client balances might change
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashRegisters }); // Cash register balances might change
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts }); // Bank balances might change
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cards }); // Card balances might change
      
      // ✅ Invalidate recent activity to show new transactions
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
    },
    onError: (error: any) => {
      // ✅ Just log error, let the form handle error notifications
      console.error('Sale creation failed:', error);
    },
    // ✅ Remove optimistic updates to match Purchases pattern
    // onMutate, onSettled removed - form handles everything
  });
};

// Update sale mutation
export const useUpdateSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: Partial<Sale> }): Promise<Sale> => {
      const response = await api.put(`/sales/${id}`, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.sales });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.sale(Number(id)) });
      
      // Snapshot previous values
      const previousSales = queryClient.getQueryData<Sale[]>(QUERY_KEYS.sales);
      const previousSale = queryClient.getQueryData<Sale>(QUERY_KEYS.sale(Number(id)));
      
      // Optimistically update sales list
      if (previousSales) {
        queryClient.setQueryData<Sale[]>(QUERY_KEYS.sales, (old = []) =>
          old.map(sale => 
            sale.id === id ? { ...sale, ...data } : sale
          )
        );
      }
      
      // Optimistically update individual sale
      if (previousSale) {
        queryClient.setQueryData(QUERY_KEYS.sale(Number(id)), {
          ...previousSale,
          ...data
        });
      }
      
      return { previousSales, previousSale };
    },
    onError: (_error, { id }, context) => {
      // Rollback on error
      if (context?.previousSales) {
        queryClient.setQueryData(QUERY_KEYS.sales, context.previousSales);
      }
      if (context?.previousSale) {
        queryClient.setQueryData(QUERY_KEYS.sale(Number(id)), context.previousSale);
      }
    },
    onSuccess: () => {
      notify.success('Success', 'Sale updated successfully');
    },
    onSettled: (_data, _error, { id }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sales });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sale(Number(id)) });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
    },
  });
};

// Delete sale mutation
export const useDeleteSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number | string): Promise<void> => {
      await api.delete(`/sales/${id}`);
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.sales });
      
      // Snapshot previous value
      const previousSales = queryClient.getQueryData<Sale[]>(QUERY_KEYS.sales);
      
      // Optimistically update
      if (previousSales) {
        queryClient.setQueryData<Sale[]>(QUERY_KEYS.sales, (old = []) =>
          old.filter(sale => sale.id !== id)
        );
      }
      
      return { previousSales };
    },
    onError: (_error, _id, context) => {
      // Rollback on error
      if (context?.previousSales) {
        queryClient.setQueryData(QUERY_KEYS.sales, context.previousSales);
      }
    },
    onSuccess: () => {
      notify.success('Success', 'Sale deleted successfully');
    },
    onSettled: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sales });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products }); // Restore product stock
    },
  });
};