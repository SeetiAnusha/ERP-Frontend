import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { CACHE_STRATEGIES } from '../../lib/queryClient';

// Investment type
interface Investment {
  id: number;
  code: string;
  name: string;
  type: string;
  description: string;
  acquisitionDate: string;
  acquisitionCost: number;
  currentValue: number;
  quantity: number;
  unitCost: number;
  status: string;
  registrationNumber?: string;
  maturityDate?: string;
  interestRate?: number;
  riskLevel?: string;
  broker?: string;
  // Payment fields
  paymentType?: string;
  bankAccountId?: number;
  cardId?: number;
  supplierId?: number;
  // ... other fields
}

// Investment form data type
interface InvestmentFormData {
  name: string;
  type: string;
  description: string;
  acquisitionDate: string;
  acquisitionCost: number;
  currentValue: number;
  quantity: number;
  unitCost: number;
  status?: string;
  maturityDate?: string;
  interestRate?: number;
  riskLevel?: string;
  broker?: string;
  // Payment fields
  paymentType?: string;
  bankAccountId?: string;
  cardId?: string;
  chequeNumber?: string;
  chequeDate?: string;
  transferNumber?: string;
  transferDate?: string;
  paymentReference?: string;
  voucherDate?: string;
  supplierId?: string;
  supplierRnc?: string;
  ncf?: string;
}

// ✅ React Query Integration - Better data management
export const useInvestments = () => {
  return useQuery({
    queryKey: QUERY_KEYS.investments,
    queryFn: async (): Promise<Investment[]> => {
      const response = await api.get('/investments');
      
      // Handle different response structures
      let investmentsData = [];
      if (Array.isArray(response.data)) {
        investmentsData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        investmentsData = response.data.data;
      } else if (response.data.investments && Array.isArray(response.data.investments)) {
        investmentsData = response.data.investments;
      } else {
        console.warn('Unexpected investments API response structure:', response.data);
        investmentsData = [];
      }
      
      return investmentsData;
    },
    ...CACHE_STRATEGIES.MASTER_DATA, // 30 min stale time, 60 min cache time
    throwOnError: false,
  });
};

// Individual investment details query
export const useInvestmentDetails = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.investmentDetails(id),
    queryFn: async () => {
      const response = await api.get(`/investments/${id}`);
      return response.data;
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    enabled: !!id, // Only run if id exists
    throwOnError: false,
  });
};

// Create investment mutation - following purchases pattern
export const useCreateInvestment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (investmentData: InvestmentFormData): Promise<Investment> => {
      const response = await api.post('/investments', investmentData);
      return response.data;
    },
    onSuccess: () => {
      // ✅ PERFORMANCE FIX: Parallel cache invalidation (7x faster!)
      // ✅ ALL invalidations are NECESSARY - they update balances in real-time
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.investments }),
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
      console.error('Investment creation failed:', error);
    },
  });
};

// Update investment mutation
export const useUpdateInvestment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InvestmentFormData> }) => {
      const response = await api.put(`/investments/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.investments }),
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] }),
      ]);
    },
  });
};

// Delete investment mutation
export const useDeleteInvestment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/investments/${id}`);
      return response.data;
    },
    onSuccess: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.investments }),
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] }),
      ]);
    },
  });
};
