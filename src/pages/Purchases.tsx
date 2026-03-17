import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Eye, CheckCircle, Clock, XCircle, X, Trash2, ShoppingCart, Package, FileText } from 'lucide-react';
import api from '../api/axios';
import { Purchase, Supplier, Product, AssociatedInvoice } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber } from '../utils/formatNumber';
import { cleanFormData } from '../utils/cleanFormData';  // Import utility

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
  
  // Phase 2: New master data
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  
  // Main modal
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    transactionType: 'GOODS', // New field for transaction type
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    supplierRnc: '',
    ncf: '',
    purchaseType: 'Merchandise for sale or consumption',
    paymentType: 'CREDIT', // Changed default from CASH to CREDIT
    paidAmount: 0,
    status: 'COMPLETED',
    // Phase 2: New payment fields
    bankAccountId: '',
    cardId: '',
    chequeNumber: '',
    chequeDate: '',
    transferNumber: '',
    transferDate: '',
    paymentReference: '',
    voucherDate: '',
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
    paymentType: '',
    cardId: '',
    bankAccountId: ''
  });

  // View Details Modals
  const [viewDetailsModal, setViewDetailsModal] = useState(false);
  const [viewProductsModal, setViewProductsModal] = useState(false);
  const [viewInvoicesModal, setViewInvoicesModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
    fetchProducts();
    fetchBankAccounts();
    fetchCards();
  }, []);

  const fetchPurchaseDetails = async (purchaseId: number) => {
    setLoadingDetails(true);
    try {
      const response = await api.get(`/purchases/${purchaseId}/details`);
      setPurchaseDetails(response.data);
    } catch (error) {
      console.error('Error fetching purchase details:', error);
      // Fallback to basic purchase data
      setPurchaseDetails(selectedPurchase);
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await api.get('/purchases', {
        params: {
          transaction_type: 'GOODS' // Only fetch GOODS transactions for Purchases page
        }
      });
      console.log("Purchases API response:", response.data);
      
      // Handle different response structures
      let purchasesData = [];
      if (Array.isArray(response.data)) {
        purchasesData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        purchasesData = response.data.data;
      } else if (response.data.purchases && Array.isArray(response.data.purchases)) {
        purchasesData = response.data.purchases;
      } else {
        console.warn('Unexpected purchases API response structure:', response.data);
        purchasesData = [];
      }
      
      setPurchases(purchasesData);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setPurchases([]); // Set empty array on error
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

  const fetchBankAccounts = async () => {
    try {
      const response = await api.get('/bank-accounts');
      setBankAccounts(response.data.filter((acc: any) => acc.status === 'ACTIVE'));
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const fetchCards = async () => {
    try {
      const response = await api.get('/cards');
      setCards(response.data.filter((card: any) => card.status === 'ACTIVE'));
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  };

  const addAssociatedInvoice = () => {
    if (!newAssociatedInvoice.supplierRnc || !newAssociatedInvoice.supplierName || !newAssociatedInvoice.tax) {
      alert('Please enter Supplier RNC, Supplier Name, and Tax Amount');
      return;
    }
    
    if (!newAssociatedInvoice.paymentType) {
      alert('Please select a payment type for the invoice');
      return;
    }
    
    // Validate card selection for card payment types
    if ((newAssociatedInvoice.paymentType === 'DEBIT_CARD' || newAssociatedInvoice.paymentType === 'CREDIT_CARD') && !newAssociatedInvoice.cardId) {
      alert('Please select a card for the selected payment type');
      return;
    }
    
    // Validate bank account selection for bank payment types
    if ((newAssociatedInvoice.paymentType === 'BANK_TRANSFER' || newAssociatedInvoice.paymentType === 'CHEQUE' || newAssociatedInvoice.paymentType === 'DEPOSIT') && !newAssociatedInvoice.bankAccountId) {
      alert('Please select a bank account for the selected payment type');
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
      paymentType: '',
      cardId: '',
      bankAccountId: ''
    });
    setShowInvoiceModal(false);
  };

  const removeAssociatedInvoice = (index: number) => {
    setAssociatedInvoices(associatedInvoices.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const productTotal = purchaseItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    // Include both base amount (tax field) and tax amount (taxAmount field) in associated costs
    const associatedTotal = associatedInvoices.reduce((sum, inv) => 
      sum + (Number(inv.tax) || 0) + (Number(inv.taxAmount) || 0), 0
    );
    const grandTotal = productTotal + associatedTotal;
    return { productTotal, associatedTotal, grandTotal };
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
    
    // Validate required fields
    if (!formData.supplierId) {
      alert('Please select a supplier');
      return;
    }
    
    if (!formData.date) {
      alert('Please select a date');
      return;
    }
    
    if (!formData.purchaseType) {
      alert('Please select a purchase type');
      return;
    }
    
    if (!formData.paymentType) {
      alert('Please select a payment type');
      return;
    }
    
    // Phase 2: Validate payment-specific fields
    const paymentType = formData.paymentType.toUpperCase();
    
    if (paymentType === 'CHEQUE') {
      if (!formData.bankAccountId) {
        alert('Please select a bank account for cheque payment');
        return;
      }
      if (!formData.chequeNumber) {
        alert('Please enter cheque number');
        return;
      }
      if (!formData.chequeDate) {
        alert('Please select cheque date');
        return;
      }
    }
    
    if (paymentType === 'BANK_TRANSFER') {
      if (!formData.bankAccountId) {
        alert('Please select a bank account for bank transfer');
        return;
      }
      if (!formData.transferNumber) {
        alert('Please enter transfer number');
        return;
      }
      if (!formData.transferDate) {
        alert('Please select transfer date');
        return;
      }
    }
    
    if (paymentType === 'CREDIT_CARD') {
      if (!formData.cardId) {
        alert('Please select a card');
        return;
      }
      if (!formData.paymentReference) {
        alert('Please enter payment reference/voucher number');
        return;
      }
      if (!formData.voucherDate) {
        alert('Please select voucher date');
        return;
      }
    }
    
    if (purchaseItems.length === 0) {
      alert('Please add at least one product for goods purchase');
      return;
    }
    
    // Validate associated invoices
    for (const invoice of associatedInvoices) {
      if ((invoice.paymentType === 'DEBIT_CARD' || invoice.paymentType === 'CREDIT_CARD') && !invoice.cardId) {
        alert(`Invoice "${invoice.concept || 'Associated cost'}" with ${invoice.paymentType} payment type requires a card to be selected`);
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      const totals = calculateTotals();
      const paidAmount = formData.paymentType === 'CREDIT' ? 0 : totals.grandTotal;
      
      // Use utility function to clean data
      const cleanedData = cleanFormData(
        {
          ...formData,
          supplierRnc: formData.supplierRnc || null,
          ncf: formData.ncf || null,
          productTotal: totals.productTotal,
          additionalExpenses: totals.associatedTotal,
          total: totals.grandTotal,
          paidAmount: paidAmount,
          balanceAmount: totals.grandTotal - paidAmount,
          items: purchaseItems,
          associatedInvoices: associatedInvoices.map(inv => ({
            ...inv,
            concept: inv.concept || 'Associated cost',
            ncf: inv.ncf || 'N/A',
            cardId: inv.cardId && inv.cardId !== '' ? parseInt(inv.cardId) : null, // Convert cardId to integer
            bankAccountId: inv.bankAccountId && inv.bankAccountId !== '' ? parseInt(inv.bankAccountId) : null, // Convert bankAccountId to integer
          })),
          // Expense-specific fields - set to null for GOODS purchases
          expenseDescription: null,
          expenseCategoryId: null,
          expenseTypeId: null,
        },
        ['supplierId', 'bankAccountId', 'cardId']  // Integer fields (removed expense fields since they should be null)
      );
      
      console.log('🚀 FRONTEND - Submitting purchase data:', cleanedData);
      console.log('🔍 Associated invoices being sent:', cleanedData.associatedInvoices);
      
      await api.post('/purchases', cleanedData);
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
      transactionType: 'GOODS',
      date: new Date().toISOString().split('T')[0],
      supplierId: '',
      supplierRnc: '',
      ncf: '',
      purchaseType: 'Merchandise for sale or consumption',
      paymentType: 'CREDIT', // Changed default from CASH
      paidAmount: 0,
      status: 'COMPLETED',
      // Phase 2: Reset new fields
      bankAccountId: '',
      cardId: '',
      chequeNumber: '',
      chequeDate: '',
      transferNumber: '',
      transferDate: '',
      paymentReference: '',
      voucherDate: '',
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

  const filteredPurchases = Array.isArray(purchases) ? purchases.filter((purchase) =>
    Object.values(purchase).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) : [];

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
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full min-w-max">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('registrationNumber').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('supplier').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('supplierRnc').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('date').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('purchaseOf').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('paymentType').toUpperCase()}</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">{t('total').toUpperCase()}</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">{t('paid').toUpperCase()}</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">{t('balance').toUpperCase()}</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">{t('status').toUpperCase()}</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">{t('actions').toUpperCase()}</th>
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
                      onClick={async () => {
                        setSelectedPurchase(purchase);
                        setViewDetailsModal(true);
                        await fetchPurchaseDetails(purchase.id);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title={t('purchaseDetails')}
                    >
                      <Eye size={18} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={async () => {
                        setSelectedPurchase(purchase);
                        setViewProductsModal(true);
                        await fetchPurchaseDetails(purchase.id);
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title={t('productDetails')}
                    >
                      <Package size={18} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={async () => {
                        setSelectedPurchase(purchase);
                        setViewInvoicesModal(true);
                        await fetchPurchaseDetails(purchase.id);
                      }}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                      title={t('invoiceSuppliers')}
                    >
                      <FileText size={18} />
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        </div>
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
                  {t('createNewPurchase')} - Goods Only
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
                  
                  {/* Transaction Type Selector - Only GOODS for Purchases page */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type *</label>
                    <div className="grid grid-cols-1 gap-3">
                      <div 
                        className="p-3 border-2 border-blue-500 bg-blue-50 rounded-lg cursor-default"
                      >
                        <div className="flex items-center space-x-2">
                          <ShoppingCart className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">
                            Goods Purchase
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Products for inventory</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 For expenses (services, utilities, etc.), use the Expense Management page
                    </p>
                  </div>

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
                      <option value="Goods for internal use (PPE)">{t('goodsForInternalUse')}</option>
                      <option value="Investments or capital goods">{t('investmentsOrCapitalGoods')}</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      💡 For services, utilities, or operational expenses, use Expense Management
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('paymentType')} *</label>
                    <select
                      required
                      value={formData.paymentType}
                      onChange={(e) => setFormData({ ...formData, paymentType: e.target.value, cardId: '' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CHEQUE">{t('cheque')}</option>
                      <option value="BANK_TRANSFER">{t('bankTransfer')}</option>
                      <option value="DEBIT_CARD">Debit Card</option>
                      <option value="CREDIT_CARD">{t('creditCard')}</option>
                      <option value="CREDIT">{t('credit')}</option>
                    </select>
                  </div>
                  
                  {/* Phase 2: Conditional Payment Fields */}
                  {formData.paymentType === 'CHEQUE' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account *</label>
                        <select
                          required
                          value={formData.bankAccountId}
                          onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Bank Account</option>
                          {bankAccounts.map((account: any) => (
                            <option key={account.id} value={account.id}>
                              {account.bankName} - {account.accountNumber} ({account.accountType}) - Balance: {formatNumber(account.balance)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Number *</label>
                        <input
                          type="text"
                          required
                          value={formData.chequeNumber}
                          onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter cheque number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Date *</label>
                        <input
                          type="date"
                          required
                          value={formData.chequeDate}
                          onChange={(e) => setFormData({ ...formData, chequeDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}
                  
                  {formData.paymentType === 'BANK_TRANSFER' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account *</label>
                        <select
                          required
                          value={formData.bankAccountId}
                          onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Bank Account</option>
                          {bankAccounts.map((account: any) => (
                            <option key={account.id} value={account.id}>
                              {account.bankName} - {account.accountNumber} ({account.accountType}) - Balance: {formatNumber(account.balance)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Number *</label>
                        <input
                          type="text"
                          required
                          value={formData.transferNumber}
                          onChange={(e) => setFormData({ ...formData, transferNumber: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter transfer reference number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Date *</label>
                        <input
                          type="date"
                          required
                          value={formData.transferDate}
                          onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}
                  
                  {/* ✅ Debit Card Selection for DEBIT_CARD */}
                  {formData.paymentType === 'DEBIT_CARD' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Debit Card *</label>
                        <select
                          required
                          value={formData.cardId}
                          onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select debit card...</option>
                        {cards.filter((card: any) => card.cardType === 'DEBIT').map((card: any) => (
                            <option key={card.id} value={card.id}>
                              {card.cardName ? card.cardName : `${card.cardBrand || 'Debit Card'} ****${card.cardNumberLast4}`}
                              {card.BankAccount && ` - ${card.BankAccount.bankName} (Balance: $${Number(card.BankAccount.balance).toFixed(2)})`}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          💳 DEBIT: Money deducted from bank account immediately (Bank Register)
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference/Voucher *</label>
                        <input
                          type="text"
                          required
                          value={formData.paymentReference}
                          onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter voucher/authorization number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Date *</label>
                        <input
                          type="date"
                          required
                          value={formData.voucherDate}
                          onChange={(e) => setFormData({ ...formData, voucherDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}
                  
                  {/* ✅ Credit Card Selection for CREDIT_CARD */}
                  {formData.paymentType === 'CREDIT_CARD' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Credit Card *</label>
                        <select
                          required
                          value={formData.cardId}
                          onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select credit card...</option>
                          {cards.filter((card: any) => card.cardType === 'CREDIT').map((card: any) => (
                            <option key={card.id} value={card.id}>
                              {card.cardName ? card.cardName : `${card.cardBrand || 'Credit Card'} ****${card.cardNumberLast4}`}
                              {card.creditLimit && ` (Limit: $${Number(card.creditLimit).toFixed(2)}, Available: $${(Number(card.creditLimit) - Number(card.usedCredit || 0)).toFixed(2)})`}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          💳 CREDIT: Creates Accounts Payable - you pay card company later
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference/Voucher *</label>
                        <input
                          type="text"
                          required
                          value={formData.paymentReference}
                          onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter voucher/authorization number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Date *</label>
                        <input
                          type="date"
                          required
                          value={formData.voucherDate}
                          onChange={(e) => setFormData({ ...formData, voucherDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}
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
                    {t('addInvoice')}
                  </button>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('productsAdded')}:</span>
                    <span className="font-semibold">{purchaseItems.length} {t('items')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('associatedInvoicesCount')}:</span>
                    <span className="font-semibold">{associatedInvoices.length} {t('invoices')}</span>
                  </div>
                  <div className="border-t pt-2 mt-2"></div>
                  <div className="flex justify-between text-sm">
                    <span>{t('productTotal')}:</span>
                    <span className="font-semibold">{formatNumber(totals.productTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('associatedCosts')}:</span>
                    <span className="font-semibold">{formatNumber(totals.associatedTotal)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2"></div>
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">{t('grandTotal')}:</span>
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
                    {isSubmitting ? t('creating') : `${t('createPurchase')} - ${formatNumber(totals.grandTotal)}`}
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
                  {t('addProducts')}
                </h2>
                <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {/* Add Product Form */}
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <div className="grid grid-cols-5 gap-3 mb-3">
                  <div className="col-span-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('selectProduct')} *</label>
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
                      <option value="">{t('selectProduct')}</option>
                      {products.filter(p => p.status === 'ACTIVE').map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.code} - {product.name} (Stock: {product.amount}, Unit Cost: {product.unitCost})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('unit')} *</label>
                    <input
                      type="text"
                      value={unitOfMeasurement}
                      onChange={(e) => setUnitOfMeasurement(e.target.value)}
                      placeholder="KG, LB, UNIT"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('quantity')} *</label>
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
                      placeholder={t('qty')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('unitCost')} *</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('tax')} *</label>
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
                      {t('addProduct')}
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
                        <th className="px-3 py-2 text-left font-semibold">{t('code')}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t('product')}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t('unit')}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t('qty')}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t('unitCost')}</th>
                        <th className="px-3 py-2 text-right font-semibold text-blue-600">{t('unitCostWithAI')}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t('subtotal')}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t('tax')}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t('total')}</th>
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
                          <td className="px-3 py-2 text-right text-blue-600 font-medium" title={t('includesProportionalShare')}>
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
                              title={t('editableTaxAmount')}
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">{formatNumber(item.total)}</td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded"
                              title={t('delete')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold">
                      <tr>
                        <td colSpan={8} className="px-3 py-2 text-right">{t('total')}:</td>
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
                  {t('done')}
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
                  {t('otherInvoicesAssociated')}
                </h2>
                <button onClick={() => setShowInvoiceModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {/* Add Invoice Form */}
              <div className="mb-6 p-4 bg-orange-50 rounded-lg">
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('supplier')} *</label>
                    <select
                      value={newAssociatedInvoice.supplierRnc ? suppliers.find(s => s.rnc === newAssociatedInvoice.supplierRnc)?.id || '' : ''}
                      onChange={(e) => {
                        const supplier = suppliers.find(s => s.id === parseInt(e.target.value));
                        if (supplier) {
                          setNewAssociatedInvoice({
                            ...newAssociatedInvoice, 
                            supplierRnc: supplier.rnc || '',
                            supplierName: supplier.name || ''
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">{t('selectSupplier')}</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('supplierRncShort')}</label>
                    <input
                      type="text"
                      value={newAssociatedInvoice.supplierRnc}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                      placeholder="RNC"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('ncf')}</label>
                    <input
                      type="text"
                      value={newAssociatedInvoice.ncf}
                      onChange={(e) => setNewAssociatedInvoice({...newAssociatedInvoice, ncf: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="NCF"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('concept')}</label>
                    <input
                      type="text"
                      value={newAssociatedInvoice.concept}
                      onChange={(e) => setNewAssociatedInvoice({...newAssociatedInvoice, concept: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder={t('freight') + ', ' + t('customs') + ', etc.'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('taxAmountBase')} *</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('tax')}</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('purchaseOf')} *</label>
                    <select
                      value={newAssociatedInvoice.purchaseType}
                      onChange={(e) => setNewAssociatedInvoice({...newAssociatedInvoice, purchaseType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="">{t('selectType')}</option>
                      <option value="Merchandise for sale or consumption">{t('merchandiseForSale')}</option>
                      <option value="Goods for internal use (PPE)">{t('goodsForInternalUse')}</option>
                      <option value="Investments or capital goods">{t('investmentsOrCapitalGoods')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('paymentType')} *</label>
                    <select
                      value={newAssociatedInvoice.paymentType}
                      onChange={(e) => setNewAssociatedInvoice({...newAssociatedInvoice, paymentType: e.target.value, cardId: '', bankAccountId: ''})}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="">{t('selectType')}</option>
                      {/* <option value="CASH">{t('cash')}</option> */}
                      <option value="CHEQUE">{t('cheque')}</option>
                      <option value="BANK_TRANSFER">{t('bankTransfer')}</option>
                      {/* <option value="DEPOSIT">{t('deposit')}</option> */}
                      <option value="DEBIT_CARD">Debit Card</option>
                      <option value="CREDIT_CARD">{t('creditCard')}</option>
                      <option value="CREDIT">{t('credit')}</option>
                    </select>
                  </div>
                </div>

                {/* Card Selection for Invoice Payment Types */}
                {(newAssociatedInvoice.paymentType === 'DEBIT_CARD' || newAssociatedInvoice.paymentType === 'CREDIT_CARD') && (
                  <div className="grid grid-cols-1 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {newAssociatedInvoice.paymentType === 'DEBIT_CARD' ? 'Select Debit Card *' : 'Select Credit Card *'}
                      </label>
                      <select
                        required
                        value={newAssociatedInvoice.cardId}
                        onChange={(e) => setNewAssociatedInvoice({...newAssociatedInvoice, cardId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">
                          {newAssociatedInvoice.paymentType === 'DEBIT_CARD' ? 'Select debit card...' : 'Select credit card...'}
                        </option>
                        {cards
                          .filter((card: any) => card.cardType === (newAssociatedInvoice.paymentType === 'DEBIT_CARD' ? 'DEBIT' : 'CREDIT'))
                          .map((card: any) => (
                            <option key={card.id} value={card.id}>
                              {card.cardName ? card.cardName : `${card.cardBrand || (newAssociatedInvoice.paymentType === 'DEBIT_CARD' ? 'Debit Card' : 'Credit Card')} ****${card.cardNumberLast4}`}
                              {newAssociatedInvoice.paymentType === 'DEBIT_CARD' && card.BankAccount && 
                                ` - ${card.BankAccount.bankName} (Balance: $${Number(card.BankAccount.balance).toFixed(2)})`}
                              {newAssociatedInvoice.paymentType === 'CREDIT_CARD' && card.creditLimit && 
                                ` (Limit: $${Number(card.creditLimit).toFixed(2)}, Available: $${(Number(card.creditLimit) - Number(card.usedCredit || 0)).toFixed(2)})`}
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {newAssociatedInvoice.paymentType === 'DEBIT_CARD' 
                          ? '💳 DEBIT: Money deducted from bank account immediately' 
                          : '💳 CREDIT: Creates Accounts Payable - you pay card company later'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Bank Account Selection for Invoice Payment Types */}
                {(newAssociatedInvoice.paymentType === 'BANK_TRANSFER' || newAssociatedInvoice.paymentType === 'CHEQUE' || newAssociatedInvoice.paymentType === 'DEPOSIT') && (
                  <div className="grid grid-cols-1 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Bank Account *
                      </label>
                      <select
                        required
                        value={newAssociatedInvoice.bankAccountId || ''}
                        onChange={(e) => setNewAssociatedInvoice({...newAssociatedInvoice, bankAccountId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Select bank account...</option>
                        {bankAccounts.map((account: any) => (
                          <option key={account.id} value={account.id}>
                            {account.bankName} - {account.accountNumber} ({account.accountType}) - Balance: $${Number(account.balance).toFixed(2)}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        💰 {newAssociatedInvoice.paymentType}: Money deducted from selected bank account
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={addAssociatedInvoice}
                    className="px-6 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    {t('addInvoice')}
                  </button>
                </div>
              </div>

              {/* Invoices Table */}
              {associatedInvoices.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-orange-100">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">{t('supplierRncShort')}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t('supplierName')}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t('ncf')}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t('date')}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t('concept')}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t('taxAmountBase')}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t('tax')}</th>
                        <th className="px-3 py-2 text-right font-semibold">{t('totalAmount')}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t('purchaseOf')}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t('paymentType')}</th>
                        <th className="px-3 py-2 text-left font-semibold">Card</th>
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
                            {invoice.cardId ? (
                              (() => {
                                const card = cards.find((c: any) => c.id === parseInt(invoice.cardId || '0'));
                                return card ? (card.cardName ? card.cardName : `${card.cardBrand || 'Card'} ****${card.cardNumberLast4}`) : 'Card not found';
                              })()
                            ) : '-'}
                          </td>
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
                        <td colSpan={5} className="px-3 py-2 text-right">{t('total')}</td>
                        <td className="px-3 py-2 text-right">
                          {formatNumber(associatedInvoices.reduce((sum, inv) => sum + inv.tax, 0))}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatNumber(associatedInvoices.reduce((sum, inv) => sum + inv.taxAmount, 0))}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatNumber(associatedInvoices.reduce((sum, inv) => sum + inv.amount, 0))}
                        </td>
                        <td colSpan={3}></td>
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
                  {t('done')}
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
                  {t('purchaseDetails')}
                </h2>
                <button onClick={() => setViewDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">{t('registrationNumber')}</label>
                    <p className="font-semibold">{selectedPurchase.registrationNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">{t('date')}</label>
                    <p className="font-semibold">{new Date(selectedPurchase.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">{t('supplier')}</label>
                    <p className="font-semibold">{selectedPurchase.supplier?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">{t('supplierRnc')}</label>
                    <p className="font-semibold">{selectedPurchase.supplierRnc || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">{t('ncf')}</label>
                    <p className="font-semibold">{selectedPurchase.ncf || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">{t('paymentType')}</label>
                    <p className="font-semibold">{selectedPurchase.paymentType}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">{t('productTotal')}</label>
                    <p className="font-semibold">{formatNumber(selectedPurchase.productTotal)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">{t('associatedCosts')}</label>
                    <p className="font-semibold">{formatNumber(selectedPurchase.additionalExpenses)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">{t('total')}</label>
                    <p className="font-semibold text-lg text-green-600">{formatNumber(selectedPurchase.total)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">{t('status')}</label>
                    <p>{getStatusBadge(selectedPurchase.paymentStatus)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setViewDetailsModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  {t('close')}
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
                  {t('productDetails')} - {selectedPurchase.registrationNumber}
                </h2>
                <button onClick={() => setViewProductsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">{t('code')}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t('product')}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t('unit')}</th>
                      <th className="px-3 py-2 text-right font-semibold">{t('qty')}</th>
                      <th className="px-3 py-2 text-right font-semibold">{t('unitCost')}</th>
                      <th className="px-3 py-2 text-right font-semibold text-blue-600">{t('unitCostWithAI')}</th>
                      <th className="px-3 py-2 text-right font-semibold">{t('subtotal')}</th>
                      <th className="px-3 py-2 text-right font-semibold">{t('tax')}</th>
                      <th className="px-3 py-2 text-right font-semibold">{t('total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingDetails ? (
                      <tr className="border-t">
                        <td colSpan={9} className="px-3 py-4 text-center text-gray-500">
                          Loading products...
                        </td>
                      </tr>
                    ) : purchaseDetails?.items && purchaseDetails.items.length > 0 ? (
                      purchaseDetails.items.map((item: any, index: number) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{item.productCode}</td>
                          <td className="px-3 py-2">{item.productName}</td>
                          <td className="px-3 py-2">{item.unitOfMeasurement}</td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(item.unitCost)}</td>
                          <td className="px-3 py-2 text-right text-blue-600 font-medium" title={t('adjustedUnitCostWithAssociatedCosts')}>
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
                          {t('noProductsFound')}
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
                  {t('close')}
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
                  {t('invoiceSuppliers')} - {selectedPurchase.registrationNumber}
                </h2>
                <button onClick={() => setViewInvoicesModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-orange-100">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">{t('supplierRncShort')}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t('supplierName')}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t('ncf')}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t('date')}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t('concept')}</th>
                      <th className="px-3 py-2 text-right font-semibold">{t('taxAmountBase')}</th>
                      <th className="px-3 py-2 text-right font-semibold">{t('tax')}</th>
                      <th className="px-3 py-2 text-right font-semibold">{t('totalAmount')}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t('purchaseOf')}</th>
                      <th className="px-3 py-2 text-left font-semibold">{t('paymentType')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingDetails ? (
                      <tr className="border-t">
                        <td colSpan={10} className="px-3 py-4 text-center text-gray-500">
                          Loading invoices...
                        </td>
                      </tr>
                    ) : purchaseDetails?.associatedInvoices && purchaseDetails.associatedInvoices.length > 0 ? (
                      purchaseDetails.associatedInvoices.map((invoice: any, index: number) => (
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
                          {t('noAssociatedInvoicesFound')}
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
                  {t('close')}
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
