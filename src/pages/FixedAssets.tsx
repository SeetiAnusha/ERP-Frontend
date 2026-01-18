import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
import api from '../api/axios';
import { FixedAsset } from '../types';

const FixedAssets = () => {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    acquisitionCost: 0,
    usefulLife: 0,
    depreciationMethod: 'Straight-line',
    residualValue: 0,
    accumulatedDepreciation: 0,
    status: 'ACTIVE',
    location: '',
    serialNumber: '',
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await api.get('/fixed-assets');
      setAssets(response.data);
    } catch (error) {
      console.error('Error fetching fixed assets:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        await api.put(`/fixed-assets/${editingAsset.id}`, formData);
      } else {
        await api.post('/fixed-assets', formData);
      }
      fetchAssets();
      closeModal();
    } catch (error) {
      console.error('Error saving fixed asset:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this fixed asset?')) {
      try {
        await api.delete(`/fixed-assets/${id}`);
        fetchAssets();
      } catch (error) {
        console.error('Error deleting fixed asset:', error);
      }
    }
  };

  const openModal = (asset?: FixedAsset) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData(asset);
    } else {
      setEditingAsset(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        category: '',
        acquisitionDate: new Date().toISOString().split('T')[0],
        acquisitionCost: 0,
        usefulLife: 0,
        depreciationMethod: 'Straight-line',
        residualValue: 0,
        accumulatedDepreciation: 0,
        status: 'ACTIVE',
        location: '',
        serialNumber: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAsset(null);
  };

  const filteredAssets = assets.filter((asset) =>
    Object.values(asset).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search fixed assets..."
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
          New Fixed Asset
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">CODE</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">NAME</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">CATEGORY</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ACQUISITION COST</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">DEPRECIATION</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">BOOK VALUE</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">STATUS</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredAssets.map((asset, index) => (
                <motion.tr
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium">{asset.code}</td>
                  <td className="px-6 py-4 text-sm">{asset.name}</td>
                  <td className="px-6 py-4 text-sm">{asset.category}</td>
                  <td className="px-6 py-4 text-sm">${asset.acquisitionCost.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">${asset.accumulatedDepreciation.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">${asset.bookValue.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      asset.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openModal(asset)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={18} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(asset.id)}
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
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingAsset ? 'Edit Fixed Asset' : 'New Fixed Asset'}</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.acquisitionDate}
                      onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Cost *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.acquisitionCost}
                      onChange={(e) => setFormData({ ...formData, acquisitionCost: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Useful Life (years) *</label>
                    <input
                      type="number"
                      required
                      value={formData.usefulLife}
                      onChange={(e) => setFormData({ ...formData, usefulLife: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Residual Value</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.residualValue}
                      onChange={(e) => setFormData({ ...formData, residualValue: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save
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

export default FixedAssets;
