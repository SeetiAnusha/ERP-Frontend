import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaFileInvoice, FaSearch } from 'react-icons/fa';
import axios from '../api/axios';
import { Adjustment, Purchase, Sale, Product } from '../types';

interface AdjustmentItem {
  productCode: string;
  productName: string;
  unitOfMeasurement: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  tax: number;
  total: number;
}

const Adjustments = () => {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState<Adjustment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

  const [formData, setFormData] = useState({
    registrationDate: new Date().toISOString().split('T')[0],
    type: 'Debit Note',
    relatedDocumentType: 'Purchase',
    relatedDocumentNumber: '',
    relatedEntityType: 'Supplier',
    relatedEntityId: '',
    supplierRnc: '',
    supplierName: '',
    clientRnc: '',
    clientName: '',
    ncf: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
    adjustmentAmount: '',
    notes: '',
  });

  const [adjustmentItems, setAdjustmentItems] = useState<AdjustmentItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);

  useEffect(() => {
    fetchAdjustments();
    fetchPurchases();
    fetchSales();
    fetchProducts();
  }, []);

  const fetchAdjustments = async () => {
    try {
      const response = await axios.get('/adjustments');
      setAdjustments(response.data);
    } catch (error) {
      console.error('Error fetching adjustments:', error);
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await axios.get('/purchases');
      setPurchases(response.data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await axios.get('/sales');
      setSales(response.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addProductToAdjustment = () => {
    if (!selectedProduct || quantity <= 0) return;
    
    const product = products.find(p => p.id === parseInt(selectedProduct));
    if (!product) return;
    
    const subtotal = quantity * unitCost;
    const tax = subtotal * (Number(product.taxRate) / 100);
    const total = subtotal + tax;
    
    setAdjustmentItems([...adjustmentItems, {
      productCode: product.code,
      productName: product.name,
      unitOfMeasurement: product.unit,
      quantity,
      unitCost,
      subtotal,
      tax,
      total,
    }]);
    
    setSelectedProduct('');
    setQuantity(1);
    setUnitCost(0);
  };

  const removeItem = (index: number) => {
    setAdjustmentItems(adjustmentItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = adjustmentItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = adjustmentItems.reduce((sum, item) => sum + item.tax, 0);
    const total = adjustmentItems.reduce((sum, item) => sum + item.total, 0);
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totals = calculateTotals();
      const adjustmentData = {
        ...formData,
        relatedEntityId: parseInt(formData.relatedEntityId),
        adjustmentAmount: totals.total,
      };

      if (editingAdjustment) {
        await axios.put(`/adjustments/${editingAdjustment.id}`, adjustmentData);
      } else {
        await axios.post('/adjustments', adjustmentData);
      }
      fetchAdjustments();
      resetForm();
    } catch (error) {
      console.error('Error saving adjustment:', error);
      alert('Error saving adjustment');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this adjustment?')) {
      try {
        await axios.delete(`/adjustments/${id}`);
        fetchAdjustments();
      } catch (error) {
        console.error('Error deleting adjustment:', error);
        alert('Error deleting adjustment');
      }
    }
  };

  const handleEdit = (adjustment: Adjustment) => {
    setEditingAdjustment(adjustment);
    setFormData({
      registrationDate: adjustment.registrationDate.split('T')[0],
      type: adjustment.type,
      relatedDocumentType: adjustment.relatedDocumentType,
      relatedDocumentNumber: adjustment.relatedDocumentNumber,
      relatedEntityType: adjustment.relatedEntityType,
      relatedEntityId: adjustment.relatedEntityId.toString(),
      supplierRnc: adjustment.supplierRnc || '',
      supplierName: adjustment.supplierName || '',
      clientRnc: adjustment.clientRnc || '',
      clientName: adjustment.clientName || '',
      ncf: adjustment.ncf || '',
      date: adjustment.date ? adjustment.date.toString().split('T')[0] : new Date().toISOString().split('T')[0],
      reason: adjustment.reason,
      adjustmentAmount: adjustment.adjustmentAmount.toString(),
      notes: adjustment.notes || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      registrationDate: new Date().toISOString().split('T')[0],
      type: 'Debit Note',
      relatedDocumentType: 'Purchase',
      relatedDocumentNumber: '',
      relatedEntityType: 'Supplier',
      relatedEntityId: '',
      supplierRnc: '',
      supplierName: '',
      clientRnc: '',
      clientName: '',
      ncf: '',
      date: new Date().toISOString().split('T')[0],
      reason: '',
      adjustmentAmount: '',
      notes: '',
    });
    setAdjustmentItems([]);
    setEditingAdjustment(null);
    setShowModal(false);
  };

  const handleDocumentChange = (docId: string) => {
    if (formData.relatedDocumentType === 'Purchase') {
      const purchase = purchases.find(p => p.id === parseInt(docId));
      if (purchase) {
        setFormData({
          ...formData,
          relatedEntityId: purchase.supplierId.toString(),
          relatedDocumentNumber: purchase.registrationNumber,
          supplierRnc: purchase.supplierRnc || '',
          supplierName: purchase.supplier?.name || '',
        });
      }
    } else {
      const sale = sales.find(s => s.id === parseInt(docId));
      if (sale) {
        setFormData({
          ...formData,
          relatedEntityId: sale.clientId.toString(),
          relatedDocumentNumber: sale.registrationNumber,
          clientRnc: sale.clientRnc || '',
          clientName: sale.client?.name || '',
        });
      }
    }
  };

  const filteredAdjustments = adjustments.filter(adjustment => {
    const matchesSearch = 
      adjustment.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adjustment.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adjustment.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'All' || adjustment.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const totals = calculateTotals();

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
            <h2 className="text-3xl font-bold text-gray-800">Adjustments & Corrections</h2>
            <p className="text-gray-600 mt-1">Debit Notes, Credit Notes, and Adjustments</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <FaPlus /> New Adjustment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search adjustments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Types</option>
            <option value="Debit Note">Debit Note</option>
            <option value="Credit Note">Credit Note</option>
            <option value="Adjustment">Adjustment</option>
          </select>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Related Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdjustments.map((adjustment) => (
                <tr key={adjustment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {adjustment.registrationNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(adjustment.registrationDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      adjustment.type === 'Debit Note'
                        ? 'bg-red-100 text-red-800'
                        : adjustment.type === 'Credit Note'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {adjustment.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {adjustment.relatedDocumentNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {adjustment.supplierName || adjustment.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    ${parseFloat(adjustment.adjustmentAmount.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => handleEdit(adjustment)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(adjustment.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
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
            className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <FaFileInvoice className="text-blue-600" />
                {editingAdjustment ? 'Edit Adjustment' : 'New Adjustment'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.registrationDate}
                      onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Debit Note">Debit Note (ND)</option>
                      <option value="Credit Note">Credit Note (NC)</option>
                      <option value="Adjustment">Adjustment (AJ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Related Document Type *
                    </label>
                    <select
                      required
                      value={formData.relatedDocumentType}
                      onChange={(e) => {
                        setFormData({ 
                          ...formData, 
                          relatedDocumentType: e.target.value,
                          relatedEntityType: e.target.value === 'Purchase' ? 'Supplier' : 'Client',
                          relatedDocumentNumber: '',
                          relatedEntityId: '',
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Purchase">Purchase Invoice</option>
                      <option value="Sale">Sales Invoice</option>
                    </select>
                  </div>
                </div>

                {/* Document Selection */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Document *
                    </label>
                    <select
                      required
                      onChange={(e) => handleDocumentChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a document</option>
                      {formData.relatedDocumentType === 'Purchase' 
                        ? purchases.map(purchase => (
                            <option key={purchase.id} value={purchase.id}>
                              {purchase.registrationNumber} - {purchase.supplier?.name} - ${parseFloat(purchase.total.toString()).toFixed(2)}
                            </option>
                          ))
                        : sales.map(sale => (
                            <option key={sale.id} value={sale.id}>
                              {sale.registrationNumber} - {sale.client?.name} - ${parseFloat(sale.total.toString()).toFixed(2)}
                            </option>
                          ))
                      }
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.relatedEntityType === 'Supplier' ? 'RNC Supplier' : 'RNC Customer'}
                    </label>
                    <input
                      type="text"
                      value={formData.relatedEntityType === 'Supplier' ? formData.supplierRnc : formData.clientRnc}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        [formData.relatedEntityType === 'Supplier' ? 'supplierRnc' : 'clientRnc']: e.target.value 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="RNC"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NCF
                    </label>
                    <input
                      type="text"
                      value={formData.ncf}
                      onChange={(e) => setFormData({ ...formData, ncf: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="NCF Number"
                    />
                  </div>
                </div>

                {/* Add Products */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Add Products to Adjustment</h4>
                  <div className="grid grid-cols-4 gap-3">
                    <select
                      value={selectedProduct}
                      onChange={(e) => {
                        setSelectedProduct(e.target.value);
                        const product = products.find(p => p.id === parseInt(e.target.value));
                        if (product) setUnitCost(Number(product.unitCost));
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select product...</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.code} - {product.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      placeholder="Quantity"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={unitCost}
                      onChange={(e) => setUnitCost(parseFloat(e.target.value))}
                      placeholder="Unit Cost"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={addProductToAdjustment}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Items Table */}
                {adjustmentItems.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">UdM</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Qty</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Unit Cost</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Subtotal</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Tax</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {adjustmentItems.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-3 text-sm">{item.productCode}</td>
                            <td className="px-4 py-3 text-sm">{item.productName}</td>
                            <td className="px-4 py-3 text-sm">{item.unitOfMeasurement}</td>
                            <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-right">${item.unitCost.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-right">${item.subtotal.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-right">${item.tax.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold">${item.total.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FaTrash size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-semibold">
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-right">Subtotal:</td>
                          <td className="px-4 py-3 text-right">${totals.subtotal.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">${totals.tax.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-green-600 text-lg">${totals.total.toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Reason and Notes */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Adjustment *
                    </label>
                    <textarea
                      required
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Explain the reason for this adjustment..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Additional notes..."
                    />
                  </div>
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
                    {editingAdjustment ? 'Update Adjustment' : 'Create Adjustment'}
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

export default Adjustments;
