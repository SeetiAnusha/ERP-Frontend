import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Calendar, Edit } from 'lucide-react';
import api from '../api/axios';
import { ProductPrice } from '../types';
import { formatNumber } from '../utils/formatNumber';

interface Props {
  productId: number;
  productName: string;
  onClose: () => void;
  onPriceUpdated?: () => void;
}

const PriceHistoryModal = ({ productId, productName, onClose, onPriceUpdated }: Props) => {
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState<ProductPrice | null>(null);
  const [newPrice, setNewPrice] = useState({
    salesPrice: '',
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchPriceHistory();
  }, [productId]);

  const fetchPriceHistory = async () => {
    try {
      const response = await api.get(`/product-prices/product/${productId}`);
      setPrices(response.data);
    } catch (error) {
      console.error('Error fetching price history:', error);
    }
  };

  const handleSyncPrices = async () => {
    try {
      await api.post('/product-prices/update-active-status');
      fetchPriceHistory();
      if (onPriceUpdated) {
        onPriceUpdated();
      }
      alert('Price status synchronized successfully!');
    } catch (error) {
      console.error('Error syncing prices:', error);
      alert('Error syncing prices');
    }
  };

  const handleAddPrice = async () => {
    if (!newPrice.salesPrice || !newPrice.effectiveDate) {
      alert('Please enter sales price and effective date');
      return;
    }

    try {
      if (editingPrice) {
        // Update existing price
        await api.put(`/product-prices/${editingPrice.id}`, {
          salesPrice: parseFloat(newPrice.salesPrice),
          effectiveDate: newPrice.effectiveDate,
        });
      } else {
        // Create new price
        await api.post('/product-prices', {
          productId,
          salesPrice: parseFloat(newPrice.salesPrice),
          effectiveDate: newPrice.effectiveDate,
        });
      }
      
      // Refresh price history first
      await fetchPriceHistory();
      
      // Clear form
      setNewPrice({ salesPrice: '', effectiveDate: new Date().toISOString().split('T')[0] });
      setShowAddForm(false);
      setEditingPrice(null);
      
      // Notify parent to refresh product list (this updates the sales price in the table)
      if (onPriceUpdated) {
        await onPriceUpdated();
      }
      
      // Show success message
      alert(editingPrice ? 'Price updated successfully!' : 'Price added successfully!');
    } catch (error: any) {
      console.error('Error saving price:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error saving price';
      alert(errorMessage);
    }
  };

  const handleEdit = (price: ProductPrice) => {
    setEditingPrice(price);
    setNewPrice({
      salesPrice: price.salesPrice.toString(),
      effectiveDate: new Date(price.effectiveDate).toISOString().split('T')[0],
    });
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditingPrice(null);
    setNewPrice({ salesPrice: '', effectiveDate: new Date().toISOString().split('T')[0] });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this price?')) {
      try {
        await api.delete(`/product-prices/${id}`);
        
        // Refresh price history first
        await fetchPriceHistory();
        
        // Notify parent to refresh product list
        if (onPriceUpdated) {
          await onPriceUpdated();
        }
        
        alert('Price deleted successfully!');
      } catch (error) {
        console.error('Error deleting price:', error);
        alert('Error deleting price');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="text-blue-600" />
            Price History - {productName}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              setEditingPrice(null);
              setShowAddForm(!showAddForm);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} />
            Add New Price
          </button>
          <button
            onClick={handleSyncPrices}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            title="Sync all prices with current date"
          >
            <Calendar size={18} />
            Sync Status
          </button>
        </div>

        {showAddForm && (
          <div className="mb-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
            <h3 className="text-lg font-semibold mb-3">{editingPrice ? 'Edit Price' : 'Add New Price'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sales Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPrice.salesPrice}
                  onChange={(e) => setNewPrice({ ...newPrice, salesPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="38.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date *</label>
                <input
                  type="date"
                  value={newPrice.effectiveDate}
                  onChange={(e) => setNewPrice({ ...newPrice, effectiveDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAddPrice}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {editingPrice ? 'Update' : 'Save'}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Sales Price</th>
                <th className="px-4 py-3 text-left font-semibold">Effective Date</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {prices.map((price) => (
                <tr key={price.id} className="border-t">
                  <td className="px-4 py-3 font-semibold text-blue-600">{formatNumber(price.salesPrice)}</td>
                  <td className="px-4 py-3">{new Date(price.effectiveDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      price.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {price.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(price)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(price.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {prices.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No price history found. Add a new price to get started.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PriceHistoryModal;
