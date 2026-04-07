import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Eye, CheckCircle, Clock, XCircle, Trash2, ShoppingCart, Package, CreditCard } from 'lucide-react';
import { Sale } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { notify } from '../utils/notifications';
import { formatNumber } from '../utils/formatNumber';
import CardPaymentModal from '../components/CardPaymentModal.tsx';

// ✅ Import pagination components
import { useForm } from '../hooks/useForm';
import { useModal } from '../hooks/useModal';
import { useTableData } from '../hooks/useTableData';
import SearchBar from '../components/common/SearchBar';
import ActionButton from '../components/common/ActionButton';
import DataTable, { Column } from '../components/common/DataTable';
import { Pagination } from '../components/common/Pagination';
import Modal from '../components/common/Modal';

// React Query hooks
import { useCreateSale } from '../hooks/queries/useSales';
import { useProducts } from '../hooks/queries/useProducts';
import { useClients, useBankAccounts, useCards, useCashRegisters, usePaymentNetworks } from '../hooks/queries/useSharedData';

interface SaleItem {
  id?: number;
  saleId?: number;
  productId: number;
  productCode?: string;
  productName: string;
  productAmount: number;
  quantity: number;
  productUnitCost: number;
  unitPrice: number;
  unitOfMeasurement?: string;
  subtotal: number;
  tax: number;
  total: number;
  costOfGoodsSold?: number;
  grossMargin?: number;
}

// ✅ NEW: Enhanced Sale interface with deletion tracking
interface EnhancedSale extends Omit<Sale, 'collectionStatus'> {
  deletion_status?: string;
  deleted_at?: string;
  deleted_by?: number;
  deletion_reason_code?: string;
  deletion_memo?: string;
  is_reversal?: boolean;
  original_transaction_id?: number;
  collectionStatus?: string;
}

const Sales = () => {
  const { t } = useLanguage();
  
  // ✅ NEW: Pagination with useTableData
  const {
    data: sales,
    pagination,
    loading: salesLoading,
    search,
    updateSearch,
    goToPage,
    changeLimit,
    refresh
  } = useTableData<EnhancedSale>({
    endpoint: 'api/sales',
    initialLimit: 50
  });
  
  // ✅ Modal management using useModal hook
  const salesModal = useModal<Sale>();
  const viewDetailsModal = useModal();
  const viewProductsModal = useModal();
  const cardPaymentModal = useModal();
  
  // ✅ Use React Query hooks for shared data
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: cards = [], isLoading: cardsLoading } = useCards();
  const { data: cashRegisters = [], isLoading: cashRegistersLoading } = useCashRegisters();
  const { data: bankAccounts = [], isLoading: bankAccountsLoading } = useBankAccounts();
  const { data: paymentNetworks = [], isLoading: paymentNetworksLoading } = usePaymentNetworks();
  
  // ✅ Use simple mutation
  const createSaleMutation = useCreateSale();
  
  // Loading state
  const isLoading = salesLoading || productsLoading || clientsLoading || cardsLoading || 
                   cashRegistersLoading || bankAccountsLoading || paymentNetworksLoading;
  
  // ✅ Filter state for deletion status
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  // ✅ LESSON LEARNED: Remove ALL old state variables, use only hooks
  // Products (keep these as they're for the product selection modal)
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [salesPrice, setSalesPrice] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [selectedSale, setSelectedSale] = useState<EnhancedSale | null>(null);

  // ✅ LESSON LEARNED: Static field validation only - NO dynamic validation
  const validateSales = useCallback((values: any) => {
    const errors: any = {};
    
    // ✅ FRONTEND: Required field validations only
    if (!values.clientId?.trim()) {
      errors.clientId = 'Client is required';
    }
    
    if (!values.date?.trim()) {
      errors.date = 'Date is required';
    }
    
    if (!values.saleType?.trim()) {
      errors.saleType = 'Sale type is required';
    }
    
    if (!values.paymentType?.trim()) {
      errors.paymentType = 'Payment type is required';
    }
    
    // ✅ FRONTEND: Payment method requirements validation (NO balance checks)
    if ((values.paymentType === 'CASH' || values.paymentType === 'CHEQUE') && !values.cashRegisterId?.trim()) {
      errors.cashRegisterId = 'Cash register is required for cash/cheque payments';
    }
    
    if ((values.paymentType === 'DEBIT_CARD' || values.paymentType === 'CREDIT_CARD') && !values.cardPaymentNetworkId?.trim()) {
      errors.cardPaymentNetworkId = 'Payment network is required for card payments';
    }
    
    if ((values.paymentType === 'BANK_TRANSFER' || values.paymentType === 'DEPOSIT') && !values.bankAccountId?.trim()) {
      errors.bankAccountId = 'Bank account is required for bank transfers/deposits';
    }
    
    // ❌ REMOVED: All balance validation - Backend handles with real-time data
    // Frontend should NOT validate balances using potentially stale cached data
    // Backend will validate cash register balances, card limits, and account balances with accurate, real-time data
    
    return errors;
  }, []); // ✅ CORRECTED: Only static dependencies

  // ✅ Form management using useForm hook like Products/Purchases
  const salesForm = useForm({
    initialValues: {
      documentNumber: `INV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      clientId: '',
      clientRnc: '',
      ncf: '',
      saleType: 'Merchandise for sale',
      paymentType: 'CASH',
      cashRegisterId: '',
      cardPaymentNetworkId: '',
      bankAccountId: '',
      paidAmount: 0,
      status: 'COMPLETED',
    },
    validate: validateSales,
    onSubmit: async (values) => {
      if (saleItems.length === 0) {
        notify.warning('No products', 'Please add at least one product to the sale');
        return;
      }
      
      // ✅ Use memoized totals instead of recalculating
      const paidAmount = values.paymentType === 'CREDIT' ? 0 : totals.total;
      
      const saleData = {
        ...values,
        clientId: parseInt(values.clientId),
        cashRegisterId: values.cashRegisterId ? parseInt(values.cashRegisterId) : undefined,
        cardPaymentNetworkId: values.cardPaymentNetworkId ? parseInt(values.cardPaymentNetworkId) : undefined,
        bankAccountId: values.bankAccountId ? parseInt(values.bankAccountId) : undefined,
        subtotal: totals.subtotal,
        tax: totals.tax,
        discount: 0,
        total: totals.total,
        paidAmount: paidAmount,
        balanceAmount: totals.total - paidAmount,
        clientRnc: values.clientRnc,
        ncf: values.ncf,
        saleType: values.saleType,
        items: saleItems.map((item) => ({
          ...item,
          id: 0, // Temporary ID for new items
          saleId: 0, // Will be set by backend
          productCode: products.find((p: any) => p.id === item.productId)?.code || '',
          unitOfMeasurement: products.find((p: any) => p.id === item.productId)?.unit || '',
          costOfGoodsSold: item.productUnitCost * item.quantity,
          grossMargin: (item.unitPrice - item.productUnitCost) * item.quantity,
        })),
      };
      
      // ✅ FIXED: Proper error handling like Purchases - DON'T close modal until backend responds
      try {
        console.log('🚀 FRONTEND - Submitting sale data:', saleData);
        
        // ✅ CRITICAL: Wait for backend response before closing modal (like Purchases)
        await createSaleMutation.mutateAsync(saleData);
        
        // ✅ Refresh pagination data
        refresh();
        
        // ✅ Only close modal and reset form AFTER successful backend response
        salesModal.close();
        salesForm.reset();
        setSaleItems([]);
        
        // ✅ Success notification
        notify.success('Sale Created', 'Sale has been created successfully');
        
      } catch (error: any) {
        console.error('Error creating sale:', error);
        console.error('Error response:', error.response?.data);
        
        // ✅ CRITICAL: Handle backend errors with popup messages (like Purchases)
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.message || 
                           'Error creating sale';
        
        // ✅ Show backend error in popup (like Purchases)
        notify.error('Sale Creation Failed', errorMessage);
        
        // ✅ IMPORTANT: Keep modal open so user can fix the issue
      }
    }
  });

  // ✅ LESSON LEARNED: Performance optimizations with correct dependencies
  const memoizedCalculations = useMemo(() => {
    // Memoize filtered data based on payment type
    const filteredDebitCards = cards.filter((card: any) => card.cardType === 'DEBIT');
    const filteredCreditCards = cards.filter((card: any) => card.cardType === 'CREDIT');
    const activeCashRegisters = cashRegisters.filter(cr => cr.status === 'ACTIVE');
    const activeProducts = products.filter((p: any) => p.status === 'ACTIVE');
    
    // Memoize sale totals
    const subtotal = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = saleItems.reduce((sum, item) => sum + item.tax, 0);
    const total = saleItems.reduce((sum, item) => sum + item.total, 0);
    
    return {
      filteredDebitCards,
      filteredCreditCards,
      activeCashRegisters,
      activeProducts,
      totals: { subtotal, tax, total }
    };
  }, [cards, cashRegisters, products, saleItems]); // ✅ Correct dependencies

  // ✅ Use memoized totals instead of recalculating
  const totals = memoizedCalculations.totals;

  useEffect(() => {
    // ✅ FIXED: No need for manual API calls - React Query handles everything automatically
    // All data (sales, products, clients, cards, cash registers, bank accounts, payment networks) 
    // is now fetched via React Query hooks and will auto-update when invalidated
  }, []);

  // ✅ REMOVED: Old addProductToSale function - replaced with memoized handleAddProduct

  // ✅ REMOVED: Old removeItem function - replaced with memoized handleRemoveItem

  // ✅ LESSON LEARNED: Remove old calculateTotals function - use memoized totals instead

  // ✅ Client-side filtering for deletion status only (search handled by backend)
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchesStatus = filterStatus === 'All' || 
        (filterStatus === 'Active' && sale.deletion_status !== 'EXECUTED' && !sale.is_reversal) ||
        (filterStatus === 'Deleted' && sale.deletion_status === 'EXECUTED') ||
        (filterStatus === 'Reversal' && sale.is_reversal);
      
      return matchesStatus;
    });
  }, [sales, filterStatus]);

  // ✅ LESSON LEARNED: Remove old handleSubmit function - handled by useForm

  // ✅ Memoized event handlers with useCallback for stable references
  const handleOpenModal = useCallback(() => {
    salesForm.reset();
    setSaleItems([]);
    salesModal.open();
  }, [salesForm, salesModal]);

  const handleCloseModal = useCallback(() => {
    salesModal.close();
    salesForm.reset();
    setSaleItems([]);
  }, [salesModal, salesForm]);

  const handleViewDetails = useCallback((sale: EnhancedSale) => {
    setSelectedSale(sale);
    viewDetailsModal.open();
  }, [viewDetailsModal]);

  const handleViewProducts = useCallback((sale: EnhancedSale) => {
    setSelectedSale(sale);
    viewProductsModal.open();
  }, [viewProductsModal]);

  const handleCardPayment = useCallback((sale: EnhancedSale) => {
    setSelectedSale(sale);
    cardPaymentModal.open();
  }, [cardPaymentModal]);

  const handleCardPaymentSuccess = useCallback(() => {
    notify.success('Card payment processed', 'Payment has been recorded successfully');
    // ✅ Cache invalidation is now handled by CardPaymentModal
    // React Query will automatically refetch when needed
  }, []);

  // ✅ Memoized product addition handler
  const handleAddProduct = useCallback(() => {
    if (!selectedProduct || quantity <= 0) {
      notify.warning('Invalid input', 'Please select a product and enter valid quantity');
      return;
    }
    
    const product = products.find((p: any) => p.id === parseInt(selectedProduct));
    if (!product) return;
    
    // Check stock
    if (Number(product.amount) < quantity) {
      notify.error('Insufficient stock', `Available: ${product.amount}, Required: ${quantity}`);
      return;
    }
    
    // Use entered sales price and tax (allow 0 for free items)
    const subtotal = quantity * salesPrice;
    const total = subtotal + taxAmount;
    
    setSaleItems(prev => [...prev, {
      productId: product.id,
      productName: product.name,
      productAmount: Number(product.amount),
      quantity,
      productUnitCost: Number(product.unitCost),
      unitPrice: salesPrice,
      subtotal,
      tax: taxAmount,
      total,
    }]);
    
    setSelectedProduct('');
    setQuantity(1);
    setSalesPrice(0);
    setTaxAmount(0);
  }, [selectedProduct, quantity, salesPrice, taxAmount, products]);

  // ✅ Memoized item removal handler
  const handleRemoveItem = useCallback((index: number) => {
    setSaleItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ✅ Memoized status badge functions for stable references
  const getSaleStatusBadge = useCallback((sale: EnhancedSale) => {
    if (sale.deletion_status === 'EXECUTED') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
          🗑️ DELETED
        </span>
      );
    }
    
    if (sale.is_reversal) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
          ↩️ REVERSAL
        </span>
      );
    }
    
    // Collection status badge
    const collectionStatus = sale.collectionStatus || 'Not Collected';
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        collectionStatus === 'Collected' || collectionStatus === 'Cobrada' ? 'bg-green-100 text-green-800' :
        collectionStatus === 'Partial' || collectionStatus === 'Parcial' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {collectionStatus === 'Collected' ? 'Cobrada' : 
         collectionStatus === 'Not Collected' ? 'No Cobrada' :
         collectionStatus === 'Partial' ? 'Parcial' :
         collectionStatus || 'No Cobrada'}
      </span>
    );
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    // Handle collection status (Cobrada, Parcial, No Cobrada)
    const collectionStyles: Record<string, string> = {
      'Collected': 'bg-green-100 text-green-800',
      'Cobrada': 'bg-green-100 text-green-800',
      'Partial': 'bg-yellow-100 text-yellow-800',
      'Parcial': 'bg-yellow-100 text-yellow-800',
      'Not Collected': 'bg-red-100 text-red-800',
      'No Cobrada': 'bg-red-100 text-red-800',
    };
    const collectionIcons: Record<string, any> = {
      'Collected': CheckCircle,
      'Cobrada': CheckCircle,
      'Partial': Clock,
      'Parcial': Clock,
      'Not Collected': XCircle,
      'No Cobrada': XCircle,
    };
    
    // Handle general status (COMPLETED, PENDING, CANCELLED)
    const generalStyles: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    const generalIcons: Record<string, any> = {
      COMPLETED: CheckCircle,
      PENDING: Clock,
      CANCELLED: XCircle,
    };
    
    // Determine which set to use
    const isCollectionStatus = status in collectionStyles;
    const styles = isCollectionStatus ? collectionStyles : generalStyles;
    const icons = isCollectionStatus ? collectionIcons : generalIcons;
    
    const Icon = icons[status] || Clock;
    const styleClass = styles[status] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${styleClass}`}>
        <Icon size={14} />
        {status}
      </span>
    );
  }, []);

  // ✅ Memoized DataTable columns configuration
  const salesColumns = useMemo((): Column<EnhancedSale>[] => [
    {
      key: 'registrationNumber',
      label: 'Registration Number',
      render: (value, sale) => (
        <div className="flex items-center gap-2">
          {sale.deletion_status === 'EXECUTED' && <span className="text-red-500">🗑️</span>}
          {sale.is_reversal && <span className="text-orange-500">↩️</span>}
          <span className={sale.deletion_status === 'EXECUTED' ? 'line-through text-gray-500' : ''}>
            {value}
          </span>
        </div>
      )
    },
    {
      key: 'client.name',
      label: 'Client',
      render: (value) => value || 'N/A'
    },
    {
      key: 'clientRnc',
      label: 'Client RNC',
      render: (value) => value || 'N/A'
    },
    {
      key: 'date',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'saleType',
      label: 'Sale Of',
      render: (value) => value || 'N/A'
    },
    {
      key: 'paymentType',
      label: 'Payment Type',
      render: (value) => value || 'N/A'
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      render: (value, sale) => (
        <span className={sale.deletion_status === 'EXECUTED' ? 'line-through text-gray-500' : 'font-semibold'}>
          {formatNumber(Number(value))}
        </span>
      )
    },
    {
      key: 'collectedAmount',
      label: 'Monto Cobrado',
      align: 'right',
      render: (value, sale) => (
        <span className={`font-semibold text-green-600 ${sale.deletion_status === 'EXECUTED' ? 'line-through text-gray-500' : ''}`}>
          {formatNumber(Number(value || 0))}
        </span>
      )
    },
    {
      key: 'balanceAmount',
      label: 'Balance',
      align: 'right',
      render: (value, sale) => (
        <span className={`font-semibold text-orange-600 ${sale.deletion_status === 'EXECUTED' ? 'line-through text-gray-500' : ''}`}>
          {formatNumber(Number(value || 0))}
        </span>
      )
    },
    {
      key: 'collectionStatus',
      label: 'Estado de Cobro',
      align: 'center',
      render: (_, sale) => getSaleStatusBadge(sale)
    }
  ], [getSaleStatusBadge]);

  // ✅ Memoized custom actions for DataTable
  const customActions = useCallback((sale: EnhancedSale) => (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleViewDetails(sale)}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
        title="Sale Details"
      >
        <Eye size={18} />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleViewProducts(sale)}
        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
        title="Product Details"
      >
        <Package size={18} />
      </motion.button>
      {/* Card Payment Button - Only show if sale has balance and not deleted */}
      {sale.balanceAmount && Number(sale.balanceAmount) > 0 && sale.deletion_status !== 'EXECUTED' && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleCardPayment(sale)}
          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
          title="Process Card Payment"
        >
          <CreditCard size={18} />
        </motion.button>
      )}
    </>
  ), [handleViewDetails, handleViewProducts, handleCardPayment]);

  // ✅ Return statement starts here
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 flex-1">
          {/* ✅ SearchBar with server-side search */}
          <SearchBar
            value={search}
            onChange={updateSearch}
            placeholder={t('search')}
          />
          
          {/* ✅ Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Sales</option>
            <option value="Active">Active Sales</option>
            <option value="Deleted">🗑️ Deleted Sales</option>
            <option value="Reversal">↩️ Reversal Entries</option>
          </select>
        </div>
        
        {/* ✅ Add Sale Button */}
        <ActionButton
          onClick={handleOpenModal}
          icon={Plus}
          variant="primary"
          className="ml-4"
        >
          {t('newSale')}
        </ActionButton>
      </div>

      {/* ✅ DataTable with original styling */}
      <DataTable
        data={filteredSales}
        columns={salesColumns}
        customActions={customActions}
        loading={isLoading}
        emptyMessage="No sales found"
      />

      {/* ✅ NEW: Pagination Component */}
      <div className="mt-6">
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          from={pagination.from}
          to={pagination.to}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
          onPageChange={goToPage}
          onLimitChange={changeLimit}
        />
      </div>

      {/* ✅ LESSON LEARNED: Replace custom AnimatePresence modal with Modal component */}
      <Modal
        isOpen={salesModal.isOpen}
        onClose={handleCloseModal}
        title={
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-blue-600" />
            {t('newSale')}
          </div>
        }
        size="xl"
        maxHeight="90vh"
      >
        <div className="max-h-[75vh] overflow-y-auto">
          <form onSubmit={salesForm.handleSubmit} className="space-y-6 p-6">
          {/* Header Info */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('registrationNumber')}</label>
              <input
                type="text"
                required
                value={salesForm.values.documentNumber}
                onChange={(e) => salesForm.setValue('documentNumber', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="RV0001"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('registrationDate')} *</label>
              <input
                type="date"
                required
                value={salesForm.values.date}
                onChange={(e) => salesForm.setValue('date', e.target.value)}
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
                value={salesForm.values.clientId}
                onChange={(e) => {
                  const client = clients.find(c => c.id === parseInt(e.target.value));
                  salesForm.setValue('clientId', e.target.value);
                  salesForm.setValue('clientRnc', client?.rncCedula || '');
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
                value={salesForm.values.clientRnc}
                onChange={(e) => salesForm.setValue('clientRnc', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={t('clientRnc')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('ncf')}</label>
              <input
                type="text"
                value={salesForm.values.ncf}
                onChange={(e) => salesForm.setValue('ncf', e.target.value)}
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
                value={salesForm.values.saleType}
                onChange={(e) => salesForm.setValue('saleType', e.target.value)}
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
                value={salesForm.values.paymentType}
                onChange={(e) => {
                  salesForm.setValue('paymentType', e.target.value);
                  salesForm.setValue('cashRegisterId', '');
                  salesForm.setValue('cardPaymentNetworkId', '');
                  salesForm.setValue('bankAccountId', '');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="DEPOSIT">Deposit</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>
            
            {/* Cash Register Selection for CASH/CHEQUE */}
            {(salesForm.values.paymentType === 'CASH' || salesForm.values.paymentType === 'CHEQUE') && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Cash Register *
                </label>
                <select
                  required
                  value={salesForm.values.cashRegisterId}
                  onChange={(e) => salesForm.setValue('cashRegisterId', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select cash register...</option>
                  {cashRegisters.map(cr => (
                    <option key={cr.id} value={cr.id}>
                      {cr.name} (Balance: ${Number(cr.balance || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  💰 Cash register will be updated with this sale
                </p>
              </div>
            )}
            
            {/* Debit Card Selection for DEBIT_CARD */}
            {salesForm.values.paymentType === 'DEBIT_CARD' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Debit Card Network *
                </label>
                <select
                  required
                  value={salesForm.values.cardPaymentNetworkId}
                  onChange={(e) => salesForm.setValue('cardPaymentNetworkId', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select payment network...</option>
                  {paymentNetworks.filter(network => network.type === 'DEBIT' && network.isActive).map(network => (
                    <option key={network.id} value={network.id}>
                      {network.name} - Fee: {(Number(network.processingFee) * 100).toFixed(2)}% - Settlement: {network.settlementDays} day{network.settlementDays !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  💳 DEBIT: Creates Accounts Receivable from selected payment network
                </p>
              </div>
            )}

            {/* Payment Network Selection for CREDIT_CARD */}
            {salesForm.values.paymentType === 'CREDIT_CARD' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Credit Card Network *
                </label>
                <select
                  required
                  value={salesForm.values.cardPaymentNetworkId}
                  onChange={(e) => salesForm.setValue('cardPaymentNetworkId', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select payment network...</option>
                  {paymentNetworks.filter(network => network.type === 'CREDIT' && network.isActive).map(network => (
                    <option key={network.id} value={network.id}>
                      {network.name} - Fee: {(Number(network.processingFee) * 100).toFixed(2)}% - Settlement: {network.settlementDays} day{network.settlementDays !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  💳 CREDIT: Creates Accounts Receivable from selected payment network
                </p>
              </div>
            )}
            
            {/* Bank Account Selection for BANK_TRANSFER/DEPOSIT */}
            {(salesForm.values.paymentType === 'BANK_TRANSFER' || salesForm.values.paymentType === 'DEPOSIT') && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Bank Account *
                </label>
                <select
                  required
                  value={salesForm.values.bankAccountId}
                  onChange={(e) => salesForm.setValue('bankAccountId', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select bank account...</option>
                  {bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.bankName} - {account.accountNumber} (Balance: ${Number(account.balance || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  🏦 Money will be transferred directly to this bank account
                </p>
              </div>
            )}
          </div>

          {/* Add Products */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <h3 className="font-semibold mb-3">{t('addProducts')}</h3>
            <div className="grid grid-cols-5 gap-3">
              <select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value);
                  const product = products.find((p: any) => p.id === parseInt(e.target.value));
                  if (product) {
                    setSalesPrice(Number(product.salesPrice) || 0);
                    setTaxAmount(0);
                  }
                }}
                className="col-span-5 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select product...</option>
                {products.filter((p: any) => p.status === 'ACTIVE').map((product: any) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - Sales Price: {formatNumber(Number(product.salesPrice || 0))} | Stock: {product.amount}
                  </option>
                ))}
              </select>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sales Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={salesPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSalesPrice(val === '' ? 0 : parseFloat(val) || 0);
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '' || parseFloat(e.target.value) < 0) {
                      setSalesPrice(0);
                    }
                  }}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Enter 0 for free items</p>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddProduct}
                  className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {t('add')}
                </motion.button>
              </div>
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
                    <th className="px-4 py-3 text-right text-sm font-semibold">Sales Price</th>
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
                      <td className="px-4 py-3 text-sm text-right">{formatNumber(Number(item.unitPrice))}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatNumber(Number(item.subtotal))}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatNumber(Number(item.tax))}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">{formatNumber(Number(item.total))}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
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
                    <td className="px-4 py-3 text-right">{formatNumber(totals.subtotal)}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(totals.tax)}</td>
                    <td className="px-4 py-3 text-right text-green-600 text-lg">{formatNumber(totals.total)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={saleItems.length === 0 || salesForm.isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {salesForm.isSubmitting ? 'Creating...' : `${t('createSale')} - ${formatNumber(totals.total)}`}
            </button>
          </div>
        </form>
        </div>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={viewDetailsModal.isOpen}
        onClose={viewDetailsModal.close}
        title={
          <div className="flex items-center gap-2">
            <Eye className="text-blue-600" />
            Sale Details
          </div>
        }
        size="lg"
        maxHeight="90vh"
      >
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {selectedSale && (
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
                <p className="font-semibold">{formatNumber(Number(selectedSale.subtotal))}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Tax</label>
                <p className="font-semibold">{formatNumber(Number(selectedSale.tax))}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Total</label>
                <p className="font-semibold text-lg text-green-600">{formatNumber(Number(selectedSale.total))}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Estado de Cobro</label>
                <p>{getStatusBadge(selectedSale.collectionStatus || 'Not Collected')}</p>
              </div>
            </div>
          </div>
          )}
        </div>
      </Modal>

      {/* View Products Modal */}
      <Modal
        isOpen={viewProductsModal.isOpen}
        onClose={viewProductsModal.close}
        title={
          <div className="flex items-center gap-2">
            <Package className="text-green-600" />
            Product Details - {selectedSale?.registrationNumber}
          </div>
        }
        size="xl"
        maxHeight="90vh"
      >
        <div className="max-h-[70vh] overflow-y-auto p-6">
        {selectedSale && (
          <div>
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
                        <td className="px-3 py-2 text-right">{formatNumber(Number(item.unitPrice))}</td>
                        <td className="px-3 py-2 text-right">{formatNumber(Number(item.subtotal))}</td>
                        <td className="px-3 py-2 text-right">{formatNumber(Number(item.tax))}</td>
                        <td className="px-3 py-2 text-right font-semibold">{formatNumber(Number(item.total))}</td>
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
          </div>
        )}
        </div>
      </Modal>

      {/* Card Payment Modal */}
      {selectedSale && (
        <CardPaymentModal
          isOpen={cardPaymentModal.isOpen}
          onClose={cardPaymentModal.close}
          saleId={selectedSale.id}
          saleAmount={Number(selectedSale.balanceAmount || selectedSale.total)}
          saleNumber={selectedSale.registrationNumber}
          cashRegisterId={cashRegisters[0]?.id || 1}
          onPaymentSuccess={handleCardPaymentSuccess}
        />
      )}
    </div>
  );
};

export default Sales;
