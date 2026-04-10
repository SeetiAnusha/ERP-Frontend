
// ✅ SHARED DATA HOOKS - Used across multiple components
// These hooks cache data globally, eliminating duplicate API calls

import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { CACHE_STRATEGIES } from '../../lib/queryClient';

// ✅ SHARED DATA HOOKS - Used across multiple components
// These hooks cache data globally, eliminating duplicate API calls

/**
 * Helper function to extract data from API response
 * Handles both paginated ({ data: [...], pagination: {...} }) and non-paginated responses
 */
const extractDataArray = (response: any): any[] => {
  // Handle paginated response: { data: [...], pagination: {...} }
  if (response.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  // Handle direct array response
  if (Array.isArray(response.data)) {
    return response.data;
  }
  // Fallback to empty array
  return [];
};

export const useClients = () => {
  return useQuery({
    queryKey: QUERY_KEYS.clients,
    queryFn: async () => {
      const response = await api.get('/clients');
      return extractDataArray(response);
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

export const useBankAccounts = () => {
  return useQuery({
    queryKey: QUERY_KEYS.bankAccounts,
    queryFn: async () => {
      const response = await api.get('/bank-accounts');
      return extractDataArray(response);
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

export const useCards = () => {
  return useQuery({
    queryKey: QUERY_KEYS.cards,
    queryFn: async () => {
      const response = await api.get('/cards');
      return extractDataArray(response);
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

export const useCashRegisters = () => {
  return useQuery({
    queryKey: QUERY_KEYS.cashRegisters,
    queryFn: async () => {
      const response = await api.get('/cash-register-masters');
      return extractDataArray(response);
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

export const useSuppliers = () => {
  return useQuery({
    queryKey: QUERY_KEYS.suppliers,
    queryFn: async () => {
      const response = await api.get('/suppliers');
      return extractDataArray(response);
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

export const usePaymentNetworks = () => {
  return useQuery({
    queryKey: QUERY_KEYS.paymentNetworks,
    queryFn: async () => {
      const response = await api.get('/card-payment-networks');
      return extractDataArray(response);
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

// ✅ NEW: Credit Balances Hook
export const useCreditBalances = () => {
  return useQuery({
    queryKey: QUERY_KEYS.creditBalances,
    queryFn: async () => {
      const response = await api.get('/credit-balances');
      return extractDataArray(response);
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

// ✅ NEW: Credit Card Transactions Hook
export const useCreditCardTransactions = () => {
  return useQuery({
    queryKey: QUERY_KEYS.creditCardTransactions,
    queryFn: async () => {
      const response = await api.get('/credit-card-register');
      console.log('Credit Card Register Response:', response.data);
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.success && response.data.data) {
        // Backend returns { success: true, data: { entries: [...], total: X } }
        if (Array.isArray(response.data.data.entries)) {
          return response.data.data.entries;
        }
        // Or backend returns { success: true, data: [...] }
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
      } else if (response.data.entries && Array.isArray(response.data.entries)) {
        return response.data.entries;
      }
      
      console.warn('Unexpected response structure:', response.data);
      return [];
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

// ✅ NEW: Expense Categories Hook
export const useExpenseCategories = () => {
  return useQuery({
    queryKey: QUERY_KEYS.expenseCategories,
    queryFn: async () => {
      const response = await api.get('/expenses/categories');
      const categories = response.data.success ? response.data.data : (response.data.data || response.data);
      return Array.isArray(categories) ? categories : [];
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

// ✅ NEW: Expense Types Hook (for a specific category)
export const useExpenseTypes = (categoryId: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.expenseTypes(categoryId),
    queryFn: async () => {
      const response = await api.get(`/expenses/categories/${categoryId}/types`);
      const types = response.data.success ? response.data.data : (response.data.data || response.data);
      return Array.isArray(types) ? types : [];
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
    enabled: !!categoryId, // Only fetch if categoryId is provided
  });
};

// ✅ NEW: Financers Hook
export const useFinancers = () => {
  return useQuery({
    queryKey: QUERY_KEYS.financers,
    queryFn: async () => {
      const response = await api.get('/financers');
      return extractDataArray(response);
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

// ✅ NEW: Investment Agreements Hook
export const useInvestmentAgreements = () => {
  return useQuery({
    queryKey: QUERY_KEYS.investmentAgreements,
    queryFn: async () => {
      const response = await api.get('/investment-agreements');
      return extractDataArray(response);
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

// ✅ NEW: Investment Summary Hook
export const useInvestmentSummary = () => {
  return useQuery({
    queryKey: QUERY_KEYS.investmentSummary,
    queryFn: async () => {
      const response = await api.get('/investment-agreements/summary');
      return response.data;
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

// ✅ NEW: Investment Report Hook
export const useInvestmentReport = (type?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.investmentReport(type),
    queryFn: async () => {
      const params: any = {};
      if (type && type !== 'all') {
        params.type = type;
      }
      const response = await api.get('/reports/investment-tracking', { params });
      return response.data;
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

// ✅ NEW: Investors Hook
export const useInvestors = () => {
  return useQuery({
    queryKey: QUERY_KEYS.investors,
    queryFn: async () => {
      const response = await api.get('/investors');
      return extractDataArray(response);
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

// ✅ NEW: Investors Summary Hook
export const useInvestorsSummary = () => {
  return useQuery({
    queryKey: QUERY_KEYS.investorsSummary,
    queryFn: async () => {
      const response = await api.get('/investors/summary/statistics');
      return response.data;
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

// ✅ NEW: Recent Activity Hook
export const useRecentActivity = (limit: number = 100) => {
  return useQuery({
    queryKey: QUERY_KEYS.recentActivity(limit),
    queryFn: async () => {
      const response = await api.get(`/recent-activity?limit=${limit}`);
      return extractDataArray(response);
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

// ✅ NEW: Recent Activity Statistics Hook
export const useRecentActivityStatistics = () => {
  return useQuery({
    queryKey: QUERY_KEYS.recentActivityStatistics,
    queryFn: async () => {
      const response = await api.get('/recent-activity/statistics');
      return response.data;
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

// ✅ NEW: Recent Activity by Date Range Hook
export const useRecentActivityByDateRange = (startDate: string, endDate: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: QUERY_KEYS.recentActivityByDateRange(startDate, endDate),
    queryFn: async () => {
      const response = await api.get(`/recent-activity/date-range?startDate=${startDate}&endDate=${endDate}`);
      return extractDataArray(response);
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
    enabled: enabled && !!startDate && !!endDate,
  });
};

// ✅ COMBINED HOOK - Fetch all shared data at once with smart loading
export const useSharedMasterData = () => {
  const clients = useClients();
  const suppliers = useSuppliers();
  const bankAccounts = useBankAccounts();
  const cards = useCards();
  const cashRegisters = useCashRegisters();
  const paymentNetworks = usePaymentNetworks();

  return {
    clients: clients.data || [],
    suppliers: suppliers.data || [],
    bankAccounts: bankAccounts.data || [],
    cards: cards.data || [],
    cashRegisters: cashRegisters.data || [],
    paymentNetworks: paymentNetworks.data || [],
    
    // Combined loading states
    isLoading: clients.isLoading || suppliers.isLoading || bankAccounts.isLoading || cards.isLoading || 
               cashRegisters.isLoading || paymentNetworks.isLoading,
    
    // Any error state
    hasError: clients.isError || suppliers.isError || bankAccounts.isError || cards.isError || 
              cashRegisters.isError || paymentNetworks.isError,
    
    // All data loaded
    isReady: clients.isSuccess && suppliers.isSuccess && bankAccounts.isSuccess && cards.isSuccess && 
             cashRegisters.isSuccess && paymentNetworks.isSuccess,
    
    // ✅ REFETCH METHODS
    refetch: () => {
      clients.refetch();
      suppliers.refetch();
      bankAccounts.refetch();
      cards.refetch();
      cashRegisters.refetch();
      paymentNetworks.refetch();
    },
  };
};

// ✅ NEW: Adjustments Hook
export const useAdjustments = () => {
  return useQuery({
    queryKey: QUERY_KEYS.adjustments,
    queryFn: async () => {
      const response = await api.get('/adjustments');
      return extractDataArray(response);
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

// ✅ NEW: Investments Hook (standalone investments, not investment agreements)
export const useInvestments = () => {
  return useQuery({
    queryKey: QUERY_KEYS.investments,
    queryFn: async () => {
      const response = await api.get('/investments');
      return extractDataArray(response);
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};
