import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, CheckCircle, Clock, XCircle, X, Trash2, ShoppingCart, Package, FileText } from 'lucide-react';
import api from '../api/axios';
import { Purchase, AssociatedInvoice } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber } from '../utils/formatNumber';
import { cleanFormData } from '../utils/cleanFormData';  // Import utility
import { useSearch } from '../hooks/useSearch';
import { useForm } from '../hooks/useForm';
import { useModal } from '../hooks/useModal';
import SearchBar from '../components/common/SearchBar';
import ActionButton from '../components/common/ActionButton';
import DataTable, { Column } from '../components/common/DataTable';
import FormField from '../components/common/FormField';
import Modal from '../components/common/Modal';

// ✅ Import shared components for Phase 1 refactoring
import { SupplierSelector, BankAccountSelector, CardSelector } from '../components/shared';

// ✅ React Query Integration - Better data management
import { 
  usePurchases, 
  useCreatePurchase
} from '../hooks/queries/usePurchases';
import { useProducts } from '../hooks/queries/useProducts';
import { useBankAccounts, useSuppliers, useCards } from '../hooks/queries/useSharedData';
import { notify } from '../utils/notifications';

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

interface EnhancedPurchase {
  id: number;
  registrationNumber?: string;
  supplierId: string | number;
  supplierRnc?: string;
  ncf?: string;
  date: string;
  purchaseType?: string;
  paymentType?: string;
  total?: number;
  paidAmount?: number;
  balanceAmount?: number;
  status?: string;
  deletion_status?: string;
  deleted_at?: string;
  deleted_by?: number;
  deletion_reason_code?: string;
  deletion_memo?: string;
  is_reversal?: boolean;
  original_transaction_id?: number;
  supplier?: {
    name: string;
  };
  productTotal?: number;
  additionalExpenses?: number;
  paymentStatus?: string;
}

const Purchases = () => {
  const { t } = useLanguage();
  
  // ✅ Use the same search pattern as Products component
  const { searchTerm, setSearchTerm } = useSearch('purchases');
  
  // ✅ Modal management using useModal hook like Products
  const purchaseModal = useModal<Purchase>();
  const productModal = useModal();
  const invoiceModal = useModal();
  
  // ✅ React Query Integration - Better data management
  const { data: purchases = [], isLoading: purchasesLoading } = usePurchases();
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();
  const { data: bankAccounts = [] } = useBankAccounts();
  const { data: cards = [] } = useCards();
  const createPurchaseMutation = useCreatePurchase();
  
  
  // ✅ NEW: Filter state for deletion status
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  // Products (keep these as they're for the product selection modal)
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [unitOfMeasurement, setUnitOfMeasurement] = useState('');
  const [taxAmount, setTaxAmount] = useState(0);
  
  // Associated Invoices (keep these as they're for the invoice modal)
  const [associatedInvoices, setAssociatedInvoices] = useState<AssociatedInvoice[]>([]);
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

  // View Details Modals (keep these for the view modals)
  const [viewDetailsModal, setViewDetailsModal] = useState(false);
  const [viewProductsModal, setViewProductsModal] = useState(false);
  const [viewInvoicesModal, setViewInvoicesModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<EnhancedPurchase | null>(null);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // ✅ Memoized calculations - Immediate performance boost (after state variables)
  const memoizedCalculations = useMemo(() => {
    // Memoize filtered cards based on payment type
    const filteredDebitCards = cards.filter((card: any) => card.cardType === 'DEBIT');
    const filteredCreditCards = cards.filter((card: any) => card.cardType === 'CREDIT');
    const activeProducts = products.filter(p => p.status === 'ACTIVE');
    
    // Memoize purchase totals
    const productTotal = purchaseItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const associatedTotal = associatedInvoices.reduce((sum, inv) => 
      sum + (Number(inv.tax) || 0) + (Number(inv.taxAmount) || 0), 0
    );
    const grandTotal = productTotal + associatedTotal;
    
    // Memoize adjusted unit cost calculations
    const productSubtotal = purchaseItems.reduce((sum, i) => sum + (Number(i.subtotal) || 0), 0);
    const associatedCostsWithoutTax = associatedInvoices.reduce((sum, inv) => sum + (Number(inv.tax) || 0), 0);
    
    return {
      filteredDebitCards,
      filteredCreditCards,
      activeProducts,
      totals: { productTotal, associatedTotal, grandTotal },
      adjustmentFactors: { productSubtotal, associatedCostsWithoutTax }
    };
  }, [cards, products, purchaseItems, associatedInvoices]);

  // ✅ Use memoized totals instead of recalculating
  const totals = memoizedCalculations.totals;

  // ✅ Form validation function - FRONTEND: Only static field validation
  const validatePurchase = useCallback((values: any) => {
    const errors: any = {};
    
    // ✅ FRONTEND: Required field validations only
    if (!values.supplierId?.trim()) {
      errors.supplierId = 'Supplier is required';
    }
    
    if (!values.date?.trim()) {
      errors.date = 'Date is required';
    }
    
    if (!values.purchaseType?.trim()) {
      errors.purchaseType = 'Purchase type is required';
    }
    
    if (!values.paymentType?.trim()) {
      errors.paymentType = 'Payment type is required';
    }
    
    // ✅ FRONTEND: Payment method requirements validation (NO balance checks)
    if (values.paymentType === 'CHEQUE') {
      if (!values.bankAccountId?.trim()) {
        errors.bankAccountId = 'Bank account is required for cheque payments';
      }
      if (!values.chequeNumber?.trim()) {
        errors.chequeNumber = 'Cheque number is required';
      }
      if (!values.chequeDate?.trim()) {
        errors.chequeDate = 'Cheque date is required';
      }
    }
    
    if (values.paymentType === 'BANK_TRANSFER') {
      if (!values.bankAccountId?.trim()) {
        errors.bankAccountId = 'Bank account is required for transfers';
      }
      if (!values.transferNumber?.trim()) {
        errors.transferNumber = 'Transfer number is required';
      }
      if (!values.transferDate?.trim()) {
        errors.transferDate = 'Transfer date is required';
      }
    }
    
    if (values.paymentType === 'DEBIT_CARD' || values.paymentType === 'CREDIT_CARD') {
      if (!values.cardId?.trim()) {
        errors.cardId = 'Card selection is required';
      }
      if (!values.paymentReference?.trim()) {
        errors.paymentReference = 'Payment reference is required';
      }
      if (!values.voucherDate?.trim()) {
        errors.voucherDate = 'Voucher date is required';
      }
      
      // ❌ REMOVED: All balance validation - Backend handles with real-time data
      // Frontend should NOT validate balances using potentially stale cached data






          





      
      // Backend will validate credit limits and account balances with accurate, real-time data
    }
    
    return errors;
  }, [purchaseItems, associatedInvoices]); // ✅ CORRECTED: Only static dependencies, removed cards and totals

  // ✅ Form management using useForm hook like Products (after validation function)
  const purchaseForm = useForm({
    initialValues: {
      transactionType: 'GOODS',
      date: new Date().toISOString().split('T')[0],
      supplierId: '',
      supplierRnc: '',
      ncf: '',
      purchaseType: 'Merchandise for sale or consumption',
      paymentType: 'CREDIT',
      paidAmount: 0,
      status: 'COMPLETED',
      bankAccountId: '',
      cardId: '',
      chequeNumber: '',
      chequeDate: '',
      transferNumber: '',
      transferDate: '',
      paymentReference: '',
      voucherDate: '',
    },
    validate: validatePurchase,
    onSubmit: async (values) => {
      if (purchaseItems.length === 0) {
        alert('Please add at least one product for goods purchase');
        return;
      }
      
      // ✅ Use memoized totals instead of recalculating
      const paidAmount = values.paymentType === 'CREDIT' ? 0 : totals.grandTotal;
      
      const cleanedData = cleanFormData(
        {
          ...values,
          supplierRnc: values.supplierRnc || null,
          ncf: values.ncf || null,
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
            cardId: inv.cardId && inv.cardId !== '' ? parseInt(inv.cardId) : null,
            bankAccountId: inv.bankAccountId && inv.bankAccountId !== '' ? parseInt(inv.bankAccountId) : null,
          })),
          expenseDescription: null,
          expenseCategoryId: null,
          expenseTypeId: null,
        },
        ['supplierId', 'bankAccountId', 'cardId']
      );
      
      // ✅ FIXED: Proper error handling like old code - DON'T close modal until backend responds
      try {
        console.log('🚀 FRONTEND - Submitting purchase data:', cleanedData);
        
        // ✅ CRITICAL: Wait for backend response before closing modal (like old code)
        await createPurchaseMutation.mutateAsync(cleanedData as any);
        
        // ✅ Only close modal and reset form AFTER successful backend response
        purchaseModal.close();
        purchaseForm.reset();
        setPurchaseItems([]);
        setAssociatedInvoices([]);
        
        // ✅ Success notification
        notify.success('Purchase Created', 'Purchase has been created successfully');
        
      } catch (error: any) {
        console.error('Error creating purchase:', error);
        console.error('Error response:', error.response?.data);
        
        // ✅ CRITICAL: Handle backend errors with popup messages (like old code)
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.message || 
                           'Error creating purchase';
        
        // ✅ Show backend error in popup (like old alert in old code)
        notify.error('Purchase Creation Failed', errorMessage);
        
        // ✅ IMPORTANT: Keep modal open so user can fix the issue
        // Modal stays open, user can see the error and make corrections
      }
    }
  });

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
    invoiceModal.close();
  };

  const removeAssociatedInvoice = (index: number) => {
    setAssociatedInvoices(associatedInvoices.filter((_, i) => i !== index));
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
    productModal.close();
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

  // ✅ Memoized adjusted unit cost calculation with performance optimization
  const calculateAdjustedUnitCost = useCallback((item: PurchaseItem) => {
    const { adjustmentFactors } = memoizedCalculations;
    
    // If no associated costs, return original unit cost (early return optimization)
    if (adjustmentFactors.associatedCostsWithoutTax === 0 || adjustmentFactors.productSubtotal === 0) {
      return item.unitCost;
    }

    // Calculate this item's share of associated costs (without tax)
    const itemWeight = Number(item.subtotal) / adjustmentFactors.productSubtotal;
    const itemAssociatedCost = adjustmentFactors.associatedCostsWithoutTax * itemWeight;
    const adjustedSubtotal = Number(item.subtotal) + itemAssociatedCost;
    const adjustedUnitCost = item.quantity > 0 ? adjustedSubtotal / item.quantity : item.unitCost;
    
    return adjustedUnitCost;
  }, [memoizedCalculations]);

  // ✅ Memoized status badge function
  const getStatusBadge = useCallback((status: string) => {
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
  }, []);

  // ✅ Memoized view handlers for stable references
  const handleViewDetails = useCallback(async (purchase: EnhancedPurchase) => {
    setSelectedPurchase(purchase);
    setViewDetailsModal(true);
    await fetchPurchaseDetails(purchase.id);
  }, []);

  const handleViewProducts = useCallback(async (purchase: EnhancedPurchase) => {
    setSelectedPurchase(purchase);
    setViewProductsModal(true);
    await fetchPurchaseDetails(purchase.id);
  }, []);

  const handleViewInvoices = useCallback(async (purchase: EnhancedPurchase) => {
    setSelectedPurchase(purchase);
    setViewInvoicesModal(true);
    await fetchPurchaseDetails(purchase.id);
  }, []);

  // ✅ Memoized event handlers with useCallback for stable references
  const handleOpenModal = useCallback(() => {
    purchaseForm.reset();
    setPurchaseItems([]);
    setAssociatedInvoices([]);
    purchaseModal.open();
  }, [purchaseForm, purchaseModal]);

  const handleCloseModal = useCallback(() => {
    purchaseModal.close();
    purchaseForm.reset();
    setPurchaseItems([]);
    setAssociatedInvoices([]);
  }, [purchaseModal, purchaseForm]);

  // ✅ Memoized status badge function for stable references
  const getPurchaseStatusBadge = useCallback((purchase: EnhancedPurchase) => {
    if (purchase.deletion_status === 'EXECUTED') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
          🗑️ DELETED
        </span>
      );
    }
    
    if (purchase.is_reversal) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
          ↩️ REVERSAL
        </span>
      );
    }
    
    // Payment status badge
    const paymentStatus = purchase.paymentStatus || 'Unpaid';
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
        paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {paymentStatus}
      </span>
    );
  }, []);

  // ✅ Memoized DataTable columns for purchases
  const columns: Column<EnhancedPurchase>[] = useMemo(() => [
    {
      key: 'registrationNumber',
      label: t('registrationNumber'),
      render: (value, purchase) => (
        <div className="flex items-center gap-2">
          {purchase.deletion_status === 'EXECUTED' && <span className="text-red-500">🗑️</span>}
          {purchase.is_reversal && <span className="text-orange-500">↩️</span>}
          <span className={purchase.deletion_status === 'EXECUTED' ? 'line-through text-gray-500 font-medium' : 'font-medium'}>
            {value}
          </span>
        </div>
      )
    },
    {
      key: 'supplier.name',
      label: t('supplier'),
      render: (value) => value || 'N/A'
    },
    {
      key: 'supplierRnc',
      label: t('supplierRnc'),
      render: (value) => value || 'N/A'
    },
    {
      key: 'date',
      label: t('date'),
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'purchaseType',
      label: t('purchaseOf'),
      render: (value) => value || 'N/A'
    },
    {
      key: 'paymentType',
      label: t('paymentType'),
      render: (value) => value || 'N/A'
    },
    {
      key: 'total',
      label: t('total'),
      align: 'right',
      render: (value, purchase) => (
        <span className={purchase.deletion_status === 'EXECUTED' ? 'line-through text-gray-500 font-semibold' : 'font-semibold'}>
          {formatNumber(value)}
        </span>
      )
    },
    {
      key: 'paidAmount',
      label: t('paid'),
      align: 'right',
      className: 'text-green-600',
      render: (value, purchase) => (
        <span className={purchase.deletion_status === 'EXECUTED' ? 'line-through text-gray-500 font-semibold' : 'font-semibold'}>
          {formatNumber(value || 0)}
        </span>
      )
    },
    {
      key: 'balanceAmount',
      label: t('balance'),
      align: 'right',
      className: 'text-orange-600',
      render: (value, purchase) => (
        <span className={purchase.deletion_status === 'EXECUTED' ? 'line-through text-gray-500 font-semibold' : 'font-semibold'}>
          {formatNumber(value || 0)}
        </span>
      )
    },
    {
      key: 'id',
      label: t('status'),
      align: 'center',
      render: (_, purchase) => getPurchaseStatusBadge(purchase)
    }
  ], [t, getPurchaseStatusBadge]);

  // ✅ Memoized custom actions for DataTable
  const customActions = useCallback((purchase: EnhancedPurchase) => (
    <>
      <ActionButton
        onClick={() => handleViewDetails(purchase)}
        icon={Eye}
        variant="secondary"
        size="sm"
        className="p-2"
      >
        {t('purchaseDetails')}
      </ActionButton>
      <ActionButton
        onClick={() => handleViewProducts(purchase)}
        icon={Package}
        variant="secondary"
        size="sm"
        className="p-2 text-green-600 hover:bg-green-50"
      >
        {t('productDetails')}
      </ActionButton>
      <ActionButton
        onClick={() => handleViewInvoices(purchase)}
        icon={FileText}
        variant="secondary"
        size="sm"
        className="p-2 text-orange-600 hover:bg-orange-50"
      >
        {t('invoiceSuppliers')}
      </ActionButton>
    </>
  ), [handleViewDetails, handleViewProducts, handleViewInvoices, t]);

  // ✅ Memoized purchase filtering with performance optimizations
  const filteredPurchases = useMemo(() => {
    // Early return optimization - avoid filtering when no search
    if (!searchTerm.trim() && filterStatus === 'All') {
      return Array.isArray(purchases) ? purchases as EnhancedPurchase[] : [];
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return Array.isArray(purchases) ? (purchases as unknown as EnhancedPurchase[]).filter((purchase) => {
      // ✅ PERFORMANCE: Check search match first (most common operation)
      let matchesSearch = true;
      if (searchTerm.trim()) {
        // ✅ PERFORMANCE: Check most likely matches first (registration number, supplier name)
        matchesSearch = 
          (purchase.registrationNumber?.toLowerCase().includes(lowerSearchTerm) ?? false) ||
          (purchase.supplier?.name?.toLowerCase().includes(lowerSearchTerm) ?? false) ||
          (purchase.supplierRnc?.toLowerCase().includes(lowerSearchTerm) ?? false) ||
          (purchase.purchaseType?.toLowerCase().includes(lowerSearchTerm) ?? false) ||
          (purchase.paymentType?.toLowerCase().includes(lowerSearchTerm) ?? false) ||
          (purchase.ncf?.toLowerCase().includes(lowerSearchTerm) ?? false) ||
          // ✅ PERFORMANCE: Check numeric fields (convert to string only when needed)
          (purchase.total?.toString().includes(lowerSearchTerm) ?? false) ||
          (purchase.paidAmount?.toString().includes(lowerSearchTerm) ?? false) ||
          (purchase.balanceAmount?.toString().includes(lowerSearchTerm) ?? false);
      }
      
      // ✅ PERFORMANCE: Check status filter (simple comparison)
      const matchesStatus = filterStatus === 'All' || 
        (filterStatus === 'Active' && purchase.deletion_status !== 'EXECUTED' && !purchase.is_reversal) ||
        (filterStatus === 'Deleted' && purchase.deletion_status === 'EXECUTED') ||
        (filterStatus === 'Reversal' && purchase.is_reversal);
      
      return matchesSearch && matchesStatus;
    }) : [];
  }, [purchases, searchTerm, filterStatus]); // ✅ Dependency array ensures proper memoization

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 flex-1">
          {/* ✅ Use the same SearchBar component as Products */}
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t('search')}
            className="flex-1 max-w-md"
          />
          
          {/* ✅ NEW: Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Purchases</option>
            <option value="Active">Active Purchases</option>
            <option value="Deleted">🗑️ Deleted Purchases</option>
            <option value="Reversal">↩️ Reversal Entries</option>
          </select>
        </div>
        
        <ActionButton
          onClick={handleOpenModal}
          icon={Plus}
          className="ml-4"
        >
          {t('newPurchase')}
        </ActionButton>
      </div>

      {/* Purchases List */}
      <DataTable
        data={filteredPurchases}
        columns={columns}
        customActions={customActions}
        loading={purchasesLoading}
        emptyMessage="No purchases found"
        className="mb-6"
      />

      {/* Create Purchase Modal */}
      <Modal
        isOpen={purchaseModal.isOpen}
        onClose={handleCloseModal}
        title={`${t('createNewPurchase')} - Goods Only`}
        size="lg"
        maxHeight="95vh"
      >
        <form onSubmit={purchaseForm.handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-scroll px-6 py-4 space-y-6 max-h-[65vh] scrollbar-always">
            {/* Supplier Selection - Using Shared Component */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <SupplierSelector
                  value={purchaseForm.values.supplierId}
                  onChange={(value, supplier) => {
                    purchaseForm.setValue('supplierId', value);
                    purchaseForm.setValue('supplierRnc', supplier?.rnc || '');
                  }}
                  required
                  label={t('supplier')}
                  error={purchaseForm.errors.supplierId}
                />
              </div>
                  {purchaseForm.values.supplierRnc && (
                    <div className="col-span-2">
                      <FormField label={t('supplierRnc')}>
                        <input
                          type="text"
                          value={purchaseForm.values.supplierRnc}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                        />
                      </FormField>
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
                    <FormField label={t('date')} required error={purchaseForm.errors.date}>
                      <input
                        type="date"
                        required
                        value={purchaseForm.values.date}
                        onChange={(e) => purchaseForm.setValue('date', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </FormField>
                  </div>
                  <div>
                    <FormField label={t('ncf')}>
                      <input
                        type="text"
                        value={purchaseForm.values.ncf}
                        onChange={(e) => purchaseForm.setValue('ncf', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="NCF"
                      />
                    </FormField>
                  </div>
                  <div>
                    <FormField label={t('purchaseOf')} required error={purchaseForm.errors.purchaseType}>
                      <select
                        required
                        value={purchaseForm.values.purchaseType}
                        onChange={(e) => purchaseForm.setValue('purchaseType', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Merchandise for sale or consumption">{t('merchandiseForSale')}</option>
                        <option value="Goods for internal use (PPE)">{t('goodsForInternalUse')}</option>
                        <option value="Investments or capital goods">{t('investmentsOrCapitalGoods')}</option>
                      </select>
                    </FormField>
                    <p className="text-xs text-gray-500 mt-1">
                      💡 For services, utilities, or operational expenses, use Expense Management
                    </p>
                  </div>
                  <div>
                    <FormField label={t('paymentType')} required error={purchaseForm.errors.paymentType}>
                      <select
                        required
                        value={purchaseForm.values.paymentType}
                        onChange={(e) => purchaseForm.setValue('paymentType', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="CHEQUE">{t('cheque')}</option>
                        <option value="BANK_TRANSFER">{t('bankTransfer')}</option>
                        <option value="DEBIT_CARD">Debit Card</option>
                        <option value="CREDIT_CARD">{t('creditCard')}</option>
                        <option value="CREDIT">{t('credit')}</option>
                      </select>
                    </FormField>
                  </div>
                  
                  {/* Phase 2: Conditional Payment Fields */}
                  {purchaseForm.values.paymentType === 'CHEQUE' && (
                    <>
                      <div className="col-span-2">
                        <BankAccountSelector
                          value={purchaseForm.values.bankAccountId}
                          onChange={(value) => purchaseForm.setValue('bankAccountId', value)}
                          required
                          showBalance
                          label="Bank Account"
                        />
                      </div>
                      <div>
                        <FormField label="Cheque Number" required>
                          <input
                            type="text"
                            required
                            value={purchaseForm.values.chequeNumber}
                            onChange={(e) => purchaseForm.setValue('chequeNumber', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter cheque number"
                          />
                        </FormField>
                      </div>
                      <div>
                        <FormField label="Cheque Date" required>
                          <input
                            type="date"
                            required
                            value={purchaseForm.values.chequeDate}
                            onChange={(e) => purchaseForm.setValue('chequeDate', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </FormField>
                      </div>
                    </>
                  )}
                  
                  {purchaseForm.values.paymentType === 'BANK_TRANSFER' && (
                    <>
                      <div className="col-span-2">
                        <BankAccountSelector
                          value={purchaseForm.values.bankAccountId}
                          onChange={(value) => purchaseForm.setValue('bankAccountId', value)}
                          required
                          showBalance
                          label="Bank Account"
                        />
                      </div>
                      <div>
                        <FormField label="Transfer Number" required>
                          <input
                            type="text"
                            required
                            value={purchaseForm.values.transferNumber}
                            onChange={(e) => purchaseForm.setValue('transferNumber', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter transfer reference number"
                          />
                        </FormField>
                      </div>
                      <div>
                        <FormField label="Transfer Date" required>
                          <input
                            type="date"
                            required
                            value={purchaseForm.values.transferDate}
                            onChange={(e) => purchaseForm.setValue('transferDate', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </FormField>
                      </div>
                    </>
                  )}
                  
                  {/* ✅ Debit Card Selection for DEBIT_CARD - Using Shared Component */}
                  {purchaseForm.values.paymentType === 'DEBIT_CARD' && (
                    <>
                      <div className="col-span-2">
                        <CardSelector
                          value={purchaseForm.values.cardId}
                          onChange={(value) => purchaseForm.setValue('cardId', value)}
                          cardType="DEBIT"
                          required
                          label="Select Debit Card"
                          error={purchaseForm.errors.cardId}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          💳 DEBIT: Money deducted from bank account immediately (Bank Register)
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference/Voucher *</label>
                        <input
                          type="text"
                          required
                          value={purchaseForm.values.paymentReference}
                          onChange={(e) => purchaseForm.setValue('paymentReference', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter voucher/authorization number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Date *</label>
                        <input
                          type="date"
                          required
                          value={purchaseForm.values.voucherDate}
                          onChange={(e) => purchaseForm.setValue('voucherDate', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}
                  
                  {/* ✅ Credit Card Selection for CREDIT_CARD */}
                  {purchaseForm.values.paymentType === 'CREDIT_CARD' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Credit Card *</label>
                        <select
                          required
                          value={purchaseForm.values.cardId}
                          onChange={(e) => purchaseForm.setValue('cardId', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select credit card...</option>
                          {memoizedCalculations.filteredCreditCards.map((card: any) => {
                            const creditLimit = Number(card.creditLimit) || 0;
                            const usedCredit = Number(card.usedCredit) || 0;
                            const availableCredit = creditLimit - usedCredit;
                            
                            return (
                              <option 
                                key={card.id} 
                                value={card.id}
                              >
                                {card.cardName ? card.cardName : `${card.cardBrand || 'Credit Card'} ****${card.cardNumberLast4}`}
                                {` (Limit: $${creditLimit.toFixed(2)}, Available: $${availableCredit.toFixed(2)})`}
                              </option>
                            );
                          })}
                        </select>
                        {purchaseForm.errors.cardId && (
                          <p className="text-red-500 text-xs mt-1">{purchaseForm.errors.cardId}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          💳 CREDIT: Creates Accounts Payable - you pay card company later
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference/Voucher *</label>
                        <input
                          type="text"
                          required
                          value={purchaseForm.values.paymentReference}
                          onChange={(e) => purchaseForm.setValue('paymentReference', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter voucher/authorization number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Date *</label>
                        <input
                          type="date"
                          required
                          value={purchaseForm.values.voucherDate}
                          onChange={(e) => purchaseForm.setValue('voucherDate', e.target.value)}
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
                    onClick={() => productModal.open()}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Package size={20} />
                    {t('addProducts')}
                  </button>
                  <button
                    type="button"
                    onClick={() => invoiceModal.open()}
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

          </div>

          {/* Modal Footer */}
          <div className="flex gap-3 p-6 pt-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={
                purchaseItems.length === 0 || 
                createPurchaseMutation.isPending ||
                Object.keys(purchaseForm.errors).length > 0
              }
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {createPurchaseMutation.isPending ? t('creating') : 
               Object.keys(purchaseForm.errors).length > 0 ? 'Fix Errors to Continue' :
               `${t('createPurchase')} - ${formatNumber(totals.grandTotal)}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Product Modal */}
      <AnimatePresence>
        {productModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
            onClick={() => productModal.close()}
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
                <button onClick={() => productModal.close()} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {/* Add Product Form */}
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <div className="grid grid-cols-5 gap-3 mb-3">
                  <div className="col-span-5">
                    <FormField label={t('selectProduct')} required>
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
                        {memoizedCalculations.activeProducts.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.code} - {product.name} (Stock: {product.amount}, Unit Cost: {product.unitCost})
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>
                  <div>
                    <FormField label={t('unit')} required>
                      <input
                        type="text"
                        value={unitOfMeasurement}
                        onChange={(e) => setUnitOfMeasurement(e.target.value)}
                        placeholder="KG, LB, UNIT"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </FormField>
                  </div>
                  <div>
                    <FormField label={t('quantity')} required>
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
                    </FormField>
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
                  onClick={() => productModal.close()}
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
        {invoiceModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
            onClick={() => invoiceModal.close()}
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
                <button onClick={() => invoiceModal.close()} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {/* Add Invoice Form */}
              <div className="mb-6 p-4 bg-orange-50 rounded-lg">
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('supplier')} *</label>
                    <select
                      value={newAssociatedInvoice.supplierRnc ? suppliers.find((s: any) => s.rnc === newAssociatedInvoice.supplierRnc)?.id || '' : ''}
                      onChange={(e) => {
                        const supplier = suppliers.find((s: any) => s.id === parseInt(e.target.value));
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
                      {suppliers.map((supplier: any) => (
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
                  onClick={() => invoiceModal.close()}
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
                    <p>{getStatusBadge(selectedPurchase.paymentStatus || 'Unpaid')}</p>
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
