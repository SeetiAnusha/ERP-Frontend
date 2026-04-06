import { notify } from './notifications';

/**
 * Centralized error handling utilities
 * Standardizes error handling across the application
 */

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: any;
}

/**
 * Extract error message from various error formats
 */
export const extractErrorMessage = (error: any): string => {
  // Check for API error response
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Check for validation errors
  if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return error.response.data.errors.map((e: any) => e.message).join(', ');
  }

  // Check for network errors
  if (error.message === 'Network Error') {
    return 'Network error. Please check your internet connection.';
  }

  // Check for timeout errors
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }

  // Default error message
  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

/**
 * Extract error code from error object
 */
export const extractErrorCode = (error: any): string | undefined => {
  return error.response?.data?.code || error.code;
};

/**
 * Check if error is a specific type
 */
export const isErrorType = (error: any, errorCode: string): boolean => {
  return extractErrorCode(error) === errorCode;
};

/**
 * Handle API error with notification
 */
export const handleApiError = (
  error: any,
  context: string = 'Operation',
  customHandler?: (error: any) => boolean
): void => {
  console.error(`${context} error:`, error);

  // Allow custom error handling
  if (customHandler && customHandler(error)) {
    return;
  }

  const message = extractErrorMessage(error);
  notify.error(`${context} Failed`, message);
};

/**
 * Handle form validation errors
 */
export const handleValidationErrors = (
  errors: Array<{ field: string; message: string }>
): void => {
  if (errors.length === 0) return;

  if (errors.length === 1) {
    notify.error('Validation Error', errors[0].message);
  } else {
    const messages = errors.map(e => `• ${e.message}`).join('\n');
    notify.error('Validation Errors', messages);
  }
};

/**
 * Handle overpayment error specifically
 */
export const isOverpaymentError = (error: any): boolean => {
  return isErrorType(error, 'OVERPAYMENT_DETECTED');
};

/**
 * Handle insufficient balance error specifically
 */
export const isInsufficientBalanceError = (error: any): boolean => {
  const message = extractErrorMessage(error).toLowerCase();
  return message.includes('insufficient balance') || 
         message.includes('insufficient credit');
};

/**
 * Create error handler for async operations
 */
export const createErrorHandler = (context: string) => {
  return (error: any) => {
    handleApiError(error, context);
  };
};

/**
 * Wrap async function with error handling
 */
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  context: string,
  onError?: (error: any) => void
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    handleApiError(error, context);
    if (onError) {
      onError(error);
    }
    return null;
  }
};

/**
 * Format error for display
 */
export const formatErrorForDisplay = (error: any): {
  title: string;
  message: string;
  details?: string;
} => {
  const message = extractErrorMessage(error);
  const code = extractErrorCode(error);

  return {
    title: code ? `Error: ${code}` : 'Error',
    message,
    details: error.response?.data?.details
  };
};
