import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Eye, CheckCircle, Clock, XCircle, X, Trash2, ShoppingCart, DollarSign } from 'lucide-react';
import api from '../api/axios';
import { Purchase, Supplier, Product } from '../types';

interface PurchaseItem {
  productId: number;
  productName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  tax: number;
  total: number;
}

const Purchases = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    documentNumber: '',
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    supplierRnc: '',
    ncf: '',
    purchaseType: 'Merchandise for sale or consumption',
    paymentType: 'CASH',
    paymentMethod: 'Cash',
    paidAmount: 0,
    status: 'COMPLETED',
    invoice: '',
  });
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await api.get('/purchases');
      setPurchases(response.data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addProductToPurchase = () => {
    if (!selectedProduct || quantity <= 0 || unitCost <= 0) return;
    
    const product = products.find(p => p.id === parseInt(selectedProduct));
    if (!product) return;
    
    const existingIndex = purchaseItems.findIndex(item => item.productId === product.id);
    if (existingIndex >= 0) {
      const updated = [...purchaseItems];
      updated[existingIndex].quantity += quantity;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * unitCost;
      updated[existingIndex].tax = updated[existingIndex].subtotal * (Number(product.taxRate) / 100);
      updated[existingIndex].total = updated[existingIndex].subtotal + updated[existingIndex].tax;
      setPurchaseItems(updated);
    } else {
      const subtotal = quantity * unitCost;
      const tax = subtotal * (Number(product.taxRate) / 100);
      const total = subtotal + tax;
      
      setPurchaseItems([...purchaseItems, {
        productId: product.id,
        productName: product.name,
        quantity,
        unitCost,
        subtotal,
        tax,
        total,
      }]);
    }
    
    setSelectedProduct('');
    setQuantity(1);
    setUnitCost(0);
  };

  const removeItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const productTotal = purchaseItems.reduce((sum, item) => sum + item.total, 0);
    return { productTotal, total: productTotal };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (purchaseItems.length === 0) {
      alert('Please add at least one product');
      return;
    }
    
    try {
      const totals = calculateTotals();
      const paidAmount = formData.paymentMethod === 'Credit' ? 0 : totals.total;
      
      await api.post('/purchases', {
        ...formData,
        supplierId: parseInt(formData.supplierId),
        supplierRnc: formData.supplierRnc,
        ncf: formData.ncf,
        purchaseType: formData.purchaseType,
        productTotal: totals.productTotal,
        additionalExpenses: 0,
        total: totals.total,
        paidAmount: paidAmount,
        balanceAmount: totals.total - paidAmount,
        items: purchaseItems,
      });
      fetchPurchases();
      closeModal();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error creating purchase');
      console.error('Error creating purchase:', error);
    }
  };

  const openModal = () => {
    setFormData({
      documentNumber: `PUR-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      supplierId: '',
      supplierRnc: '',
      ncf: '',
      purchaseType: 'Merchandise for sale or consumption',
      paymentType: 'CASH',
      paymentMethod: 'Cash',
      paidAmount: 0,
      status: 'COMPLETED',
      invoice: '',
    });
    setPurchaseItems([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setPurchaseItems([]);
  };

  const openPaymentModal = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setPaymentAmount(Number(purchase.balanceAmount));
    setPaymentMethod('Cash');
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPurchase(null);
    setPaymentAmount(0);
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase) return;

    try {
      await api.post(`/purchases/${selectedPurchase.id}/collect-payment`, {
        amount: paymentAmount,
        paymentMethod: paymentMethod,
      });
      fetchPurchases();
      closePaymentModal();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error collecting payment');
      console.error('Error collecting payment:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      COMPLETED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    const icons = {
      COMPLETED: CheckCircle,
      PENDING: Clock,
      CANCELLED: XCircle,
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        <Icon size={14} />
        {status}
      </span>
    );
  };

  const filteredPurchases = purchases.filter((purchase) =>
    Object.values(purchase).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totals = calculateTotals();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search purchases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openModal}
          className="ml-4 bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-lg"
        >
          <Plus size={20} />
          New Purchase
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
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">REG. NUMBER</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">DATE</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">SUPPLIER</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">PAYMENT METHOD</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">PAYMENT STATUS</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">TOTAL</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">PAID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">BALANCE</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">STATUS</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchases.map((purchase, index) => (
              <motion.tr
                key={purchase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 text-sm font-medium">{purchase.registrationNumber}</td>
                <td className="px-6 py-4 text-sm">{new Date(purchase.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm">{purchase.supplier?.name || 'N/A'}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {purchase.paymentMethod}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    purchase.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                    purchase.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {purchase.paymentStatus}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-semibold">${Number(purchase.total).toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-green-600">${Number(purchase.paidAmount).toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-red-600">${Number(purchase.balanceAmount).toFixed(2)}</td>
                <td className="px-6 py-4">{getStatusBadge(purchase.status)}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </motion.button>
                    {purchase.paymentStatus !== 'Paid' && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openPaymentModal(purchase)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Make Payment"
                      >
                        <DollarSign size={18} />
                      </motion.button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Create Purchase Modal */}
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
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingCart className="text-blue-600" />
                  New Purchase
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                    <input
                      type="text"
                      required
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="RC0001"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Supplier Information */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                    <select
                      required
                      value={formData.supplierId}
                      onChange={(e) => {
                        const supplier = suppliers.find(s => s.id === parseInt(e.target.value));
                        setFormData({ 
                          ...formData, 
                          supplierId: e.target.value,
                          supplierRnc: supplier?.rnc || ''
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RNC Supplier</label>
                    <input
                      type="text"
                      value={formData.supplierRnc}
                      onChange={(e) => setFormData({ ...formData, supplierRnc: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Supplier RNC"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NCF</label>
                    <input
                      type="text"
                      value={formData.ncf}
                      onChange={(e) => setFormData({ ...formData, ncf: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="NCF Number"
                    />
                  </div>
                </div>

                {/* Payment Information */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Type *</label>
                    <select
                      required
                      value={formData.purchaseType}
                      onChange={(e) => setFormData({ ...formData, purchaseType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Merchandise for sale or consumption">Merchandise for sale or consumption</option>
                      <option value="Service">Service</option>
                      <option value="Fixed Asset">Fixed Asset</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms *</label>
                    <select
                      required
                      value={formData.paymentType}
                      onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CREDIT">Credit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                    <select
                      required
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Deposit">Deposit</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Credit">Credit (Pay Later)</option>
                    </select>
                  </div>
                </div>

                {/* Add Products */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Add Products</h3>
                  <div className="flex gap-3">
                    <select
                      value={selectedProduct}
                      onChange={(e) => {
                        setSelectedProduct(e.target.value);
                        const product = products.find(p => p.id === parseInt(e.target.value));
                        if (product) setUnitCost(Number(product.costPrice));
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select product...</option>
                      {products.filter(p => p.status === 'ACTIVE').map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (Current stock: {product.quantity})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      placeholder="Qty"
                      className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={unitCost}
                      onChange={(e) => setUnitCost(parseFloat(e.target.value))}
                      placeholder="Cost"
                      className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={addProductToPurchase}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Add
                    </motion.button>
                  </div>
                </div>

                {/* Items Table */}
                {purchaseItems.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Qty</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Unit Cost</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Subtotal</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Tax</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseItems.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-3 text-sm">{item.productName}</td>
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
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-semibold">
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-right">Total:</td>
                          <td className="px-4 py-3 text-right text-green-600 text-lg">${totals.total.toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

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
                    disabled={purchaseItems.length === 0}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Create Purchase - ${totals.total.toFixed(2)}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Collection Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedPurchase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closePaymentModal}
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
                  <DollarSign className="text-green-600" />
                  Make Payment
                </h2>
                <button onClick={closePaymentModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Purchase Number:</span>
                  <span className="font-semibold">{selectedPurchase.registrationNumber}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Supplier:</span>
                  <span className="font-semibold">{selectedPurchase.supplier?.name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold">${Number(selectedPurchase.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Paid Amount:</span>
                  <span className="font-semibold text-green-600">${Number(selectedPurchase.paidAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">Balance Due:</span>
                  <span className="font-bold text-red-600">${Number(selectedPurchase.balanceAmount).toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handleCollectPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={Number(selectedPurchase.balanceAmount)}
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                  <select
                    required
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Paytm">Paytm</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closePaymentModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Pay ${paymentAmount.toFixed(2)}
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

export default Purchases;
