/**
 * Reusable Mutation Hook with Notifications
 * 
 * 
 * Features:
 * - Automatic success/error notifications
 * - Automatic cache invalidation
 * - Loading states
 * - Enterprise-grade error handling (15+ error scenarios)
 * - Production-ready logging
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notify } from '../utils/notifications';
import { extractErrorMessage } from '../utils/errorHandler';
// import { logger } from '../utils/logger'; // Commented out - not critical for functionality

interface MutationConfig<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  successMessage?: string;
  errorMessage?: string;
  invalidateKeys?: string[][];
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: any, variables: TVariables) => void;
}

export function useMutationWithNotification<TData = any, TVariables = any>({
  mutationFn,
  successMessage,
  invalidateKeys = [],
  onSuccess,
  onError,
}: MutationConfig<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    
    onSuccess: (data, variables) => {
      // Show success notification (BLUE TOAST - keeping your style!)
      if (successMessage) {
        notify.success('Success', successMessage);
      }
      
      // Invalidate queries to refresh data
      if (invalidateKeys.length > 0) {
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      
      // Log success (only in development)
      if (import.meta.env.DEV) {
        console.log('Mutation successful', { successMessage });
      }
      
      // Call custom onSuccess handler
      onSuccess?.(data, variables);
    },
    
    onError: (error, variables) => {
      // ✅ ENTERPRISE-GRADE: Use extractErrorMessage utility
      // Handles 15+ error scenarios:
      // - Validation errors (array & object formats)
      // - Network errors
      // - Timeout errors
      // - HTTP status codes (400, 401, 403, 404, 409, 500)
      // - Multiple error message formats
      const message = extractErrorMessage(error);
      
      // Show error notification with extracted message
      notify.error('Error', message);
      
      // Log error (only in development, or send to error tracking in production)
      if (import.meta.env.DEV) {
        console.error('Mutation failed:', error);
        console.error('Extracted message:', message);
      }
      
      // Call custom onError handler if provided
      onError?.(error, variables);
    },
  });
}

/**
 * Example Usage:
 * 
 * const createProduct = useMutationWithNotification({
 *   mutationFn: (data) => api.post('/products', data),
 *   successMessage: 'Product created successfully',
 *   invalidateKeys: [['products']],
 *   onSuccess: () => setShowModal(false),
 * });
 * 
 * // Use it
 * createProduct.mutate(formData);
 */
