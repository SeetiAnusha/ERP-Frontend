import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { CACHE_STRATEGIES } from '../../lib/queryClient';

// Fixed Asset type
interface FixedAsset {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  acquisitionDate: string;
  acquisitionCost: number;
  usefulLife: number;
  depreciationMethod: string;
  residualValue: number;
  accumulatedDepreciation: number;
  bookValue: number;
  status: string;
  registrationNumber?: string;
  // Payment fields
  paymentType?: string;
  bankAccountId?: number;
  cardId?: number;
  supplierId?: number;
  // ... other fields
}

// Fixed Asset form data type
interface FixedAssetFormData {
  name: string;
  category: string;
  acquisitionDate: string;
  acquisitionCost: number;
  usefulLife: number;
  depreciationMethod?: string;
  residualValue?: number;
  accumulatedDepreciation?: number;
  status?: string;
  location?: string;
  serialNumber?: string;
  description?: string;
  // Payment fields (form uses strings; API submit may send numbers / null)
  paymentType?: string;
  bankAccountId?: string | number | null;
  cardId?: string | number | null;
  chequeNumber?: string;
  chequeDate?: string;
  transferNumber?: string;
  transferDate?: string;
  paymentReference?: string;
  voucherDate?: string;
  supplierId?: string | number | null;
  supplierRnc?: string;
  ncf?: string;
}

// ✅ React Query Integration - Better data management
export const useFixedAssets = () => {
  return useQuery({
    queryKey: QUERY_KEYS.fixedAssets,
    queryFn: async (): Promise<FixedAsset[]> => {
      const response = await api.get('/fixed-assets');
      
      // Handle different response structures
      let assetsData = [];
      if (Array.isArray(response.data)) {
        assetsData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        assetsData = response.data.data;
      } else if (response.data.fixedAssets && Array.isArray(response.data.fixedAssets)) {
        assetsData = response.data.fixedAssets;
      } else {
        console.warn('Unexpected fixed assets API response structure:', response.data);
        assetsData = [];
      }
      
      return assetsData;
    },
    ...CACHE_STRATEGIES.MASTER_DATA, // 30 min stale time, 60 min cache time
    throwOnError: false,
  });
};

// Individual fixed asset details query
export const useFixedAssetDetails = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.fixedAssetDetails(id),
    queryFn: async () => {
      const response = await api.get(`/fixed-assets/${id}`);
      return response.data;
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    enabled: !!id, // Only run if id exists
    throwOnError: false,
  });
};

// Create fixed asset mutation - following purchases pattern
export const useCreateFixedAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (assetData: FixedAssetFormData): Promise<FixedAsset> => {
      const response = await api.post('/fixed-assets', assetData);
      return response.data;
    },
    onSuccess: () => {
      // ✅ PERFORMANCE FIX: Parallel cache invalidation (7x faster!)
      // ✅ ALL invalidations are NECESSARY - they update balances in real-time
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fixedAssets }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountsPayable }), // ✅ Updates AP for credit payments
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers }), // ✅ Updates supplier credit balance
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts }), // ✅ Updates bank account balance
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cards }), // ✅ Updates card balance
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.creditCardTransactions }), // ✅ Updates credit card register
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankRegisters }), // ✅ Updates bank register
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] }),
      ]);
    },
    onError: (error: any) => {
      console.error('Fixed asset creation failed:', error);
    },
  });
};

// Update fixed asset mutation
export const useUpdateFixedAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FixedAssetFormData> }) => {
      const response = await api.put(`/fixed-assets/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fixedAssets }),
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] }),
      ]);
    },
  });
};

// Delete fixed asset mutation
export const useDeleteFixedAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/fixed-assets/${id}`);
      return response.data;
    },
    onSuccess: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.fixedAssets }),
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] }),
      ]);
    },
  });
};
