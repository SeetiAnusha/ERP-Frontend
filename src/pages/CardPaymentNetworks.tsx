import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, CreditCard, X, Building2, Calendar, DollarSign } from 'lucide-react';
import api from '../api/axios';
import { notify } from '../utils/notifications';

interface CardPaymentNetwork {
  id: number;
  name: string;
  type: 'DEBIT' | 'CREDIT';
  processingFee: number;
  settlementDays: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const CardPaymentNetworks = () => {
  const [networks, setNetworks] = useState<CardPaymentNetwork[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<CardPaymentNetwork | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'DEBIT' as 'DEBIT' | 'CREDIT',
    processingFee: 0.025,
    settlementDays: 1,
    description: '',
  });

  useEffect(() => {
    fetchNetworks();
  }, []);

  const fetchNetworks = async () => {
    try {
      const response = await api.get('/card-payment-networks');
      setNetworks(response.data);
    } catch (error) {
      console.error('Error fetching payment networks:', error);
      notify.error('Failed to load payment networks');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingNetwork) {
        await api.put(`/card-payment-networks/${editingNetwork.id}`, formData);
        notify.success('Payment network updated successfully');
      } else {
        await api.post('/card-payment-networks', formData);
        notify.success('Payment network created successfully');
      }
      
      fetchNetworks();
      closeModal();
    } catch (error: any) {
      console.error('Error saving payment network:', error);
      notify.error(error.response?.data?.error || 'Failed to save payment network');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (network: CardPaymentNetwork) => {
    setEditingNetwork(network);
    setFormData({
      name: network.name,
      type: network.type,
      processingFee: Number(network.processingFee),
      settlementDays: network.settlementDays,
      description: network.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment network?')) {
      return;
    }

    try {
      await api.delete(`/card-payment-networks/${id}`);
      notify.success('Payment network deleted successfully');
      fetchNetworks();
    } catch (error: any) {
      console.error('Error deleting payment network:', error);
      notify.error(error.response?.data?.error || 'Failed to delete payment network');
    }
  };

  const initializeDefaults = async () => {
    try {
      setLoading(true);
      await api.post('/card-payment-networks/initialize');
      notify.success('Default payment networks initialized');
      fetchNetworks();
    } catch (error: any) {
      console.error('Error initializing networks:', error);
      notify.error(error.response?.data?.error || 'Failed to initialize networks');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setEditingNetwork(null);
    setFormData({
      name: '',
      type: 'DEBIT',
      processingFee: 0.025,
      settlementDays: 1,
      description: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNetwork(null);
  };

  const filteredNetworks = networks.filter((network) =>
    Object.values(network).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getTypeColor = (type: string) => {
    return type === 'CREDIT' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <CreditCard className="text-blue-600" />
            Card Payment Networks
          </h1>
          <p className="text-gray-600 mt-2">Manage Visa, Mastercard, and other payment networks</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={initializeDefaults}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
          >
            <Building2 size={20} />
            Initialize Defaults
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openModal}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Network
          </motion.button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search networks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">NETWORK</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">TYPE</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">PROCESSING FEE</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">SETTLEMENT DAYS</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">STATUS</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">DESCRIPTION</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredNetworks.map((network, index) => (
                <motion.tr
                  key={network.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="text-blue-600 w-5 h-5" />
                      <span className="font-medium">{network.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(network.type)}`}>
                      {network.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {(Number(network.processingFee) * 100).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{network.settlementDays} day{network.settlementDays !== 1 ? 's' : ''}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      network.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {network.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {network.description || 'No description'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-center">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(network)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit Network"
                      >
                        <Edit size={16} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(network.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Network"
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredNetworks.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payment networks</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new payment network.</p>
            <div className="mt-6">
              <button
                onClick={openModal}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Add Network
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modal */}
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
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <CreditCard className="text-blue-600" />
                  {editingNetwork ? 'Edit Network' : 'Add Network'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Network Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Visa, Mastercard"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'DEBIT' | 'CREDIT' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="DEBIT">Debit Card</option>
                    <option value="CREDIT">Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Processing Fee (%) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      max="1"
                      required
                      value={formData.processingFee}
                      onChange={(e) => setFormData({ ...formData, processingFee: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.025 (2.5%)"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter as decimal (e.g., 0.025 for 2.5%)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Settlement Days *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      min="1"
                      max="30"
                      required
                      value={formData.settlementDays}
                      onChange={(e) => setFormData({ ...formData, settlementDays: parseInt(e.target.value) || 1 })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Optional description..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : editingNetwork ? 'Update' : 'Create'}
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

export default CardPaymentNetworks;