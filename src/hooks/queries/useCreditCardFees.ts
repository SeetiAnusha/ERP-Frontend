import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { notify } from '../../utils/notifications';

// Query keys
const QUERY_KEYS = {
  creditCardFees: ['credit-card-fees'],
  creditCardFee: (id: number) => ['credit-card-fee', id],
  feeStatistics: ['credit-card-fee-statistics'],
};

// Get all credit card fees
export const useCreditCardFees = (filters?: {
  startDate?: string;
  endDate?: string;
  customerId?: number;
  cardType?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.creditCardFees, filters],
    queryFn: async () => {
      const response = await api.get('/credit-card-fees', { params: filters });
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    },
    staleTime: 30000, // 30 seconds
  });
};

// Get single credit card fee
export const useCreditCardFee = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.creditCardFee(id),
    queryFn: async () => {
      const response = await api.get(`/credit-card-fees/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Get fee statistics
export const useFeeStatistics = (filters?: {
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.feeStatistics, filters],
    queryFn: async () => {
      const response = await api.get('/credit-card-fees/statistics', { params: filters });
      return response.data;
    },
    staleTime: 60000, // 1 minute
  });
};

// Record new credit card fee
export const useRecordFee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (feeData: any) => {
      const response = await api.post('/credit-card-fees', feeData);
      return response.data;
    },
    onSuccess: () => {
      notify.success('Success', 'Credit card fee recorded successfully');
      // ✅ PERFORMANCE FIX: Parallel cache invalidation
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.creditCardFees }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.feeStatistics }),
      ]);
    },
    onError: (error: any) => {
      notify.error('Error', error.response?.data?.error || 'Failed to record fee');
    },
  });
};

// Update fee status
export const useUpdateFeeStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const response = await api.patch(`/credit-card-fees/${id}/status`, { status, notes });
      return response.data;
    },
    onSuccess: () => {
      notify.success('Success', 'Fee status updated successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.creditCardFees });
    },
    onError: (error: any) => {
      notify.error('Error', error.response?.data?.error || 'Failed to update status');
    },
  });
};

// Delete credit card fee
export const useDeleteFee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/credit-card-fees/${id}`);
      return response.data;
    },
    onSuccess: () => {
      notify.success('Success', 'Credit card fee deleted successfully');
      // ✅ PERFORMANCE FIX: Parallel cache invalidation
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.creditCardFees }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.feeStatistics }),
      ]);
    },
    onError: (error: any) => {
      notify.error('Error', error.response?.data?.error || 'Failed to delete fee');
    },
  });
};
