import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Eye, CheckCircle, Clock, XCircle, X, Trash2, ShoppingCart, Package, FileText } from 'lucide-react';
import api from '../api/axios';
import { Purchase, Supplier, Product, AssociatedInvoice } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber } from '../utils/formatNumber';

interface PurchaseItem {
  productId: number;
  productCode: string;
  productName: string;
  unitOfMeasurement: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  tax: number;
  total: number;
  adjustedUnitCost: number;
  adjustedTotal: number;
}

const Purchases = () => {
  const { t } = useLanguage();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Main modal
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    supplierRnc: '',
    ncf: '',
    purchaseType: 'Merchandise for sale or consumption',
    paymentType: 'CASH',
    paidAmount: 0,
    status: 'COMPLETED',
  });
  
  // Products
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [unitOfMeasurement, setUnitOfMeasurement] = useState('');
  const [taxAmount, setTaxAmount] = useState(0);
  
  // Associated Invoices
  const [associatedInvoices, setAssociatedInvoices] = useState<AssociatedInvoice[]>([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [newAssociatedInvoice, setNewAssociatedInvoice] = useState({
    supplierRnc: '',
    supplierName: '',
    concept: '',
    ncf: '',
    date: new Date().toISOString().split('T')[0],
    tax: 0,
    taxAmount: 0,
    amount: 0,
    purchaseType: '',
    paymentType: ''
  });

  // View Details Modals
  const [viewDetailsModal, setViewDetailsModal] = useState(false);
  const [viewProductsModal, setViewProductsModal] = useState(false);
  const [viewInvoicesModal, setViewInvoicesModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await api.get('/purchases');
      console.log("response",response);
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
    if (!selectedProduct || quantity <= 0 || unitCost <= 0) {
      alert('Please select a product and enter valid quantity and unit cost');
      return;
    }
    
    const product: any = products.find(p => p.id === parseInt(selectedProduct));
    if (!product) return;
    
    // Calculate based on user-entered values
    const subtotal = quantity * unitCost;
    const taxAmountToUse = taxAmount; // Use user-entered tax amount
    const total = subtotal + taxAmountToUse;
    
    const newItem: PurchaseItem = {
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      unitOfMeasurement: unitOfMeasurement || product.unit, // Use entered unit or product's unit
      quantity: quantity,
      unitCost: unitCost,
      subtotal: subtotal,
      tax: taxAmountToUse,
      total: total,
      adjustedUnitCost: unitCost,
      adjustedTotal: total,
    };
    
    setPurchaseItems([...purchaseItems, newItem]);
    setSelectedProduct('');
    setQuantity(1);
    setUnitCost(0);
    setUnitOfMeasurement('');
    setTaxAmount(0);
    setShowProductModal(false);
  };

  const removeItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: 'quantity' | 'unitCost' | 'tax' | 'unit', value: number | string) => {
    const updatedItems = [...purchaseItems];
    const item = updatedItems[index];
    
    if (field === 'quantity') {
      item.quantity = value as number;
    } else if (field === 'unitCost') {
      item.unitCost = value as number;
    } else if (field === 'tax') {
      item.tax = value as number;
    } else if (field === 'unit') {
      item.unitOfMeasurement = value as string;
    }
    
    // Recalculate subtotal and total
    item.subtotal = item.quantity * item.unitCost;
    // If tax field wasn't manually changed, keep the current tax
    if (field !== 'tax') {
      // Tax stays as is unless manually changed
    }
    item.total = item.subtotal + item.tax;
    item.adjustedUnitCost = item.unitCost;
    item.adjustedTotal = item.total;
    
    setPurchaseItems(updatedItems);
  };

  const addAssociatedInvoice = () => {
    if (!newAssociatedInvoice.supplierRnc || !newAssociatedInvoice.supplierName || !newAssociatedInvoice.tax) {
      alert('Please enter Supplier RNC, Supplier Name, and Tax Amount');
      return;
    }
    const totalAmount = newAssociatedInvoice.tax + newAssociatedInvoice.taxAmount;
    setAssociatedInvoices([...associatedInvoices, {...newAssociatedInvoice, amount: totalAmount}]);
    setNewAssociatedInvoice({
      supplierRnc: '', 
      supplierName: '', 
      concept: '', 
      ncf: '', 
      date: new Date().toISOString().split('T')[0], 
      tax: 0, 
      taxAmount: 0, 
      amount: 0, 
      purchaseType: '',
      paymentType: ''
    });
    setShowInvoiceModal(false);
  };

  const removeAssociatedInvoice = (index: number) => {
    setAssociatedInvoices(associatedInvoices.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const productTotal = purchaseItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const associatedTotal = associatedInvoices.reduce((sum, inv) => sum + (Number(inv.tax) || 0), 0); // Use tax field (base amount without tax)
    const grandTotal = productTotal + associatedTotal + associatedInvoices.reduce((sum, inv) => sum + (Number(inv.taxAmount) || 0), 0); // Add taxAmount (the actual tax)
    return { productTotal, associatedTotal, grandTotal };
  };

  // Calculate adjusted unit cost with associated costs
  const calculateAdjustedUnitCost = (item: PurchaseItem) => {
    const productSubtotal = purchaseItems.reduce((sum, i) => sum + (Number(i.subtotal) || 0), 0);
    const associatedCostsWithoutTax = associatedInvoices.reduce((sum, inv) => sum + (Number(inv.tax) || 0), 0); // Use tax field (base amount)
    
    // If no associated costs, return original unit cost
    if (associatedCostsWithoutTax === 0 || productSubtotal === 0) {
      return item.unitCost;
    }

    // Calculate this item's share of associated costs (without tax)
    const itemWeight = Number(item.subtotal) / productSubtotal;
    const itemAssociatedCost = associatedCostsWithoutTax * itemWeight;
    const adjustedSubtotal = Number(item.subtotal) + itemAssociatedCost;
    const adjustedUnitCost = item.quantity > 0 ? adjustedSubtotal / item.quantity : item.unitCost;
    
    return adjustedUnitCost;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    if (purchaseItems.length === 0) {
      alert('Please add at least one product');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const totals = calculateTotals();
      const paidAmount = formData.paymentType === 'CREDIT' ? 0 : totals.grandTotal;
      
      await api.post('/purchases', {
        ...formData,
        supplierId: parseInt(formData.supplierId),
        supplierRnc: formData.supplierRnc,
        ncf: formData.ncf,
        purchaseType: formData.purchaseType,
        productTotal: totals.productTotal,
        additionalExpenses: totals.associatedTotal,
        total: totals.grandTotal,
        paidAmount: paidAmount,
        balanceAmount: totals.grandTotal - paidAmount,
        items: purchaseItems,
        associatedInvoices: associatedInvoices,
      });
      fetchPurchases();
      closeModal();
    } catch (error: any) {
      console.error('Error creating purchase:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.error || 'Error creating purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      supplierId: '',
      supplierRnc: '',
      ncf: '',
      purchaseType: 'Merchandise for sale or consumption',
      paymentType: 'CASH',
      paidAmount: 0,
      status: 'COMPLETED',
    });
    setPurchaseItems([]);
    setAssociatedInvoices([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setPurchaseItems([]);
    setAssociatedInvoices([]);
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
          {t('newPurchase')}
        </motion.button>
      </div>

      {/* Purchases List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg overflow-x-auto"
      >
        <table className="w-full min-w-max">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('registrationNumber').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('supplier').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('supplierRnc').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('date').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('purchaseOf').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('paymentType').toUpperCase()}</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">{t('total').toUpperCase()}</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">PAID</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">BALANCE</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">STATUS</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">{t('actions').toUpperCase()}</th>
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
                <td className="px-6 py-4 text-sm">{purchase.supplier?.name || 'N/A'}</td>
                <td className="px-6 py-4 text-sm">{purchase.supplierRnc || 'N/A'}</td>
                <td className="px-6 py-4 text-sm">{new Date(purchase.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm">{purchase.purchaseType || 'N/A'}</td>
                <td className="px-6 py-4 text-sm">{purchase.paymentType || 'N/A'}</td>
                <td className="px-6 py-4 text-sm font-semibold text-right">{formatNumber(purchase.total)}</td>
                <td className="px-6 py-4 text-sm font-semibold text-right text-green-600">{formatNumber(purchase.paidAmount || 0)}</td>
                <td className="px-6 py-4 text-sm font-semibold text-right text-orange-600">{formatNumber(purchase.balanceAmount || 0)}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    purchase.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                    purchase.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {purchase.paymentStatus || 'Unpaid'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setSelectedPurchase(purchase);
                        setViewDetailsModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Purchase Details"
                    >
                      <Eye size={18} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setSelectedPurchase(purchase);
                        setViewProductsModal(true);
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Product Details"
                    >
                      <Package size={18} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setSelectedPurchase(purchase);
                        setViewInvoicesModal(true);
                      }}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                      title="Invoice Suppliers"
                    >
                      <FileText size={18} />
                    </motion.button>
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
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingCart className="text-blue-600" />
                  Create New Purchase
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Supplier Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('supplier')} *</label>
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
                      <option value="">{t('selectSupplier')}</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formData.supplierRnc && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('supplierRnc')}</label>
                      <input
                        type="text"
                        value={formData.supplierRnc}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')} *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('ncf')}</label>
                    <input
                      type="text"
                      value={formData.ncf}
                      onChange={(e) => setFormData({ ...formData, ncf: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="NCF"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('purchaseOf')} *</label>
                    <select
                      required
                      value={formData.purchaseType}
                      onChange={(e) => setFormData({ ...formData, purchaseType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Merchandise for sale or consumption">{t('merchandiseForSale')}</option>
                      <option value="Goods for internal use (PPE)">Goods for internal use (PPE)</option>
                      <option value="Investments or capital goods">Investments or capital goods</option>
                      <option value="Services or other">Services or other</option>
                      <option value="Prepaid expenses">{t('prepaidExpenses')}</option>
                      <option value="Policies and guarantee">Policies and guarantee</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('paymentType')} *</label>
                    <select
                      required
                      value={formData.paymentType}
                      onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CASH">{t('cash')}</option>
                      <option value="BANK_TRANSFER">{t('bankTransfer')}</option>
                      <option value="DEPOSIT">Deposit</option>
                      <option value="CREDIT_CARD">{t('creditCard')}</option>
                      <option value="CREDIT">{t('credit')}</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(true)}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Package size={20} />
                    {t('addProducts')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInvoiceModal(true)}
                    className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2"
                  >
                    <FileText size={20} />
                    Add Invoices
                  </button>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Products Added:</span>
                    <span className="font-semibold">{purchaseItems.length} items</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Associated Invoices:</span>
                    <span className="font-semibold">{associatedInvoices.length} invoices</span>
                  </div>
                  <div className="border-t pt-2 mt-2"></div>
                  <div className="flex justify-between text-sm">
                    <span>Product Total:</span>
                    <span className="font-semibold">{formatNumber(totals.productTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Associated Costs:</span>
                    <span className="font-semibold">{formatNumber(totals.associatedTotal)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2"></div>
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">GRAND TOTAL:</span>
                    <span className="font-bold text-green-600">{formatNumber(totals.grandTotal)}</span>
                  </div>
                </div>

                {/* Submit Buttons */}
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
                    disabled={purchaseItems.length === 0 || isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating...' : `Create Purchase - ${formatNumber(totals.grandTotal)}`}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowProductModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Package className="text-green-600" />
                  Add Products
                </h2>
                <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {/* Add Product Form */}
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <div className="grid grid-cols-5 gap-3 mb-3">
                  <div className="col-span-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Product *</label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => {
                        setSelectedProduct(e.target.value);
                        const product = products.find(p => p.id === parseInt(e.target.value));
                        if (product) {
                          setUnitCost(Number(product.unitCost));
                          setUnitOfMeasurement(product.unit || '');
                          setTaxAmount(Number(product.taxRate) || 0);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select product...</option>
                      {products.filter(p => p.status === 'ACTIVE').map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.code} - {product.name} (Stock: {product.amount}, Unit Cost: {product.unitCost})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                    <input
                      type="text"
                      value={unitOfMeasurement}
                      onChange={(e) => setUnitOfMeasurement(e.target.value)}
                      placeholder="KG, LB, UNIT"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuantity(val === '' ? '' as any : parseInt(val) || 1);
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '' || parseInt(e.target.value) < 1) {
                          setQuantity(1);
                        }
                      }}
                      placeholder="Qty"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={unitCost}
                      onChange={(e) => {
                        const val = e.target.value;
                        setUnitCost(val === '' ? '' as any : parseFloat(val) || 0);
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '' || parseFloat(e.target.value) <= 0) {
                          setUnitCost(0.01);
                        }
                      }}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={taxAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTaxAmount(val === '' ? '' as any : parseFloat(val) || 0);
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '' || parseFloat(e.target.value) < 0) {
                          setTaxAmount(0);
                        }
                      }}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addProductToPurchase}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Add Product
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              {purchaseItems.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Code</th>
                        <th className="px-3 py-2 text-left font-semibold">Product</th>
                        <th className="px-3 py-2 text-left font-semibold">Unit</th>
                        <th className="px-3 py-2 text-right font-semibold">Qty</th>
                        <th className="px-3 py-2 text-right font-semibold">Unit Cost</th>
                        <th className="px-3 py-2 text-right font-semibold text-blue-600">Unit Cost with AI</th>
                        <th className="px-3 py-2 text-right font-semibold">Subtotal</th>
                        <th className="px-3 py-2 text-right font-semibold">Tax</th>
                        <th className="px-3 py-2 text-right font-semibold">Total</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseItems.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{item.productCode}</td>
                          <td className="px-3 py-2">{item.productName}</td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.unitOfMeasurement}
                              onChange={(e) => updateItem(index, 'unit', e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-green-500"
                              placeholder="UNIT"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={item.unitCost}
                              onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-blue-600 font-medium" title="Includes proportional share of associated costs">
                            {formatNumber(calculateAdjustedUnitCost(item))}
                          </td>
                          <td className="px-3 py-2 text-right">{formatNumber(item.subtotal)}</td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.tax}
                              onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-green-500"
                              title="Editable tax amount"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">{formatNumber(item.total)}</td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold">
                      <tr>
                        <td colSpan={8} className="px-3 py-2 text-right">Total:</td>
                        <td className="px-3 py-2 text-right text-green-600">{formatNumber(totals.productTotal)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Invoice Modal */}
      <AnimatePresence>
        {showInvoiceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowInvoiceModal(false)}
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
                  <FileText className="text-orange-600" />
                  Other Invoices Associated with this Purchase
                </h2>
                <button onClick={() => setShowInvoiceModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {/* Add Invoice Form */}
              <div className="mb-6 p-4 bg-orange-50 rounded-lg">
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier's RNC *</label>
                    <input
                      type="text"
                      value={newAssociatedInvoice.supplierRnc}
                      onChange={(e) => setNewAssociatedInvoice({...newAssociatedInvoice, supplierRnc: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="RNC"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                    <input
                      type="text"
                      value={newAssociatedInvoice.supplierName}
                      onChange={(e) => setNewAssociatedInvoice({...newAssociatedInvoice, supplierName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NCF</label>
                    <input
                      type="text"
                      value={newAssociatedInvoice.ncf}
                      onChange={(e) => setNewAssociatedInvoice({...newAssociatedInvoice, ncf: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="NCF"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={newAssociatedInvoice.date}
                      onChange={(e) => setNewAssociatedInvoice({...newAssociatedInvoice, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Concept</label>
                    <input
                      type="text"
                      value={newAssociatedInvoice.concept}
                      onChange={(e) => setNewAssociatedInvoice({...newAssociatedInvoice, concept: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Freight, Customs, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Amount (Base) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newAssociatedInvoice.tax || ''}
                      onChange={(e) => setNewAssociatedInvoice({...newAssociatedInvoice, tax: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newAssociatedInvoice.taxAmount || ''}
                      onChange={(e) => setNewAssociatedInvoice({...newAssociatedInvoice, taxAmount: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase of *</label>
                    <select
                      value={newAssociatedInvoice.purchaseType}
                      onChange={(e) => setNewAssociatedInvoice({...newAssociatedInvoice, purchaseType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Select type</option>
                      <option value="Merchandise for sale or consumption">Merchandise for sale or consumption</option>
                      <option value="Goods for internal use (PPE)">Goods for internal use (PPE)</option>
                      <option value="Investments or capital goods">Investments or capital goods</option>
                      <option value="Services or other">Services or other</option>
                      <option value="Prepaid expenses">Prepaid expenses</option>
                      <option value="Policies and guarantee">Policies and guarantee</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type *</label>
                    <select
                      value={newAssociatedInvoice.paymentType}
                      onChange={(e) => setNewAssociatedInvoice({...newAssociatedInvoice, paymentType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Select type</option>
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="DEPOSIT">Deposit</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="CREDIT">Credit</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={addAssociatedInvoice}
                    className="px-6 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    Add Invoice
                  </button>
                </div>
              </div>

              {/* Invoices Table */}
              {associatedInvoices.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-orange-100">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Supplier's RNC</th>
                        <th className="px-3 py-2 text-left font-semibold">Supplier Name</th>
                        <th className="px-3 py-2 text-left font-semibold">NCF</th>
                        <th className="px-3 py-2 text-left font-semibold">Date</th>
                        <th className="px-3 py-2 text-left font-semibold">Concept</th>
                        <th className="px-3 py-2 text-right font-semibold">Tax Amount</th>
                        <th className="px-3 py-2 text-right font-semibold">Tax</th>
                        <th className="px-3 py-2 text-right font-semibold">Amount</th>
                        <th className="px-3 py-2 text-left font-semibold">Purchase of</th>
                        <th className="px-3 py-2 text-left font-semibold">Payment Type</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {associatedInvoices.map((invoice, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{invoice.supplierRnc}</td>
                          <td className="px-3 py-2">{invoice.supplierName}</td>
                          <td className="px-3 py-2">{invoice.ncf || '-'}</td>
                          <td className="px-3 py-2">{new Date(invoice.date).toLocaleDateString()}</td>
                          <td className="px-3 py-2">{invoice.concept || '-'}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(invoice.tax)}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(invoice.taxAmount)}</td>
                          <td className="px-3 py-2 text-right font-semibold">{formatNumber(invoice.amount)}</td>
                          <td className="px-3 py-2">{invoice.purchaseType || '-'}</td>
                          <td className="px-3 py-2">{invoice.paymentType || '-'}</td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => removeAssociatedInvoice(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-orange-100 font-semibold">
                      <tr>
                        <td colSpan={5} className="px-3 py-2 text-right">Total</td>
                        <td className="px-3 py-2 text-right">
                          {formatNumber(associatedInvoices.reduce((sum, inv) => sum + inv.tax, 0))}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatNumber(associatedInvoices.reduce((sum, inv) => sum + inv.taxAmount, 0))}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatNumber(associatedInvoices.reduce((sum, inv) => sum + inv.amount, 0))}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Details Modal */}
      <AnimatePresence>
        {viewDetailsModal && selectedPurchase && (
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
                  Purchase Details
                </h2>
                <button onClick={() => setViewDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Registration Number</label>
                    <p className="font-semibold">{selectedPurchase.registrationNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Date</label>
                    <p className="font-semibold">{new Date(selectedPurchase.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Supplier</label>
                    <p className="font-semibold">{selectedPurchase.supplier?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Supplier RNC</label>
                    <p className="font-semibold">{selectedPurchase.supplierRnc || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">NCF</label>
                    <p className="font-semibold">{selectedPurchase.ncf || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Payment Type</label>
                    <p className="font-semibold">{selectedPurchase.paymentType}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Product Total</label>
                    <p className="font-semibold">{formatNumber(selectedPurchase.productTotal)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Additional Expenses</label>
                    <p className="font-semibold">{formatNumber(selectedPurchase.additionalExpenses)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Total</label>
                    <p className="font-semibold text-lg text-green-600">{formatNumber(selectedPurchase.total)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <p>{getStatusBadge(selectedPurchase.paymentStatus)}</p>
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
        {viewProductsModal && selectedPurchase && (
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
                  Product Details - {selectedPurchase.registrationNumber}
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
                      <th className="px-3 py-2 text-right font-semibold">Unit Cost</th>
                      <th className="px-3 py-2 text-right font-semibold text-blue-600">Unit Cost with AI</th>
                      <th className="px-3 py-2 text-right font-semibold">Subtotal</th>
                      <th className="px-3 py-2 text-right font-semibold">Tax</th>
                      <th className="px-3 py-2 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPurchase.items && selectedPurchase.items.length > 0 ? (
                      selectedPurchase.items.map((item: any, index: number) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{item.productCode}</td>
                          <td className="px-3 py-2">{item.productName}</td>
                          <td className="px-3 py-2">{item.unitOfMeasurement}</td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(item.unitCost)}</td>
                          <td className="px-3 py-2 text-right text-blue-600 font-medium" title="Adjusted unit cost with associated costs">
                            {formatNumber(item.adjustedUnitCost || item.unitCost)}
                          </td>
                          <td className="px-3 py-2 text-right">{formatNumber(item.subtotal)}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(item.tax)}</td>
                          <td className="px-3 py-2 text-right font-semibold">{formatNumber(item.total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t">
                        <td colSpan={9} className="px-3 py-4 text-center text-gray-500">
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

      {/* View Invoices Modal */}
      <AnimatePresence>
        {viewInvoicesModal && selectedPurchase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setViewInvoicesModal(false)}
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
                  <FileText className="text-orange-600" />
                  Invoice Suppliers - {selectedPurchase.registrationNumber}
                </h2>
                <button onClick={() => setViewInvoicesModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-orange-100">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Supplier's RNC</th>
                      <th className="px-3 py-2 text-left font-semibold">Supplier Name</th>
                      <th className="px-3 py-2 text-left font-semibold">NCF</th>
                      <th className="px-3 py-2 text-left font-semibold">Date</th>
                      <th className="px-3 py-2 text-left font-semibold">Concept</th>
                      <th className="px-3 py-2 text-right font-semibold">Tax Amount</th>
                      <th className="px-3 py-2 text-right font-semibold">Tax</th>
                      <th className="px-3 py-2 text-right font-semibold">Amount</th>
                      <th className="px-3 py-2 text-left font-semibold">Purchase of</th>
                      <th className="px-3 py-2 text-left font-semibold">Payment Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPurchase.associatedInvoices && selectedPurchase.associatedInvoices.length > 0 ? (
                      selectedPurchase.associatedInvoices.map((invoice: any, index: number) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{invoice.supplierRnc}</td>
                          <td className="px-3 py-2">{invoice.supplierName}</td>
                          <td className="px-3 py-2">{invoice.ncf || '-'}</td>
                          <td className="px-3 py-2">{new Date(invoice.date).toLocaleDateString()}</td>
                          <td className="px-3 py-2">{invoice.concept || '-'}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(invoice.tax)}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(invoice.taxAmount)}</td>
                          <td className="px-3 py-2 text-right font-semibold">{formatNumber(invoice.amount)}</td>
                          <td className="px-3 py-2">{invoice.purchaseType || '-'}</td>
                          <td className="px-3 py-2">{invoice.paymentType || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t">
                        <td colSpan={10} className="px-3 py-4 text-center text-gray-500">
                          No associated invoices found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setViewInvoicesModal(false)}
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

export default Purchases;
