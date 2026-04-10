import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { CACHE_STRATEGIES } from '../../lib/queryClient';
import { notify } from '../../utils/notifications';

// Chart of Accounts
export const useChartOfAccounts = () => {
  return useQuery({
    queryKey: QUERY_KEYS.chartOfAccounts || ['chart-of-accounts'],
    queryFn: async () => {
      const response = await api.get('/accounting/chart-of-accounts');
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

// General Ledger
export const useGeneralLedger = (filters?: any) => {
  return useQuery({
    queryKey: ['general-ledger', filters],
    queryFn: async () => {
      const response = await api.get('/accounting/general-ledger', { params: filters });
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    },
    ...CACHE_STRATEGIES.FINANCIAL_DATA,
    throwOnError: false,
  });
};

// Trial Balance
export const useTrialBalance = (asOfDate?: string) => {
  return useQuery({
    queryKey: ['trial-balance', asOfDate],
    queryFn: async () => {
      const response = await api.get('/accounting/trial-balance', {
        params: asOfDate ? { asOfDate } : {}
      });
      return response.data;
    },
    ...CACHE_STRATEGIES.FINANCIAL_DATA,
    throwOnError: false,
  });
};

// Fiscal Periods
export const useFiscalPeriods = () => {
  return useQuery({
    queryKey: ['fiscal-periods'],
    queryFn: async () => {
      const response = await api.get('/accounting/fiscal-periods');
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
};

// Current Fiscal Period
export const useCurrentFiscalPeriod = () => {
  return useQuery({
    queryKey: ['fiscal-period-current'],
    queryFn: async () => {
      const response = await api.get('/accounting/fiscal-periods/current');
      return response.data;
    },
    ...CACHE_STRATEGIES.FINANCIAL_DATA,
    throwOnError: false,
  });
};

// Balance Sheet
export const useBalanceSheet = (asOfDate: string, options?: any) => {
  return useQuery({
    queryKey: ['balance-sheet', asOfDate, options],
    queryFn: async () => {
      const response = await api.get('/reports/balance-sheet', {
        params: { asOfDate, ...options }
      });
      return response.data;
    },
    enabled: !!asOfDate,
    ...CACHE_STRATEGIES.FINANCIAL_DATA,
    throwOnError: false,
  });
};

// Profit & Loss
export const useProfitLoss = (startDate: string, endDate: string, options?: any) => {
  return useQuery({
    queryKey: ['profit-loss', startDate, endDate, options],
    queryFn: async () => {
      const response = await api.get('/reports/profit-loss', {
        params: { startDate, endDate, ...options }
      });
      return response.data;
    },
    enabled: !!startDate && !!endDate,
    ...CACHE_STRATEGIES.FINANCIAL_DATA,
    throwOnError: false,
  });
};

// Cash Flow Statement
export const useCashFlow = (startDate: string, endDate: string, method: 'DIRECT' | 'INDIRECT' = 'INDIRECT') => {
  return useQuery({
    queryKey: ['cash-flow', startDate, endDate, method],
    queryFn: async () => {
      const response = await api.get('/reports/cash-flow', {
        params: { startDate, endDate, method }
      });
      return response.data;
    },
    enabled: !!startDate && !!endDate,
    ...CACHE_STRATEGIES.FINANCIAL_DATA,
    throwOnError: false,
  });
};

// Account Statement
export const useAccountStatement = (accountCode: string, startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['account-statement', accountCode, startDate, endDate],
    queryFn: async () => {
      const response = await api.get('/reports/account-statement', {
        params: { accountCode, startDate, endDate }
      });
      return response.data;
    },
    enabled: !!accountCode && !!startDate && !!endDate,
    ...CACHE_STRATEGIES.FINANCIAL_DATA,
    throwOnError: false,
  });
};

// Mutations

// Create Chart of Account
export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (accountData: any) => {
      const response = await api.post('/accounting/chart-of-accounts', accountData);
      return response.data;
    },
    onSuccess: () => {
      notify.success('Success', 'Account created successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chartOfAccounts || ['chart-of-accounts'] });
    },
    onError: (error: any) => {
      notify.error('Error', error.response?.data?.error || 'Failed to create account');
    },
  });
};

// Update Chart of Account
export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...accountData }: any) => {
      const response = await api.put(`/accounting/chart-of-accounts/${id}`, accountData);
      return response.data;
    },
    onSuccess: () => {
      notify.success('Success', 'Account updated successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chartOfAccounts || ['chart-of-accounts'] });
    },
    onError: (error: any) => {
      notify.error('Error', error.response?.data?.error || 'Failed to update account');
    },
  });
};

// Delete Chart of Account
export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/accounting/chart-of-accounts/${id}`);
      return response.data;
    },
    onSuccess: () => {
      notify.success('Success', 'Account deleted successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chartOfAccounts || ['chart-of-accounts'] });
    },
    onError: (error: any) => {
      notify.error('Error', error.response?.data?.error || 'Failed to delete account');
    },
  });
};

// Initialize Default Accounts
export const useInitializeAccounts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/accounting/chart-of-accounts/initialize');
      return response.data;
    },
    onSuccess: () => {
      notify.success('Success', 'Default accounts initialized successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chartOfAccounts || ['chart-of-accounts'] });
    },
    onError: (error: any) => {
      notify.error('Error', error.response?.data?.error || 'Failed to initialize accounts');
    },
  });
};

export const useCloseFiscalPeriod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ periodId, retainedEarningsAccountId }: any) => {
      const response = await api.post(`/periods/${periodId}/close`, {
        retainedEarningsAccountId
      });
      return response.data;
    },
    onSuccess: () => {
      notify.success('Success', 'Fiscal period closed successfully');
      queryClient.invalidateQueries({ queryKey: ['fiscal-periods'] });
      queryClient.invalidateQueries({ queryKey: ['general-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['trial-balance'] });
    },
  });
};

export const useReopenFiscalPeriod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (periodId: number) => {
      const response = await api.post(`/periods/${periodId}/reopen`);
      return response.data;
    },
    onSuccess: () => {
      notify.success('Success', 'Fiscal period reopened successfully');
      queryClient.invalidateQueries({ queryKey: ['fiscal-periods'] });
      queryClient.invalidateQueries({ queryKey: ['general-ledger'] });
    },
  });
};

export const useExportReport = () => {
  return useMutation({
    mutationFn: async ({ reportType, reportData, format, metadata }: any) => {
      const response = await api.post('/reports/export', {
        reportType,
        reportData,
        format,
        metadata
      }, {
        responseType: 'blob'
      });
      return response;
    },
    onSuccess: (response, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${variables.metadata.title}.${variables.format.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      notify.success('Success', 'Report exported successfully');
    },
  });
};
