/**
 * Debug utility to inspect error structure
 * Use this temporarily to see what format your backend sends errors in
 */

export const debugError = (error: any, context: string = 'Error') => {
  console.group(`🔍 ${context} - Error Debug Info`);
  
  console.log('📦 Full Error Object:', error);
  
  if (error.response) {
    console.log('📡 Response Status:', error.response.status);
    console.log('📡 Response Data:', error.response.data);
    
    if (error.response.data) {
      console.log('  ├─ data.error:', error.response.data.error);
      console.log('  ├─ data.message:', error.response.data.message);
      console.log('  ├─ data.errors:', error.response.data.errors);
      console.log('  ├─ data.details:', error.response.data.details);
      console.log('  └─ data (full):', JSON.stringify(error.response.data, null, 2));
    }
  }
  
  console.log('💬 Error Message:', error.message);
  console.log('🔢 Error Code:', error.code);
  
  console.groupEnd();
};

/**
 * Enhanced extractErrorMessage with debug logging
 * Use this temporarily to see which path is being taken
 */
export const extractErrorMessageDebug = (error: any): string => {
  console.group('🔍 extractErrorMessage Debug');
  
  // Check for API error response (primary)
  if (error.response?.data?.error) {
    console.log('✅ Found: error.response.data.error');
    console.groupEnd();
    return error.response.data.error;
  }

  if (error.response?.data?.message) {
    console.log('✅ Found: error.response.data.message');
    console.groupEnd();
    return error.response.data.message;
  }

  // Check for validation errors (array format)
  if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    console.log('✅ Found: error.response.data.errors (array)');
    console.log('   Errors:', error.response.data.errors);
    console.groupEnd();
    return error.response.data.errors.map((e: any) => e.message || e.msg || e).join(', ');
  }

  // Check for validation errors (object format)
  if (error.response?.data?.errors && typeof error.response.data.errors === 'object') {
    console.log('✅ Found: error.response.data.errors (object)');
    console.log('   Errors:', error.response.data.errors);
    const errors = Object.values(error.response.data.errors);
    console.groupEnd();
    return errors.map((e: any) => e.message || e.msg || e).join(', ');
  }

  // Check for details field
  if (error.response?.data?.details) {
    console.log('✅ Found: error.response.data.details');
    console.log('   Details:', error.response.data.details);
    if (typeof error.response.data.details === 'string') {
      console.groupEnd();
      return error.response.data.details;
    }
    if (Array.isArray(error.response.data.details)) {
      console.groupEnd();
      return error.response.data.details.map((e: any) => e.message || e.msg || e).join(', ');
    }
  }

  // Check for network errors
  if (error.message === 'Network Error') {
    console.log('✅ Found: Network Error');
    console.groupEnd();
    return 'Network error. Please check your internet connection.';
  }

  // Check for timeout errors
  if (error.code === 'ECONNABORTED') {
    console.log('✅ Found: Timeout Error');
    console.groupEnd();
    return 'Request timeout. Please try again.';
  }

  // Check for HTTP status codes
  if (error.response?.status) {
    console.log(`✅ Found: HTTP ${error.response.status}`);
    console.groupEnd();
    
    switch (error.response.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Unauthorized. Please login again.';
      case 403:
        return 'Access denied.';
      case 404:
        return 'Resource not found.';
      case 409:
        return error.response?.data?.message || 'A conflict occurred.';
      case 500:
        return 'Server error. Please try again later.';
    }
  }

  // Default error message
  if (error.message) {
    console.log('✅ Found: error.message');
    console.groupEnd();
    return error.message;
  }

  console.log('❌ No specific error found, using default');
  console.groupEnd();
  return 'An unexpected error occurred';
};
