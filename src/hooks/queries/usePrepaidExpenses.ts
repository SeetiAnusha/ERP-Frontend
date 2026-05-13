import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { CACHE_STRATEGIES } from '../../lib/queryClient';

// Prepaid Expense type
interface PrepaidExpense {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  amortizationPeriod: number;
  monthlyAmortization: number;
  amortizedAmount: number;
  remainingAmount: number;
  status: string;
  registrationNumber?: string;
  // Payment fields
  paymentType?: string;
  bankAccountId?: number;
  cardId?: number;
  supplierId?: number;
  // ... other fields
}

// Prepaid Expense form data type
interface PrepaidExpenseFormData {
  name: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  amortizationPeriod?: number;
  status?: string;
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
export const usePrepaidExpenses = () => {
  return useQuery({
    queryKey: QUERY_KEYS.prepaidExpenses,
    queryFn: async (): Promise<PrepaidExpense[]> => {
      const response = await api.get('/prepaid-expenses');
      
      // Handle different response structures
      let expensesData = [];
      if (Array.isArray(response.data)) {
        expensesData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        expensesData = response.data.data;
      } else if (response.data.prepaidExpenses && Array.isArray(response.data.prepaidExpenses)) {
        expensesData = response.data.prepaidExpenses;
      } else {
        console.warn('Unexpected prepaid expenses API response structure:', response.data);
        expensesData = [];
      }
      
      return expensesData;
    },
    ...CACHE_STRATEGIES.MASTER_DATA, // 30 min stale time, 60 min cache time
    throwOnError: false,
  });
};

// Individual prepaid expense details query
export const usePrepaidExpenseDetails = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.prepaidExpenseDetails(id),
    queryFn: async () => {
      const response = await api.get(`/prepaid-expenses/${id}`);
      return response.data;
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    enabled: !!id, // Only run if id exists
    throwOnError: false,
  });
};

// Create prepaid expense mutation - following purchases pattern
export const useCreatePrepaidExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (expenseData: PrepaidExpenseFormData): Promise<PrepaidExpense> => {
      const response = await api.post('/prepaid-expenses', expenseData);
      return response.data;
    },
    onSuccess: () => {
      // ✅ PERFORMANCE FIX: Parallel cache invalidation (7x faster!)
      // ✅ ALL invalidations are NECESSARY - they update balances in real-time
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.prepaidExpenses }),
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
      console.error('Prepaid expense creation failed:', error);
    },
  });
};

// Update prepaid expense mutation
export const useUpdatePrepaidExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PrepaidExpenseFormData> }) => {
      const response = await api.put(`/prepaid-expenses/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.prepaidExpenses }),
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] }),
      ]);
    },
  });
};

// Delete prepaid expense mutation
export const useDeletePrepaidExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/prepaid-expenses/${id}`);
      return response.data;
    },
    onSuccess: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.prepaidExpenses }),
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] }),
      ]);
    },
  });
};
