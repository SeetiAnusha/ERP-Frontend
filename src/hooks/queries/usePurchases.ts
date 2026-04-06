import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { CACHE_STRATEGIES } from '../../lib/queryClient';
import { Purchase } from '../../types';

// Purchase form data type
interface PurchaseFormData {
  transactionType: string;
  date: string;
  supplierId: string;
  supplierRnc?: string;
  ncf?: string;
  purchaseType: string;
  paymentType: string;
  bankAccountId?: string;
  cardId?: string;
  chequeNumber?: string;
  chequeDate?: string;
  transferNumber?: string;
  transferDate?: string;
  paymentReference?: string;
  voucherDate?: string;
  items: any[];
  associatedInvoices: any[];
}

// ✅ React Query Integration - Better data management
export const usePurchases = () => {
  return useQuery({
    queryKey: QUERY_KEYS.purchases,
    queryFn: async (): Promise<Purchase[]> => {
      const response = await api.get('/purchases', {
        params: {
          transaction_type: 'GOODS' // Only fetch GOODS transactions for Purchases page
        }
      });
      
      // Handle different response structures
      let purchasesData = [];
      if (Array.isArray(response.data)) {
        purchasesData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        purchasesData = response.data.data;
      } else if (response.data.purchases && Array.isArray(response.data.purchases)) {
        purchasesData = response.data.purchases;
      } else {
        console.warn('Unexpected purchases API response structure:', response.data);
        purchasesData = [];
      }
      
      return purchasesData;
    },
    ...CACHE_STRATEGIES.MASTER_DATA, // 30 min stale time, 60 min cache time
    throwOnError: false,
  });
};

// Individual purchase details query
export const usePurchaseDetails = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.purchaseDetails(id),
    queryFn: async () => {
      const response = await api.get(`/purchases/${id}/details`);
      return response.data;
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    enabled: !!id, // Only run if id exists
    throwOnError: false,
  });
};

// Create purchase mutation - simplified without optimistic updates to match old code behavior
export const useCreatePurchase = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (purchaseData: PurchaseFormData): Promise<Purchase> => {
      const response = await api.post('/purchases', purchaseData);
      return response.data;
    },
    onSuccess: () => {
      // ✅ Invalidate purchases cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.purchases });
      
      // ✅ CRITICAL: Invalidate products cache to update inventory after purchase
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      
      // ✅ CRITICAL FIX: Invalidate AccountsPayable cache when creating credit purchases
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountsPayable });
      
      // ✅ Also invalidate related caches that might be affected by inventory changes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers }); // Supplier balances might change
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts }); // Bank balances might change
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cards }); // Card balances might change
      
      // ✅ Invalidate recent activity to show new transactions
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
    },
    onError: (error: any) => {
      // ✅ Just log error, let the form handle error notifications
      console.error('Purchase creation failed:', error);
    },
    // ✅ Remove optimistic updates to match old code behavior
    // onMutate, onSettled removed - form handles everything
  });
};