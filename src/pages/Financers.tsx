import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Landmark } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useFinancers } from '../hooks/queries/useSharedData';
import { QUERY_KEYS } from '../lib/queryKeys';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { toast } from 'sonner';
import { extractErrorMessage } from '../utils/errorHandler';

interface Financer {
  id: number;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  rnc: string;
  type: 'BANK' | 'INVESTOR' | 'OTHER';
  status: 'ACTIVE' | 'INACTIVE';
}

const Financers = () => {
  const { t } = useLanguage();
  // ✅ React Query Hooks
  const { data: financers = [], isLoading, isError, refetch } = useFinancers();
  const queryClient = useQueryClient();
  const { confirm, dialogProps } = useConfirm();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFinancer, setEditingFinancer] = useState<Financer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    rnc: '',
    type: 'OTHER' as 'BANK' | 'INVESTOR' | 'OTHER',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  // ✅ Memoized: Close modal - DEFINED FIRST
  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingFinancer(null);
    setIsSubmitting(false);
  }, []);

  // ✅ Memoized: Open modal - DEFINED SECOND
  const openModal = useCallback((financer?: Financer) => {
    if (financer) {
      setEditingFinancer(financer);
      setFormData({
        name: financer.name,
        contactPerson: financer.contactPerson,
        phone: financer.phone,
        email: financer.email,
        address: financer.address,
        rnc: financer.rnc,
        type: financer.type,
        status: financer.status,
      });
    } else {
      setEditingFinancer(null);
      setFormData({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        rnc: '',
        type: 'OTHER',
        status: 'ACTIVE',
      });
    }
    setShowModal(true);
  }, []);

  // ✅ Memoized: Handle submit - NOW closeModal is available
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      if (editingFinancer) {
        await api.put(`/financers/${editingFinancer.id}`, formData);
        toast.success('Financer updated successfully');
      } else {
        await api.post('/financers', formData);
        toast.success('Financer created successfully');
      }
      // ✅ Invalidate cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.financers });
      refetch();
      closeModal();
    } catch (error: any) {
      console.error('Error saving financer:', error);
      toast.error(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, editingFinancer, formData, queryClient, refetch, closeModal]);

  // ✅ Memoized: Handle delete - NO MORE window.confirm!
  const handleDelete = useCallback(async (id: number) => {
    const confirmed = await confirm({
      title: 'Delete Financer',
      message: 'Are you sure you want to delete this financer? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (confirmed) {
      try {
        await api.delete(`/financers/${id}`);
        // ✅ Invalidate cache
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.financers });
        refetch();
        toast.success('Financer deleted successfully');
      } catch (error: any) {
        console.error('Error deleting financer:', error);
        toast.error(extractErrorMessage(error));
      }
    }
  }, [queryClient, refetch, confirm]);

  // ✅ Memoized: Filtered financers
  const filteredFinancers = useMemo(() => {
    return financers.filter((financer) =>
      Object.values(financer).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [financers, searchTerm]);

  // ✅ Error state
  if (isError) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">Error loading financers</p>
          <button
            onClick={() => refetch()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Landmark className="text-indigo-600" />
          {t('financers')}
        </h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal()}
          className="ml-4 bg-indigo-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus size={20} />
          {t('newFinancer')}
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('code').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('name').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('rnc').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('contactPerson').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('phone').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('financerType').toUpperCase()}</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">{t('status').toUpperCase()}</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">{t('actions').toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            {filteredFinancers.map((financer) => (
              <tr key={financer.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{financer.code}</td>
                <td className="px-6 py-4 text-sm">{financer.name}</td>
                <td className="px-6 py-4 text-sm">{financer.rnc || '-'}</td>
                <td className="px-6 py-4 text-sm">{financer.contactPerson || '-'}</td>
                <td className="px-6 py-4 text-sm">{financer.phone || '-'}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    financer.type === 'BANK' ? 'bg-blue-100 text-blue-800' :
                    financer.type === 'INVESTOR' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {financer.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    financer.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {financer.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => openModal(financer)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(financer.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingFinancer ? t('editFinancer') : t('newFinancer')}
                </h2>
                <button onClick={closeModal}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">{t('name')} *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">{t('rnc')}</label>
                    <input
                      type="text"
                      value={formData.rnc}
                      onChange={(e) => setFormData({ ...formData, rnc: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">{t('financerType')} *</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'BANK' | 'INVESTOR' | 'OTHER' })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="BANK">{t('bank')}</option>
                      <option value="INVESTOR">{t('investor')}</option>
                      <option value="OTHER">{t('other')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">{t('contactPerson')}</label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">{t('phone')}</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">{t('email')}</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">{t('address')}</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">{t('status')} *</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ACTIVE">{t('active')}</option>
                      <option value="INACTIVE">{t('inactive')}</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {editingFinancer ? 'Updating...' : 'Creating...'}
                      </div>
                    ) : (
                      editingFinancer ? t('update') : t('create')
                    )}
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

export default Financers;
