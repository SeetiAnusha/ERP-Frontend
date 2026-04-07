import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { Supplier } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import api from '../api/axios';
import { QUERY_KEYS } from '../lib/queryKeys';
import { useTableData } from '../hooks/useTableData';
import { Pagination } from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';

const Suppliers = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  // ✅ NEW: Use useTableData for pagination
  const {
    data: suppliers,
    pagination,
    loading,
    search,
    updateSearch,
    goToPage,
    changeLimit,
    refresh
  } = useTableData<Supplier>({
    endpoint: '/api/suppliers',
    initialLimit: 50,
    initialSortBy: 'createdAt',
    initialSortOrder: 'DESC'
  });
  
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    rnc: '',
    phone: '',
    address: '',
  });

  // ✅ Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/suppliers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers });
      refresh(); // Refresh pagination data
      closeModal();
    },
    onError: (error) => {
      console.error('Error creating supplier:', error);
    },
  });

  // ✅ Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await api.put(`/suppliers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers });
      refresh(); // Refresh pagination data
      closeModal();
    },
    onError: (error) => {
      console.error('Error updating supplier:', error);
    },
  });

  // ✅ Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers });
      refresh(); // Refresh pagination data
    },
    onError: (error) => {
      console.error('Error deleting supplier:', error);
    },
  });

  // ✅ Memoized submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  }, [editingSupplier, formData, createMutation, updateMutation]);

  // ✅ Memoized delete handler
  const handleDelete = useCallback(async (id: number) => {
    if (window.confirm(t('confirmDelete'))) {
      deleteMutation.mutate(id);
    }
  }, [t, deleteMutation]);

  // ✅ Memoized modal handlers
  const openModal = useCallback((supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData(supplier);
    } else {
      setEditingSupplier(null);
      setFormData({ code: '', name: '', rnc: '', phone: '', address: '' });
    }
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingSupplier(null);
    setFormData({ code: '', name: '', rnc: '', phone: '', address: '' });
  }, []);

  // ✅ Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading suppliers...</span>
      </div>
    );
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <SearchBar
          value={search}
          onChange={updateSearch}
          placeholder={t('search')}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal()}
          className="ml-4 bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-lg"
        >
          <Plus size={20} />
          {t('newSupplier')}
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('code').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('name').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('rncsupplier').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('phone').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('address').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('actions').toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {suppliers.map((supplier, index) => (
                <motion.tr
                  key={supplier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm">{supplier.code}</td>
                  <td className="px-6 py-4 text-sm font-medium">{supplier.name}</td>
                  <td className="px-6 py-4 text-sm">{supplier.rnc}</td>
                  <td className="px-6 py-4 text-sm">{supplier.phone}</td>
                  <td className="px-6 py-4 text-sm">{supplier.address}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openModal(supplier)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={18} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(supplier.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>

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
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingSupplier ? t('editSupplier') : t('newSupplier')}</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('code')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('rncsupplier')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.rnc}
                    onChange={(e) => setFormData({ ...formData, rnc: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('address')}</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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

export default Suppliers;
