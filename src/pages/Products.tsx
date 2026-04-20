import { useCallback } from 'react';
import { Plus, History, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Product } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import PriceHistoryModal from '../components/PriceHistoryModal';
import { formatNumber } from '../utils/formatNumber';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../lib/queryKeys';
import { extractErrorMessage } from '../utils/errorHandler';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/common/ConfirmDialog';

// Reusable Components
import Modal from '../components/common/Modal';
import SearchBar from '../components/common/SearchBar';
import ActionButton from '../components/common/ActionButton';
import FormField from '../components/common/FormField';
import { Pagination } from '../components/common/Pagination';

// Custom Hooks
import { useModal } from '../hooks/useModal';
import { useForm } from '../hooks/useForm';
import { useTableData } from '../hooks/useTableData';

// React Query hooks
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from '../hooks/queries/useProducts';

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
  const queryClient = useQueryClient();
  
  // ✅ Confirm Dialog Hook
  const { confirm, dialogProps } = useConfirm();
  
  // ✅ NEW: Pagination with useTableData
  const {
    data: products,
    pagination,
    loading,
    search,
    updateSearch,
    goToPage,
    changeLimit,
    refresh
  } = useTableData<Product>({
    endpoint: '/products',  // ✅ FIXED: Added leading slash
    initialLimit: 50
  });
  
  // React Query mutations
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

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

      try {
        if (productModal.data) {
          await updateProductMutation.mutateAsync({ id: productModal.data.id, data: productData });
          toast.success('Product updated successfully');
        } else {
          await createProductMutation.mutateAsync(productData);
          toast.success('Product created successfully');
        }
        
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
        refresh(); // ✅ Critical for pagination
        productModal.close();
        productForm.reset();
      } catch (error: any) {
        console.error('Error saving product:', error);
        toast.error(extractErrorMessage(error));
      }
    }
  });

  // Modal handler
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

  // Handle delete
  const handleDeleteProduct = useCallback(async (product: Product) => {
    const confirmed = await confirm({
      title: 'Delete Product',
      message: `Are you sure you want to delete ${product.name}?`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;

    try {
      await deleteProductMutation.mutateAsync(product.id);
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      refresh(); // ✅ Critical for pagination
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(extractErrorMessage(error));
    }
  }, [confirm, deleteProductMutation, queryClient, refresh]);

  return (
    <div>
      {/* Header with Search and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <SearchBar
          value={search}
          onChange={updateSearch}
          placeholder={t('search') + '...'}
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
      {loading ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-max table-auto">
              <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-20">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">{t('productCode').toUpperCase()}</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">{t('productName').toUpperCase()}</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">{t('description').toUpperCase()}</th>
                  <th className="px-4 py-4 text-center text-sm font-bold text-gray-800 whitespace-nowrap">{t('unitOfMeasurement').toUpperCase()}</th>
                  <th className="px-4 py-4 text-right text-sm font-bold text-gray-800 whitespace-nowrap">{t('amount').toUpperCase()}</th>
                  <th className="px-4 py-4 text-right text-sm font-bold text-gray-800 whitespace-nowrap">{t('unitPrice').toUpperCase()}</th>
                  <th className="px-4 py-4 text-right text-sm font-bold text-gray-800 whitespace-nowrap">{t('salesPrice').toUpperCase()}</th>
                  <th className="px-4 py-4 text-center text-sm font-bold text-gray-800 whitespace-nowrap">{t('salesPriceHistory').toUpperCase()}</th>
                  <th className="px-4 py-4 text-center text-sm font-bold text-gray-800 whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      {t('noProductsFound')}
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{product.code}</td>
                      <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.description || '-'}</td>
                      <td className="px-4 py-3 text-sm text-center">{product.unit}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatNumber(Number(product.amount))}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatNumber(Number(product.unitCost))}</td>
                      <td className="px-4 py-3 text-sm text-right text-blue-600 font-semibold">{formatNumber(Number(product.salesPrice || 0))}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <ActionButton
                          onClick={() => priceHistoryModal.open({ id: product.id, name: product.name })}
                          icon={History}
                          variant="secondary"
                          size="sm"
                        >
                          {t('history')}
                        </ActionButton>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleOpenModal(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ✅ NEW: Pagination Component */}
      <div className="mt-6">
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          from={pagination.from}
          to={pagination.to}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
          onPageChange={goToPage}
          onLimitChange={changeLimit}
        />
      </div>

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
          onPriceUpdated={refresh}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default Products;