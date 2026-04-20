import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, DollarSign } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../api/axios';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber } from '../utils/formatNumber';
import { extractErrorMessage } from '../utils/errorHandler';
import { useCashRegisters } from '../hooks/queries/useSharedData';
import { QUERY_KEYS } from '../lib/queryKeys';

interface CashRegisterMaster {
  id: number;
  code: string;
  name: string;
  location: string;
  balance: number;
  status: 'ACTIVE' | 'INACTIVE';
}

const CashRegisterMasters = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  // ✅ REACT QUERY: Use shared data hook instead of local state
  const { data: registers = [], isLoading, isError } = useCashRegisters();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRegister, setEditingRegister] = useState<CashRegisterMaster | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  // ✅ MEMOIZED: Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      if (editingRegister) {
        await api.put(`/cash-register-masters/${editingRegister.id}`, formData);
        toast.success('Cash register updated successfully');
      } else {
        await api.post('/cash-register-masters', formData);
        toast.success('Cash register created successfully');
      }
      
      // ✅ REACT QUERY: Cache invalidation for automatic UI updates
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashRegisters });
      
      closeModal();
    } catch (error: any) {
      console.error('Error saving cash register:', error);
      toast.error(extractErrorMessage(error)); // ✅ Use extractErrorMessage
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, editingRegister, formData, queryClient]);

  // ✅ MEMOIZED: Handle delete
  const handleDelete = useCallback(async (id: number) => {
    if (window.confirm('Are you sure you want to delete this cash register?')) {
      try {
        await api.delete(`/cash-register-masters/${id}`);
        toast.success('Cash register deleted successfully');
        
        // ✅ REACT QUERY: Cache invalidation for automatic UI updates
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashRegisters });
      } catch (error: any) {
        console.error('Error deleting cash register:', error);
        toast.error(extractErrorMessage(error)); // ✅ Use extractErrorMessage
      }
    }
  }, [queryClient]);

  // ✅ MEMOIZED: Open modal
  const openModal = useCallback((register?: CashRegisterMaster) => {
    if (register) {
      setEditingRegister(register);
      setFormData({
        name: register.name,
        location: register.location,
        status: register.status,
      });
    } else {
      setEditingRegister(null);
      setFormData({
        name: '',
        location: '',
        status: 'ACTIVE',
      });
    }
    setShowModal(true);
  }, []);

  // ✅ MEMOIZED: Close modal
  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingRegister(null);
    setIsSubmitting(false);
  }, []);

  // ✅ MEMOIZED: Filtered registers
  const filteredRegisters = useMemo(() => {
    return registers.filter((register) =>
      Object.values(register).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [registers, searchTerm]);

  // ✅ OPTIMIZED: Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading cash registers...</span>
      </div>
    );
  }

  // ✅ ERROR STATE
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">Error loading cash registers</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="text-green-600" />
          {t('cashRegisters')}
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal()}
          className="ml-4 bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
        >
          <Plus size={20} />
          {t('newCashRegister')}
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
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('location').toUpperCase()}</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">{t('balance').toUpperCase()}</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">{t('status').toUpperCase()}</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">{t('actions').toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegisters.map((register) => (
              <tr key={register.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{register.code}</td>
                <td className="px-6 py-4 text-sm">{register.name}</td>
                <td className="px-6 py-4 text-sm">{register.location}</td>
                <td className="px-6 py-4 text-sm text-right font-semibold">{formatNumber(register.balance)}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    register.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {register.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => openModal(register)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(register.id)}
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
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingRegister ? t('editCashRegister') : t('newCashRegister')}
                </h2>
                <button onClick={closeModal}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('name')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Main Register, Store 1, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('location')}</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Front desk, Store 2, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('status')} *</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="ACTIVE">{t('active')}</option>
                    <option value="INACTIVE">{t('inactive')}</option>
                  </select>
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
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {editingRegister ? 'Updating...' : 'Creating...'}
                      </div>
                    ) : (
                      editingRegister ? t('update') : t('create')
                    )}
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

export default CashRegisterMasters;
