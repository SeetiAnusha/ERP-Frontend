import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../api/axios';
import { Client } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { QUERY_KEYS } from '../lib/queryKeys';
import { useTableData } from '../hooks/useTableData';
import { Pagination } from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useMutationWithNotification } from '../hooks/useMutationWithNotification';

const Clients = () => {
  const { t } = useLanguage();
  const { confirm, dialogProps } = useConfirm();
  
  // ✅ NEW: Use useTableData for pagination
  const {
    data: clients,
    pagination,
    loading,
    search,
    updateSearch,
    goToPage,
    changeLimit,
    refresh
  } = useTableData<Client>({
    endpoint: 'clients',  // ✅ FIXED: No leading slash (baseURL already has /api)
    initialLimit: 50,
    initialSortBy: 'createdAt',
    initialSortOrder: 'DESC'
  });
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    rncCedula: '',
    phone: '',
    address: '',
  });

  // ✅ MEMOIZED: Close modal - DEFINED FIRST
  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({ code: '', name: '', rncCedula: '', phone: '', address: '' });
  }, []);

  // ✅ MEMOIZED: Open modal - DEFINED SECOND
  const openModal = useCallback((client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData(client);
    } else {
      setEditingClient(null);
      setFormData({ code: '', name: '', rncCedula: '', phone: '', address: '' });
    }
    setShowModal(true);
  }, []);

  // ✅ OPTIMIZED: Create/Update mutations with reusable hook
  const createClientMutation = useMutationWithNotification({
    mutationFn: (data: typeof formData) => api.post('/clients', data),
    successMessage: 'Client created successfully',
    invalidateKeys: [[...QUERY_KEYS.clients]],
    onSuccess: () => {
      refresh();
      closeModal();
    },
  });

  const updateClientMutation = useMutationWithNotification({
    mutationFn: ({ id, data }: { id: number; data: typeof formData }) => api.put(`/clients/${id}`, data),
    successMessage: 'Client updated successfully',
    invalidateKeys: [[...QUERY_KEYS.clients]],
    onSuccess: () => {
      refresh();
      closeModal();
    },
  });

  const deleteClientMutation = useMutationWithNotification({
    mutationFn: (id: number) => api.delete(`/clients/${id}`),
    successMessage: 'Client deleted successfully',
    invalidateKeys: [[...QUERY_KEYS.clients]],
    onSuccess: () => refresh(),
  });

  // ✅ MEMOIZED: Handle form submission - NOW closeModal is available
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    
    try {
      if (editingClient) {
        await updateClientMutation.mutateAsync({ id: editingClient.id, data: formData });
      } else {
        await createClientMutation.mutateAsync(formData);
      }
    } catch (error) {
      // Error handled by mutation hook
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, editingClient, formData, createClientMutation, updateClientMutation]);

  // ✅ MEMOIZED: Handle delete - NO MORE window.confirm!
  const handleDelete = useCallback(async (id: number) => {
    const confirmed = await confirm({
      title: t('confirmDelete') || 'Delete Client',
      message: 'Are you sure you want to delete this client? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (confirmed) {
      await deleteClientMutation.mutateAsync(id);
    }
  }, [t, confirm, deleteClientMutation]);

  // ✅ OPTIMIZED: Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading clients...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <SearchBar
          value={search}
          onChange={updateSearch}
          placeholder={t('search')}
        />
        <div className="flex gap-3 ml-4">
           {/* <ExcelUpload type="clients" onSuccess={refresh} /> */}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-lg"
          >
            <Plus size={20} />
            {t('newClient')}
          </motion.button>
        </div>
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
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('idTaxNumber').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('phone').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('address').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('actions').toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {clients.map((client, index) => (
                <motion.tr
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm">{client.code}</td>
                  <td className="px-6 py-4 text-sm font-medium">{client.name}</td>
                  <td className="px-6 py-4 text-sm">{client.rncCedula}</td>
                  <td className="px-6 py-4 text-sm">{client.phone}</td>
                  <td className="px-6 py-4 text-sm">{client.address}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openModal(client)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={18} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(client.id)}
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
                <h2 className="text-2xl font-bold">{editingClient ? t('editClient') : t('newClient')}</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('idTaxNumber')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.rncCedula}
                    onChange={(e) => setFormData({ ...formData, rncCedula: e.target.value })}
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

      {/* ✅ Confirm Dialog - Replaces window.confirm */}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default Clients;
