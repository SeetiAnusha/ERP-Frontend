import { useState, useCallback } from 'react';
import api from '../api/axios';
import { handleApiError, notify } from '../utils/notifications';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorContext?: string;
}

// Simple in-memory cache for products (no Redux needed)
let productsCache: any[] = [];
let productsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useApi<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (
    apiCall: () => Promise<any>,
    options: UseApiOptions = {}
  ): Promise<T | null> => {
    const {
      onSuccess,
      onError,
      successMessage,
      errorContext = 'API operation'
    } = options;

    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      const data = response.data;
      
      if (successMessage) {
        notify.success('Success', successMessage);
      }
      
      if (onSuccess) {
        onSuccess(data);
      }
      
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      } else {
        handleApiError(err, errorContext);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Common CRUD operations
  const get = useCallback((url: string, options?: UseApiOptions) => {
    return execute(() => api.get(url), options);
  }, [execute]);

  const post = useCallback((url: string, data: any, options?: UseApiOptions) => {
    return execute(() => api.post(url, data), options);
  }, [execute]);

  const put = useCallback((url: string, data: any, options?: UseApiOptions) => {
    return execute(() => api.put(url, data), options);
  }, [execute]);

  const del = useCallback((url: string, options?: UseApiOptions) => {
    return execute(() => api.delete(url), options);
  }, [execute]);

  return {
    loading,
    error,
    execute,
    get,
    post,
    put,
    delete: del
  };
}

// Enhanced Entity API hook with simple caching (no Redux)
export function useEntityApi<T extends { id: number | string }>(
  endpoint: string,
  entityName: string
) {
  const { loading, error, get, post, put, delete: del } = useApi<T>();
  const [items, setItems] = useState<T[]>([]);

  // Simple caching for products
  const fetchAll = useCallback(async () => {
    // Use cache for products if still fresh
    if (endpoint === '/products') {
      const now = Date.now();
      if (productsCache.length > 0 && (now - productsCacheTime) < CACHE_DURATION) {
        setItems(productsCache);
        return productsCache;
      }
    }

    const data = await get(endpoint, {
      errorContext: `Loading ${entityName.toLowerCase()}s`
    });
    
    if (data) {
      const itemsArray = Array.isArray(data) ? data : [];
      setItems(itemsArray);
      
      // Cache products
      if (endpoint === '/products') {
        productsCache = itemsArray;
        productsCacheTime = Date.now();
      }
    }
    return data;
  }, [get, endpoint, entityName]);

  const create = useCallback(async (data: Partial<T>) => {
    const result = await post(endpoint, data, {
      successMessage: `${entityName} created successfully`,
      errorContext: `Creating ${entityName.toLowerCase()}`,
      onSuccess: () => {
        // Clear cache for products
        if (endpoint === '/products') {
          productsCache = [];
          productsCacheTime = 0;
        }
        fetchAll();
      }
    });
    return result;
  }, [post, endpoint, entityName, fetchAll]);

  const update = useCallback(async (id: number | string, data: Partial<T>) => {
    const result = await put(`${endpoint}/${id}`, data, {
      successMessage: `${entityName} updated successfully`,
      errorContext: `Updating ${entityName.toLowerCase()}`,
      onSuccess: () => {
        // Clear cache for products
        if (endpoint === '/products') {
          productsCache = [];
          productsCacheTime = 0;
        }
        fetchAll();
      }
    });
    return result;
  }, [put, endpoint, entityName, fetchAll]);

  const remove = useCallback(async (id: number | string) => {
    if (window.confirm(`Are you sure you want to delete this ${entityName.toLowerCase()}?`)) {
      const result = await del(`${endpoint}/${id}`, {
        successMessage: `${entityName} deleted successfully`,
        errorContext: `Deleting ${entityName.toLowerCase()}`,
        onSuccess: () => {
          // Clear cache for products
          if (endpoint === '/products') {
            productsCache = [];
            productsCacheTime = 0;
          }
          fetchAll();
        }
      });
      return result;
    }
    return null;
  }, [del, endpoint, entityName, fetchAll]);

  return {
    items,
    loading,
    error,
    fetchAll,
    create,
    update,
    remove,
    setItems
  };
}