import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaChartLine, FaSearch } from 'react-icons/fa';
import axios from '../api/axios';
import { Investment } from '../types';

const Investments = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'Stocks',
    description: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    acquisitionCost: '',
    currentValue: '',
    quantity: '',
    unitCost: '',
    status: 'ACTIVE',
    maturityDate: '',
    interestRate: '',
  });

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      const response = await axios.get('/investments');
      setInvestments(response.data);
    } catch (error) {
      console.error('Error fetching investments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        acquisitionCost: parseFloat(formData.acquisitionCost),
        currentValue: parseFloat(formData.currentValue),
        quantity: parseFloat(formData.quantity),
        unitCost: parseFloat(formData.unitCost),
        interestRate: formData.interestRate ? parseFloat(formData.interestRate) : null,
        maturityDate: formData.maturityDate || null,
      };

      if (editingInvestment) {
        await axios.put(`/investments/${editingInvestment.id}`, data);
      } else {
        await axios.post('/investments', data);
      }
      fetchInvestments();
      resetForm();
    } catch (error) {
      console.error('Error saving investment:', error);
      alert('Error saving investment');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      try {
        await axios.delete(`/investments/${id}`);
        fetchInvestments();
      } catch (error) {
        console.error('Error deleting investment:', error);
        alert('Error deleting investment');
      }
    }
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setFormData({
      code: investment.code,
      name: investment.name,
      type: investment.type,
      description: investment.description,
      acquisitionDate: investment.acquisitionDate.split('T')[0],
      acquisitionCost: investment.acquisitionCost.toString(),
      currentValue: investment.currentValue.toString(),
      quantity: investment.quantity.toString(),
      unitCost: investment.unitCost.toString(),
      status: investment.status,
      maturityDate: investment.maturityDate ? investment.maturityDate.toString().split('T')[0] : '',
      interestRate: investment.interestRate ? investment.interestRate.toString() : '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: 'Stocks',
      description: '',
      acquisitionDate: new Date().toISOString().split('T')[0],
      acquisitionCost: '',
      currentValue: '',
      quantity: '',
      unitCost: '',
      status: 'ACTIVE',
      maturityDate: '',
      interestRate: '',
    });
    setEditingInvestment(null);
    setShowModal(false);
  };

  const filteredInvestments = investments.filter(investment => {
    const matchesSearch = 
      investment.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investment.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || investment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const totalAcquisitionCost = investments.reduce((sum, inv) => sum + parseFloat(inv.acquisitionCost.toString()), 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + parseFloat(inv.currentValue.toString()), 0);
  const totalGainLoss = totalCurrentValue - totalAcquisitionCost;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Investments</h2>
            <p className="text-gray-600 mt-1">Track investments, bonds, and capital goods</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <FaPlus /> New Investment
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Acquisition Cost</p>
                <p className="text-2xl font-bold text-blue-700">
                  ${totalAcquisitionCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <FaChartLine className="text-blue-400 text-3xl" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Current Value</p>
                <p className="text-2xl font-bold text-green-700">
                  ${totalCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <FaChartLine className="text-green-400 text-3xl" />
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${totalGainLoss >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Gain/Loss
                </p>
                <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  ${Math.abs(totalGainLoss).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <FaChartLine className={`text-3xl ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search investments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="MATURED">Matured</option>
            <option value="SOLD">Sold</option>
          </select>
        </div>
      </div>

      {/* Investments Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acquisition Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gain/Loss</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvestments.map((investment) => {
                const gainLoss = parseFloat(investment.currentValue.toString()) - parseFloat(investment.acquisitionCost.toString());
                return (
                  <tr key={investment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{investment.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{investment.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{investment.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{investment.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      ${parseFloat(investment.acquisitionCost.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                      ${parseFloat(investment.currentValue.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {gainLoss >= 0 ? '+' : ''}${gainLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        investment.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        investment.status === 'MATURED' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {investment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => handleEdit(investment)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(investment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-6">
                {editingInvestment ? 'Edit Investment' : 'New Investment'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Stocks">Stocks</option>
                      <option value="Bonds">Bonds</option>
                      <option value="Mutual Funds">Mutual Funds</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Cryptocurrency">Cryptocurrency</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.acquisitionDate}
                      onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.unitCost}
                      onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Cost *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.acquisitionCost}
                      onChange={(e) => setFormData({ ...formData, acquisitionCost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Value *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.currentValue}
                      onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maturity Date</label>
                    <input
                      type="date"
                      value={formData.maturityDate}
                      onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="MATURED">Matured</option>
                      <option value="SOLD">Sold</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    {editingInvestment ? 'Update Investment' : 'Create Investment'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Investments;
