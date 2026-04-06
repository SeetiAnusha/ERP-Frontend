import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { CACHE_STRATEGIES } from '../../lib/queryClient';
import { Product } from '../../types';
import { notify } from '../../utils/notifications';

// Product query hook
export const useProducts = () => {
  return useQuery({
    queryKey: QUERY_KEYS.products,
    queryFn: async (): Promise<Product[]> => {
      const response = await api.get('/products');
      return Array.isArray(response.data) ? response.data : [];
    },
    ...CACHE_STRATEGIES.MASTER_DATA, // 30 min stale time, 60 min cache time
    throwOnError: false,
  });
};

// Individual product query hook
export const useProduct = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.product(id),
    queryFn: async (): Promise<Product> => {
      const response = await api.get(`/products/${id}`);
      return response.data;
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    enabled: !!id, // Only run if id exists
    throwOnError: false,
  });
};

// Create product mutation
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productData: Partial<Product>): Promise<Product> => {
      const response = await api.post('/products', productData);
      return response.data;
    },
    onMutate: async (newProduct) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.products });
      
      // Snapshot previous value
      const previousProducts = queryClient.getQueryData<Product[]>(QUERY_KEYS.products);
      
      // Optimistically update
      if (previousProducts) {
        queryClient.setQueryData<Product[]>(QUERY_KEYS.products, (old = []) => [
          ...old,
          { ...newProduct, id: Date.now() } as Product // Temporary ID
        ]);
      }
      
      return { previousProducts };
    },
    onError: (err, newProduct, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(QUERY_KEYS.products, context.previousProducts);
      }
    },
    onSuccess: () => {
      notify.success('Success', 'Product created successfully');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
    },
  });
};

// Update product mutation
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: Partial<Product> }): Promise<Product> => {
      const response = await api.put(`/products/${id}`, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.products });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.product(Number(id)) });
      
      // Snapshot previous values
      const previousProducts = queryClient.getQueryData<Product[]>(QUERY_KEYS.products);
      const previousProduct = queryClient.getQueryData<Product>(QUERY_KEYS.product(Number(id)));
      
      // Optimistically update products list
      if (previousProducts) {
        queryClient.setQueryData<Product[]>(QUERY_KEYS.products, (old = []) =>
          old.map(product => 
            product.id === id ? { ...product, ...data } : product
          )
        );
      }
      
      // Optimistically update individual product
      if (previousProduct) {
        queryClient.setQueryData(QUERY_KEYS.product(Number(id)), {
          ...previousProduct,
          ...data
        });
      }
      
      return { previousProducts, previousProduct };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(QUERY_KEYS.products, context.previousProducts);
      }
      if (context?.previousProduct) {
        queryClient.setQueryData(QUERY_KEYS.product(Number(id)), context.previousProduct);
      }
    },
    onSuccess: () => {
      notify.success('Success', 'Product updated successfully');
    },
    onSettled: (data, error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.product(Number(id)) });
    },
  });
};

// Delete product mutation
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number | string): Promise<void> => {
      await api.delete(`/products/${id}`);
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.products });
      
      // Snapshot previous value
      const previousProducts = queryClient.getQueryData<Product[]>(QUERY_KEYS.products);
      
      // Optimistically update
      if (previousProducts) {
        queryClient.setQueryData<Product[]>(QUERY_KEYS.products, (old = []) =>
          old.filter(product => product.id !== id)
        );
      }
      
      return { previousProducts };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(QUERY_KEYS.products, context.previousProducts);
      }
    },
    onSuccess: () => {
      notify.success('Success', 'Product deleted successfully');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
    },
  });
};