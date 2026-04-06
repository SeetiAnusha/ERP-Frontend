import React, { useMemo, useCallback } from 'react';
import { Plus, History } from 'lucide-react';
import { Product } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import PriceHistoryModal from '../components/PriceHistoryModal';
import { formatNumber } from '../utils/formatNumber';

// Reusable Components
import Modal from '../components/common/Modal';
import DataTable, { Column } from '../components/common/DataTable';
import SearchBar from '../components/common/SearchBar';
import ActionButton from '../components/common/ActionButton';
import FormField from '../components/common/FormField';

// Custom Hooks (simple, no Redux)
import { useEntityApi } from '../hooks/useApi';
import { useModal } from '../hooks/useModal';
import { useForm } from '../hooks/useForm';
import { useSearch } from '../hooks/useSearch';

// React Query hooks
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../hooks/queries/useProducts';
import { useFeatureFlag } from '../lib/featureFlags';

// Form validation
const validateProduct = (values: any) => {
  const errors: any = {};
  
  if (!values.code?.trim()) {
    errors.code = 'Product code is required';
  }
  
  if (!values.name?.trim()) {
    errors.name = 'Product name is required';
  }
  
  if (!values.unit?.trim()) {
    errors.unit = 'Unit of measurement is required';
  }
  
  return errors;
};

const Products = () => {
  const { t, language } = useLanguage();
  
  // Feature flag for React Query migration
  const useReactQuery = useFeatureFlag('react-query-products');
  
  // Simple search state (no Redux)
  const { searchTerm, setSearchTerm } = useSearch('products');
  
  // React Query hooks (new implementation)
  const reactQueryProducts = useProducts();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  
  // Legacy API hooks (old implementation)
  const legacyApi = useEntityApi<Product>('/products', 'Product');

  // Conditional data and functions based on feature flag
  const products = useReactQuery ? (reactQueryProducts.data || []) : legacyApi.items;
  const loading = useReactQuery ? reactQueryProducts.isLoading : legacyApi.loading;
  
  // Conditional functions based on feature flag
  const fetchProducts = useReactQuery ? 
    () => reactQueryProducts.refetch() : 
    legacyApi.fetchAll;
    
  const createProduct = useReactQuery ?
    (data: Partial<Product>) => createProductMutation.mutateAsync(data) :
    legacyApi.create;
    
  const updateProduct = useReactQuery ?
    (id: number | string, data: Partial<Product>) => updateProductMutation.mutateAsync({ id, data }) :
    legacyApi.update;
    
  const deleteProduct = useReactQuery ?
    (id: number | string) => {
      if (window.confirm(`Are you sure you want to delete this product?`)) {
        return deleteProductMutation.mutateAsync(id);
      }
      return Promise.resolve(null);
    } :
    legacyApi.remove;

  // Modal management
  const productModal = useModal<Product>();
  const priceHistoryModal = useModal<{ id: number; name: string }>();

  // Form management
  const productForm = useForm({
    initialValues: {
      code: '',
      name: '',
      description: '',
      unit: '',
      quantity: '',
      unitCost: '',
      salesPrice: '',
      taxRate: 18,
    },
    validate: validateProduct,
    onSubmit: async (values) => {
      const amount = Number(values.quantity) || 0;
      const unitPrice = Number(values.unitCost) || 0;
      const salesPrice = Number(values.salesPrice) || 0;
      const subtotal = amount * unitPrice;
      
      const productData = {
        code: values.code,
        name: values.name,
        description: values.description,
        unit: values.unit.trim(),
        amount: amount,
        unitCost: unitPrice,
        salesPrice: salesPrice,
        subtotal: subtotal,
        category: 'General',
        minimumStock: 10,
        taxRate: values.taxRate,
        status: 'ACTIVE'
      };

      if (productModal.data) {
        await updateProduct(productModal.data.id, productData);
      } else {
        await createProduct(productData);
      }
      
      productModal.close();
      productForm.reset();
    }
  });

  // Load products on mount (only for legacy API)
  React.useEffect(() => {
    if (!useReactQuery) {
      legacyApi.fetchAll();
    }
    // React Query automatically fetches on mount
  }, [useReactQuery, legacyApi.fetchAll]);

  // ✅ OPTIMIZED: Memoized modal handler to prevent unnecessary re-renders
  const handleOpenModal = useCallback((product?: Product) => {
    if (product) {
      productForm.setValues({
        code: product.code,
        name: product.name,
        description: product.description || '',
        unit: product.unit,
        quantity: String(product.amount),
        unitCost: String(product.unitCost),
        salesPrice: String(product.salesPrice || 0),
        taxRate: Number(product.taxRate) || 18,
      });
    } else {
      productForm.reset();
    }
    productModal.open(product);
  }, [productForm, productModal]);

  // ✅ OPTIMIZED: Memoized table columns to prevent recreation on every render
  const columns: Column<Product>[] = useMemo(() => [
    {
      key: 'code',
      label: t('productCode'),
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'name',
      label: t('productName'),
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'description',
      label: t('description'),
      render: (value) => <span className="text-gray-600">{value || '-'}</span>
    },
    {
      key: 'unit',
      label: t('unitOfMeasurement'),
      align: 'center'
    },
    {
      key: 'amount',
      label: t('amount'),
      align: 'right',
      render: (value) => formatNumber(Number(value))
    },
    {
      key: 'unitCost',
      label: t('unitPrice'),
      align: 'right',
      render: (value) => formatNumber(Number(value))
    },
    {
      key: 'salesPrice',
      label: t('salesPrice'),
      align: 'right',
      className: 'text-blue-600 font-semibold',
      render: (value) => formatNumber(Number(value || 0))
    },
    {
      key: 'id',
      label: t('salesPriceHistory'),
      align: 'center',
      render: (_, row) => (
        <ActionButton
          onClick={() => priceHistoryModal.open({ id: row.id, name: row.name })}
          icon={History}
          variant="secondary"
          size="sm"
          className="mx-auto"
        >
          {t('history')}
        </ActionButton>
      )
    }
  ], [t, priceHistoryModal]); // ✅ Only recreate when translation function or modal changes

  // Handle delete with proper signature
  const handleDeleteProduct = useCallback((product: Product) => {
    deleteProduct(product.id);
  }, [deleteProduct]);

  // ✅ OPTIMIZED: Memoized product filtering for better performance
  const filteredProducts = useMemo(() => {
    // Early return if no search term - avoid unnecessary filtering
    if (!searchTerm.trim()) {
      return products;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return products.filter((product: Product) => {
      // ✅ PERFORMANCE: Check most likely matches first (name, code)
      if (product.name?.toLowerCase().includes(lowerSearchTerm)) return true;
      if (product.code?.toLowerCase().includes(lowerSearchTerm)) return true;
      
      // ✅ PERFORMANCE: Check other string fields
      if (product.description?.toLowerCase().includes(lowerSearchTerm)) return true;
      if (product.unit?.toLowerCase().includes(lowerSearchTerm)) return true;
      if (product.category?.toLowerCase().includes(lowerSearchTerm)) return true;
      if (product.status?.toLowerCase().includes(lowerSearchTerm)) return true;
      
      // ✅ PERFORMANCE: Check numeric fields (convert to string only when needed)
      if (product.amount?.toString().includes(lowerSearchTerm)) return true;
      if (product.unitCost?.toString().includes(lowerSearchTerm)) return true;
      if (product.salesPrice?.toString().includes(lowerSearchTerm)) return true;
      if (product.taxRate?.toString().includes(lowerSearchTerm)) return true;
      
      return false;
    });
  }, [products, searchTerm]); // ✅ Only re-compute when products or searchTerm changes

  return (
    <div>
      {/* Header with Search and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t('search')}
        />
        
        <ActionButton
          onClick={() => handleOpenModal()}
          icon={Plus}
          className="ml-4"
        >
          {t('newProduct')}
        </ActionButton>
      </div>

      {/* Products Table */}
      <DataTable
        data={filteredProducts}
        columns={columns}
        onEdit={handleOpenModal}
        onDelete={handleDeleteProduct}
        loading={loading}
        emptyMessage="No products found"
      />

      {/* Product Form Modal */}
      <Modal
        isOpen={productModal.isOpen}
        onClose={() => {
          productModal.close();
          productForm.reset();
        }}
        title={productModal.data ? `${t('edit')} ${t('products')}` : t('newProduct')}
        size="lg"
        maxHeight="95vh"
      >
        <form onSubmit={productForm.handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-scroll px-6 py-4 space-y-4 max-h-[65vh] scrollbar-always">
            <FormField label={t('code')} required error={productForm.errors.code}>
              <input
                type="text"
                value={productForm.values.code}
                onChange={(e) => productForm.setValue('code', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="PROD001"
              />
            </FormField>

            <FormField label={t('name')} required error={productForm.errors.name}>
              <input
                type="text"
                value={productForm.values.name}
                onChange={(e) => productForm.setValue('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={t('productName')}
              />
            </FormField>

            <FormField label={t('description')}>
              <textarea
                value={productForm.values.description}
                onChange={(e) => productForm.setValue('description', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={`${t('description')} (${t('optional')})`}
                rows={3}
              />
            </FormField>

            <FormField label={t('unitOfMeasurement')} required error={productForm.errors.unit}>
              <input
                type="text"
                value={productForm.values.unit}
                onChange={(e) => productForm.setValue('unit', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="UNIT, KG, LB, etc."
              />
              <p className="text-xs text-gray-500 mt-1">Required. Can be updated when making a purchase</p>
            </FormField>

            <FormField label={`${t('amount')} (${t('optional')})`}>
              <input
                type="text"
                value={productForm.values.quantity}
                onChange={(e) => productForm.setValue('quantity', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0 or 1,000"
              />
              <p className="text-xs text-gray-500 mt-1">Stock will be updated from purchases. Format: 1,000.00</p>
            </FormField>

            <FormField label={`${t('unitPrice')} (${t('optional')})`}>
              <input
                type="text"
                value={productForm.values.unitCost}
                onChange={(e) => productForm.setValue('unitCost', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00 or 10.99"
              />
              <p className="text-xs text-gray-500 mt-1">Cost will be updated from purchases. Format: 1,000.00</p>
            </FormField>

            <FormField label={`${t('salesPrice')} (${t('optional')})`}>
              <input
                type="text"
                value={productForm.values.salesPrice}
                onChange={(e) => productForm.setValue('salesPrice', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00 or 38.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium text-blue-600">✓ {language === 'en' ? 'Can be updated at any time.' : 'Puede actualizarse en cualquier momento.'}</span> {language === 'en' ? 'Selling price for this product.' : 'Precio de venta para este producto.'}
              </p>
            </FormField>

            <FormField label={t('subtotal').toUpperCase()}>
              <input
                type="text"
                readOnly
                value={formatNumber((Number(productForm.values.quantity) || 0) * (Number(productForm.values.unitCost) || 0))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-semibold"
              />
              <p className="text-xs text-gray-500 mt-1">{t('amount')} × {t('unitPrice')}</p>
            </FormField>

            <FormField label={`${t('tax')} (${t('optional')})`}>
              <input
                type="text"
                value={productForm.values.taxRate}
                onChange={(e) => productForm.setValue('taxRate', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="18.00"
              />
              <p className="text-xs text-gray-500 mt-1">Tax amount (not %). Can be updated from purchases. Format: 10.99</p>
            </FormField>
          </div>

          <div className="flex gap-3 p-6 pt-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => {
                productModal.close();
                productForm.reset();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={productForm.isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {productForm.isSubmitting ? 'Saving...' : t('save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Price History Modal */}
      {priceHistoryModal.isOpen && priceHistoryModal.data && (
        <PriceHistoryModal
          productId={priceHistoryModal.data.id}
          productName={priceHistoryModal.data.name}
          onClose={() => priceHistoryModal.close()}
          onPriceUpdated={fetchProducts}
        />
      )}
    </div>
  );
};

export default Products;