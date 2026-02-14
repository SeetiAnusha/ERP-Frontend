import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
import api from '../api/axios';
import { Product } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const Products = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    unit: '',
    quantity: '',
    unitCost: '',
    taxRate: 18,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    
    try {
      const amount = Number(formData.quantity) || 0;
      const unitPrice = Number(formData.unitCost) || 0;
      const subtotal = amount * unitPrice;
      
      const productData = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        unit: formData.unit,
        amount: amount,
        unitCost: unitPrice,
        subtotal: subtotal,
        category: 'General',
        minimumStock: 10,
        taxRate: formData.taxRate,
        status: 'ACTIVE'
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productData);
        alert('Product updated successfully!');
      } else {
        await api.post('/products', productData);
        alert('Product created successfully!');
      }
      fetchProducts();
      closeModal();
    } catch (error: any) {
      console.error('Error saving product:', error);
      alert('Error saving product: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        alert('Product deleted successfully!');
        fetchProducts();
      } catch (error: any) {
        console.error('Error deleting product:', error);
        alert('Error deleting product: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        code: product.code,
        name: product.name,
        description: product.description || '',
        unit: product.unit,
        quantity: String(product.amount),
        unitCost: String(product.unitCost),
        taxRate: Number(product.taxRate) || 18,
      });
    } else {
      setEditingProduct(null);
      setFormData({ code: '', name: '', description: '', unit: '', quantity: '', unitCost: '', taxRate: 18 });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({ code: '', name: '', description: '', unit: '', quantity: '', unitCost: '', taxRate: 18 });
  };

  const filteredProducts = products.filter((product) =>
    Object.values(product).some((value) =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal()}
          className="ml-4 bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-lg"
        >
          <Plus size={20} />
          {t('newProduct')}
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg overflow-x-auto"
      >
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('productCode').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('productName').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('description').toUpperCase()}</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">{t('unitOfMeasurement').toUpperCase()}</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">{t('amount').toUpperCase()}</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">{t('unitPrice').toUpperCase()}</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">{t('subtotal').toUpperCase()}</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">{t('tax').toUpperCase()}</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">{t('total').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('actions').toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredProducts.map((product, index) => {
                // Display stored database values directly
                const amount = Number(product.amount);           // Amount from DB
                const unitPrice = Number(product.unitCost);       // Unit Price from DB
                const storedSubtotal = Number(product.subtotal);  // SUBTOTAL from DB
                const taxRate = Number(product.taxRate);
                const tax = taxRate;
                const total = storedSubtotal + tax;
                
                return (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium">{product.code}</td>
                  <td className="px-6 py-4 text-sm font-medium">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{product.description || '-'}</td>
                  <td className="px-6 py-4 text-sm text-center">{product.unit}</td>
                  <td className="px-6 py-4 text-sm text-right">{amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-right">{unitPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-right">{storedSubtotal.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-right">{tax.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-right text-green-600">{total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openModal(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={18} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold">{editingProduct ? t('edit') + ' ' + t('products') : t('newProduct')}</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('code')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="PROD001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={t('productName')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={t('description') + ' (' + t('optional') + ')'}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('unitOfMeasurement')} <span className="text-gray-400 text-xs">({t('optional')})</span>
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="UNIT, KG, LB, etc."
                  />
                  <p className="text-xs text-gray-500 mt-1">Can be updated when making a purchase</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('amount')} <span className="text-gray-400 text-xs">({t('optional')})</span>
                  </label>
                  <input
                    type="text"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0 or 1,000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Stock will be updated from purchases. Format: 1,000.00</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('unitPrice')} <span className="text-gray-400 text-xs">({t('optional')})</span>
                  </label>
                  <input
                    type="text"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00 or 10.99"
                  />
                  <p className="text-xs text-gray-500 mt-1">Cost will be updated from purchases. Format: 1,000.00</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('subtotal').toUpperCase()}</label>
                  <input
                    type="text"
                    readOnly
                    value={((Number(formData.quantity) || 0) * (Number(formData.unitCost) || 0)).toFixed(2)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-semibold"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('amount')} × {t('unitPrice')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('tax')} <span className="text-gray-400 text-xs">({t('optional')})</span>
                  </label>
                  <input
                    type="text"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="18.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tax amount (not %). Can be updated from purchases. Format: 10.99</p>
                </div>
                </div>
                <div className="flex gap-3 p-6 pt-4 border-t border-gray-200 bg-gray-50">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : t('save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
