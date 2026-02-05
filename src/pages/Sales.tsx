import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Eye, CheckCircle, Clock, XCircle, X, Trash2, ShoppingCart, DollarSign, Package } from 'lucide-react';
import api from '../api/axios';
import { Sale, Client, Product } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SaleItem {
  productId: number;
  productName: string;
  productAmount: number;
  quantity: number;
  productUnitCost: number;
  unitPrice: number;
  subtotal: number;
  tax: number;
  total: number;
}

const Sales = () => {
  const { t } = useLanguage();
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    documentNumber: '',
    date: new Date().toISOString().split('T')[0],
    clientId: '',
    clientRnc: '',
    ncf: '',
    saleType: 'Merchandise for sale',
    paymentType: 'CASH',
    paidAmount: 0,
    status: 'COMPLETED',
  });
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [viewDetailsModal, setViewDetailsModal] = useState(false);
  const [viewProductsModal, setViewProductsModal] = useState(false);

  useEffect(() => {
    fetchSales();
    fetchClients();
    fetchProducts();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await api.get('/sales');
      setSales(response.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
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

  const addProductToSale = () => {
    if (!selectedProduct || quantity <= 0) {
      alert('Please select a product and enter valid quantity');
      return;
    }
    
    const product = products.find(p => p.id === parseInt(selectedProduct));
    if (!product) return;
    
    // Check stock
    if (Number(product.amount) < quantity) {
      alert(`Insufficient stock! Available: ${product.amount}, Required: ${quantity}`);
      return;
    }
    
    // Use product's unitCost as sale price
    const unitCost = Number(product.unitCost);
    const subtotal = quantity * unitCost;
    const taxAmount = Number(product.taxRate);  // Tax as direct number
    const total = subtotal + taxAmount;
    
    setSaleItems([...saleItems, {
      productId: product.id,
      productName: product.name,
      productAmount: Number(product.amount),
      quantity,
      productUnitCost: unitCost,
      unitPrice: unitCost,
      subtotal,
      tax: taxAmount,
      total,
    }]);
    
    setSelectedProduct('');
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = saleItems.reduce((sum, item) => sum + item.tax, 0);
    const total = saleItems.reduce((sum, item) => sum + item.total, 0);
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (saleItems.length === 0) {
      alert('Please add at least one product');
      return;
    }
    
    try {
      const totals = calculateTotals();
      const paidAmount = formData.paymentType === 'CREDIT' ? 0 : totals.total;
      
      await api.post('/sales', {
        ...formData,
        clientId: parseInt(formData.clientId),
        subtotal: totals.subtotal,
        tax: totals.tax,
        discount: 0,
        total: totals.total,
        paidAmount: paidAmount,
        balanceAmount: totals.total - paidAmount,
        clientRnc: formData.clientRnc,
        ncf: formData.ncf,
        saleType: formData.saleType,
        items: saleItems,
      });
      fetchSales();
      closeModal();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error creating sale');
      console.error('Error creating sale:', error);
    }
  };

  const openModal = () => {
    setFormData({
      documentNumber: `INV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      clientId: '',
      clientRnc: '',
      ncf: '',
      saleType: 'Merchandise for sale',
      paymentType: 'CASH',
      paidAmount: 0,
      status: 'COMPLETED',
    });
    setSaleItems([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSaleItems([]);
  };

  const openPaymentModal = (sale: Sale) => {
    setSelectedSale(sale);
    setPaymentAmount(Number(sale.balanceAmount));
    setPaymentMethod('Cash');
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedSale(null);
    setPaymentAmount(0);
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;

    try {
      await api.post(`/sales/${selectedSale.id}/collect-payment`, {
        amount: paymentAmount,
        paymentMethod: paymentMethod,
      });
      fetchSales();
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

  const filteredSales = sales.filter((sale) =>
    Object.values(sale).some((value) =>
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
            placeholder={t('search')}
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
          {t('newSale')}
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
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('registrationNumber').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('client').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">CLIENT RNC</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('date').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">SALE OF</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">PAYMENT TYPE</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">{t('total').toUpperCase()}</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">{t('actions').toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((sale, index) => (
              <motion.tr
                key={sale.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 text-sm font-medium">{sale.registrationNumber}</td>
                <td className="px-6 py-4 text-sm">{sale.client?.name || 'N/A'}</td>
                <td className="px-6 py-4 text-sm">{sale.clientRnc || 'N/A'}</td>
                <td className="px-6 py-4 text-sm">{new Date(sale.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm">{sale.saleType || 'N/A'}</td>
                <td className="px-6 py-4 text-sm">{sale.paymentType || 'N/A'}</td>
                <td className="px-6 py-4 text-sm font-semibold text-right">{Number(sale.total).toFixed(2)}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setSelectedSale(sale);
                        setViewDetailsModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Sale Details"
                    >
                      <Eye size={18} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setSelectedSale(sale);
                        setViewProductsModal(true);
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Product Details"
                    >
                      <Package size={18} />
                    </motion.button>
                    {sale.paymentStatus !== 'Paid' && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openPaymentModal(sale)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                        title="Collect Payment"
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
                  {t('newSale')}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('registrationNumber')}</label>
                    <input
                      type="text"
                      required
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="RV0001"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('registrationDate')} *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Client Information */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('client')} *</label>
                    <select
                      required
                      value={formData.clientId}
                      onChange={(e) => {
                        const client = clients.find(c => c.id === parseInt(e.target.value));
                        setFormData({ 
                          ...formData, 
                          clientId: e.target.value,
                          clientRnc: client?.rncCedula || ''
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('selectClient')}</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('clientRnc')}</label>
                    <input
                      type="text"
                      value={formData.clientRnc}
                      onChange={(e) => setFormData({ ...formData, clientRnc: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={t('clientRnc')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('ncf')}</label>
                    <input
                      type="text"
                      value={formData.ncf}
                      onChange={(e) => setFormData({ ...formData, ncf: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={t('ncf')}
                    />
                  </div>
                </div>

                {/* Payment Information */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale of *</label>
                    <select
                      required
                      value={formData.saleType}
                      onChange={(e) => setFormData({ ...formData, saleType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Merchandise for sale">Merchandise for sale</option>
                      <option value="Service">Service</option>
                      <option value="Good for internal use">Good for internal use</option>
                      <option value="Investment good">Investment good</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type *</label>
                    <select
                      required
                      value={formData.paymentType}
                      onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="DEPOSIT">Deposit</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="CREDIT">Credit</option>
                    </select>
                  </div>
                </div>

                {/* Add Products */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">{t('addProducts')}</h3>
                  <div className="flex gap-3">
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select product...</option>
                      {products.filter(p => p.status === 'ACTIVE').map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - Unit Cost: {Number(product.unitCost).toFixed(2)} | Stock: {product.amount}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      placeholder="Quantity"
                      className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={addProductToSale}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      {t('add')}
                    </motion.button>
                  </div>
                </div>

                {/* Items Table */}
                {saleItems.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">{t('product')}</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Stock</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">{t('qty')}</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Unit Cost</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">{t('subtotal')}</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">{t('tax')}</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">{t('total')}</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {saleItems.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-3 text-sm">{item.productName}</td>
                            <td className="px-4 py-3 text-sm text-right">{item.productAmount}</td>
                            <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-right">{Number(item.unitPrice).toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-right">{Number(item.subtotal).toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-right">{Number(item.tax).toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold">{Number(item.total).toFixed(2)}</td>
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
                          <td colSpan={4} className="px-4 py-3 text-right">{t('subtotal')}:</td>
                          <td className="px-4 py-3 text-right">{totals.subtotal.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">{totals.tax.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-green-600 text-lg">{totals.total.toFixed(2)}</td>
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
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={saleItems.length === 0}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {t('createSale')} - {totals.total.toFixed(2)}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Collection Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedSale && (
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
                  {t('collectPayment')}
                </h2>
                <button onClick={closePaymentModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">{t('saleNumber')}:</span>
                  <span className="font-semibold">{selectedSale.registrationNumber}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">{t('client')}:</span>
                  <span className="font-semibold">{selectedSale.client?.name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">{t('totalAmount')}:</span>
                  <span className="font-semibold">{Number(selectedSale.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">{t('paidAmount')}:</span>
                  <span className="font-semibold text-green-600">{Number(selectedSale.paidAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">{t('balanceDue')}:</span>
                  <span className="font-bold text-red-600">{Number(selectedSale.balanceAmount).toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handleCollectPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('paymentAmount')} *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={Number(selectedSale.balanceAmount)}
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('paymentMethod')} *</label>
                  <select
                    required
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Cash">{t('cash')}</option>
                    <option value="Paytm">Paytm</option>
                    <option value="Bank Transfer">{t('bankTransfer')}</option>
                    <option value="Card">Card</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closePaymentModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {t('collectPayment')} {paymentAmount.toFixed(2)}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Details Modal */}
      <AnimatePresence>
        {viewDetailsModal && selectedSale && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setViewDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Eye className="text-blue-600" />
                  Sale Details
                </h2>
                <button onClick={() => setViewDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Registration Number</label>
                    <p className="font-semibold">{selectedSale.registrationNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Date</label>
                    <p className="font-semibold">{new Date(selectedSale.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Client</label>
                    <p className="font-semibold">{selectedSale.client?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Client RNC</label>
                    <p className="font-semibold">{selectedSale.clientRnc || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">NCF</label>
                    <p className="font-semibold">{selectedSale.ncf || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Payment Type</label>
                    <p className="font-semibold">{selectedSale.paymentType}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Subtotal</label>
                    <p className="font-semibold">{Number(selectedSale.subtotal).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Tax</label>
                    <p className="font-semibold">{Number(selectedSale.tax).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Total</label>
                    <p className="font-semibold text-lg text-green-600">{Number(selectedSale.total).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <p>{getStatusBadge(selectedSale.paymentStatus)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setViewDetailsModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Products Modal */}
      <AnimatePresence>
        {viewProductsModal && selectedSale && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setViewProductsModal(false)}
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
                  <Package className="text-green-600" />
                  Product Details - {selectedSale.registrationNumber}
                </h2>
                <button onClick={() => setViewProductsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Code</th>
                      <th className="px-3 py-2 text-left font-semibold">Product</th>
                      <th className="px-3 py-2 text-left font-semibold">Unit</th>
                      <th className="px-3 py-2 text-right font-semibold">Qty</th>
                      <th className="px-3 py-2 text-right font-semibold">Sale Price</th>
                      <th className="px-3 py-2 text-right font-semibold">Subtotal</th>
                      <th className="px-3 py-2 text-right font-semibold">Tax</th>
                      <th className="px-3 py-2 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.items && selectedSale.items.length > 0 ? (
                      selectedSale.items.map((item: any, index: number) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{item.productCode}</td>
                          <td className="px-3 py-2">{item.productName}</td>
                          <td className="px-3 py-2">{item.unitOfMeasurement}</td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">{Number(item.unitPrice).toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">{Number(item.subtotal).toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">{Number(item.tax).toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-semibold">{Number(item.total).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t">
                        <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                          No products found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setViewProductsModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sales;
