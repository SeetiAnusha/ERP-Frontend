import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { CACHE_STRATEGIES } from '../../lib/queryClient';
import { notify } from '../../utils/notifications';

// Accounts Payable hooks
export const useAccountsPayable = () => {
  return useQuery({
    queryKey: QUERY_KEYS.accountsPayable,
    queryFn: async () => {
      const response = await api.get('/accounts-payable');
      return Array.isArray(response.data) ? response.data : [];
    },
    ...CACHE_STRATEGIES.FINANCIAL_DATA, // 2 min stale time, 15 min cache time
    throwOnError: false,
  });
};

// Accounts Receivable hooks
export const useAccountsReceivable = () => {
  return useQuery({
    queryKey: QUERY_KEYS.accountsReceivable,
    queryFn: async () => {
      const response = await api.get('/accounts-receivable');
      return Array.isArray(response.data) ? response.data : [];
    },
    ...CACHE_STRATEGIES.FINANCIAL_DATA,
    throwOnError: false,
  });
};

// Bank Transactions hooks
export const useBankTransactions = () => {
  return useQuery({
    queryKey: QUERY_KEYS.bankTransactions,
    queryFn: async () => {
      const response = await api.get('/bank-register');
      return Array.isArray(response.data) ? response.data : [];
    },
    ...CACHE_STRATEGIES.FINANCIAL_DATA,
    throwOnError: false,
  });
};

// Cash Register hooks
export const useCashTransactions = () => {
  return useQuery({
    queryKey: QUERY_KEYS.cashTransactions,
    queryFn: async () => {
      const response = await api.get('/cash-register');
      return Array.isArray(response.data) ? response.data : [];
    },
    ...CACHE_STRATEGIES.FINANCIAL_DATA,
    throwOnError: false,
  });
};

// Payments hooks
export const usePayments = () => {
  return useQuery({
    queryKey: QUERY_KEYS.payments,
    queryFn: async () => {
      const response = await api.get('/payments');
      return Array.isArray(response.data) ? response.data : [];
    },
    ...CACHE_STRATEGIES.FINANCIAL_DATA,
    throwOnError: false,
  });
};

// ✅ NOTE: useRecentActivity hooks moved to useSharedData.ts
// - useRecentActivity(limit)
// - useRecentActivityStatistics()
// - useRecentActivityByDateRange(startDate, endDate, enabled)

// ✅ NEW: Business Expenses hooks with pagination
export const useBusinessExpenses = (options?: { 
  dateRange?: { startDate: string; endDate: string };
  page?: number;
  limit?: number;
}) => {
  const { dateRange, page = 1, limit = 50 } = options || {};
  
  return useQuery({
    queryKey: dateRange 
      ? [...QUERY_KEYS.businessExpenses, dateRange.startDate, dateRange.endDate, page, limit]
      : [...QUERY_KEYS.businessExpenses, page, limit],
    queryFn: async () => {
      const params: any = {
        page,
        limit
      };
      
      if (dateRange) {
        params.dateFrom = dateRange.startDate;
        params.dateTo = dateRange.endDate;
      }
      
      const response = await api.get('/business-expenses', { params });
      
      // Handle response structure
      if (response.data.success) {
        return {
          data: response.data.data || [],
          pagination: response.data.pagination || {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        };
      }
      
      return {
        data: Array.isArray(response.data) ? response.data : [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      };
    },
    ...CACHE_STRATEGIES.FINANCIAL_DATA,
    throwOnError: false,
  });
};

// ✅ NEW: Business Expense Dashboard hook
export const useBusinessExpenseDashboard = (period: string = 'all') => {
  return useQuery({
    queryKey: QUERY_KEYS.businessExpenseDashboard(period),
    queryFn: async () => {
      const response = await api.get('/business-expenses/dashboard', {
        params: { period }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      return response.data;
    },
    ...CACHE_STRATEGIES.FINANCIAL_DATA,
    throwOnError: false,
  });
};

// Payment mutations (for accounts payable/receivable)
export const useProcessPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await api.post('/payments', paymentData);
      return response.data;
    },
    onSuccess: () => {
      notify.success('Success', 'Payment processed successfully');
      // Invalidate related financial queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountsPayable });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountsReceivable });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankTransactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashTransactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
    },
  });
};

// Create Accounts Payable mutation
export const useCreateAccountsPayable = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payableData: any) => {
      const response = await api.post('/accounts-payable', payableData);
      return response.data;
    },
    onSuccess: () => {
      notify.success('Success', 'Accounts payable entry created successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountsPayable });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
    },
  });
};

// Create Accounts Receivable mutation
export const useCreateAccountsReceivable = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (receivableData: any) => {
      const response = await api.post('/accounts-receivable', receivableData);
      return response.data;
    },
    onSuccess: () => {
      notify.success('Success', 'Accounts receivable entry created successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountsReceivable });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
    },
  });
};

// Create Bank Transaction mutation
export const useCreateBankTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transactionData: any) => {
      const response = await api.post('/bank-register', transactionData);
      return response.data;
    },
    onSuccess: () => {
      notify.success('Success', 'Bank transaction created successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankTransactions });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts }); // Update bank balances
    },
  });
};

// Create Cash Transaction mutation
export const useCreateCashTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transactionData: any) => {
      const response = await api.post('/cash-register', transactionData);
      return response.data;
    },
    onSuccess: () => {
      notify.success('Success', 'Cash transaction created successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashTransactions });
      queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashRegisters }); // Update cash balances
    },
  });
};