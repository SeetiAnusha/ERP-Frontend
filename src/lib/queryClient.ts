import { QueryClient } from '@tanstack/react-query';

// Error classification for retry logic
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

export const classifyError = (error: any): ErrorType => {
  if (!error.response) return ErrorType.NETWORK_ERROR;
  
  const status = error.response.status;
  if (status === 401 || status === 403) return ErrorType.AUTHENTICATION_ERROR;
  if (status === 404) return ErrorType.NOT_FOUND_ERROR;
  if (status >= 400 && status < 500) return ErrorType.VALIDATION_ERROR;
  if (status >= 500) return ErrorType.SERVER_ERROR;
  
  return ErrorType.NETWORK_ERROR;
};

// Global error handler
const handleApiError = (error: any, context: string) => {
  const errorType = classifyError(error);
  console.error(`${context}:`, errorType, error);
  
  // You can integrate with your existing notification system here
  // For now, we'll just log the error
};

// Retry configuration
const retryConfig = {
  attempts: 3,
  delay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  
  shouldRetry: (error: any, attemptIndex: number) => {
    const errorType = classifyError(error);
    
    // Don't retry authentication, validation, or not found errors
    if (errorType === ErrorType.AUTHENTICATION_ERROR || 
        errorType === ErrorType.VALIDATION_ERROR ||
        errorType === ErrorType.NOT_FOUND_ERROR) {
      return false;
    }
    
    // Retry network and server errors up to max attempts
    return attemptIndex < retryConfig.attempts;
  },
};

// Create and configure the query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache configuration
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - cache time (formerly cacheTime)
      
      // Retry configuration
      retry: (failureCount, error) => {
        return retryConfig.shouldRetry(error, failureCount);
      },
      retryDelay: retryConfig.delay,
      
      // Refetch configuration
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true,    // Refetch when reconnecting to internet
      refetchOnMount: true,        // Refetch when component mounts
      
      // Error handling
      throwOnError: false, // Don't throw errors, handle them in components
    },
    mutations: {
      retry: 1, // Retry mutations once
      onError: (error) => {
        handleApiError(error, 'Mutation failed');
      },
    },
  },
});

// Cache strategies for different data types
export const CACHE_STRATEGIES = {
  // Master data (products, clients, etc.) - changes infrequently
  MASTER_DATA: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,    // 60 minutes
  },
  
  // Transaction data (sales, purchases, etc.) - changes frequently
  TRANSACTION_DATA: {
    staleTime: 2 * 60 * 1000,  // 2 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
  },
  
  // Real-time data (recent activity, etc.) - changes very frequently
  REAL_TIME_DATA: {
    staleTime: 1 * 60 * 1000,  // 1 minute
    gcTime: 5 * 60 * 1000,     // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  },
  
  // Financial data (accounts payable/receivable) - critical accuracy
  FINANCIAL_DATA: {
    staleTime: 30 * 1000,      // 30 seconds (reduced from 2 minutes for immediate updates)
    gcTime: 15 * 60 * 1000,    // 15 minutes
  },
};