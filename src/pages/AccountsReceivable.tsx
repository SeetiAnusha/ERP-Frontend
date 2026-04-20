import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../api/axios';
import { AccountsReceivable } from '../types/accountsTypes';
import { extractErrorMessage } from '../utils/errorHandler';

import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber } from '../utils/formatNumber';
import { QUERY_KEYS } from '../lib/queryKeys';

// ✅ OPTIMIZATION: Use modern React patterns while preserving exact functionality
import { useModal } from '../hooks/useModal';
import { useTableData } from '../hooks/useTableData';
import { Pagination } from '../components/common/Pagination';
import SearchBar from '../components/common/SearchBar';

// ✅ OPTIMIZATION: Use React Query hooks for better performance
// import { useAccountsReceivable } from '../hooks/queries/useFinancial';
import { useBankAccounts } from '../hooks/queries/useSharedData';

const AccountsReceivablePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // ✅ NEW: Use useTableData for pagination
  const {
    data: accountsReceivable,
    pagination,
    loading,
    search,
    updateSearch,
    goToPage,
    changeLimit,
    refresh
  } = useTableData<AccountsReceivable>({
    endpoint: '/accounts-receivable',  // ✅ FIXED: Removed /api/ prefix
    initialLimit: 50,
    initialSortBy: 'createdAt',
    initialSortOrder: 'DESC'
  });
  
  const { data: bankAccounts = [] } = useBankAccounts();
  
  // ✅ OPTIMIZATION: Use useModal hook for better state management
  const paymentModal = useModal<AccountsReceivable>();
  
  // ✅ PRESERVED: Keep all original state variables exactly as they were
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [groupByType, setGroupByType] = useState<boolean>(false);
  
  // ✅ PRESERVED: Keep all original payment modal states exactly as they were
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [transferReference, setTransferReference] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('CREDIT_CARD_FEE');

  // ✅ PRESERVED: Keep original helper function exactly as it was
  const getExpenseRecordedAmount = useCallback((ar: AccountsReceivable) => {
    // Return the actual total expense amount from expense table
    return ar.totalExpenseAmount || 0;
  }, []);
  // ✅ PRESERVED: Keep original status badge function exactly as it was
  const getStatusBadge = useCallback((status: string) => {
    const styles: Record<string, string> = {
      'Received': 'bg-green-100 text-green-800',
      'Partial': 'bg-yellow-100 text-yellow-800',
      'Pending': 'bg-red-100 text-red-800',
    };
    const icons: Record<string, any> = {
      'Received': CheckCircle,
      'Partial': Clock,
      'Pending': XCircle,
    };
    
    const Icon = icons[status] || Clock;
    const styleClass = styles[status] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${styleClass}`}>
        <Icon size={14} />
        {status}
      </span>
    );
  }, []);

  // ✅ OPTIMIZATION: Memoized version of original handleRecordPayment
  const handleRecordPayment = useCallback((ar: AccountsReceivable) => {
    paymentModal.open(ar);
    setPaymentAmount(ar.balanceAmount.toString());
    setTransferReference('');
    setCollectionDescription(`Payment for ${ar.relatedDocumentNumber} - ${ar.clientName || ar.cardNetwork}`);
    setSelectedBankAccountId('');
    setExpenseCategory('CREDIT_CARD_FEE');
  }, [paymentModal]);

  // ✅ OPTIMIZATION: Memoized version of original submitPayment with React Query cache invalidation
  const submitPayment = useCallback(async () => {
    const selectedAR = paymentModal.data;
    if (!selectedAR) return;

    if (!paymentAmount) {
      toast.error('Please enter payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }

    // For credit card sales, require bank account selection
    if ((selectedAR.type === 'CREDIT_CARD_SALE' || selectedAR.type === 'DEBIT_CARD_SALE') && !selectedBankAccountId) {
      toast.error('Please select a bank account for credit card payment');
      return;
    }

    try {
      const paymentData: any = {
        amount,
        receivedDate: new Date(),
        notes: collectionDescription || undefined,
        reference: transferReference || undefined
      };

      // Add bank account for credit card sales
      if (selectedAR.type === 'CREDIT_CARD_SALE' || selectedAR.type === 'DEBIT_CARD_SALE') {
        paymentData.bankAccountId = parseInt(selectedBankAccountId);
        paymentData.isCardSale = true;
      }

      // Handle processing fees for credit card sales
      if (amount < Number(selectedAR.amount) && (selectedAR.type === 'CREDIT_CARD_SALE' || selectedAR.type === 'DEBIT_CARD_SALE')) {
        paymentData.processingFeeCategory = expenseCategory;
      }

      await api.post(`/accounts-receivable/${selectedAR.id}/record-payment`, paymentData);
      
      toast.success('Payment recorded successfully');
      paymentModal.close();
      setPaymentAmount('');
      setSelectedBankAccountId('');
      setTransferReference('');
      setCollectionDescription('');
      setExpenseCategory('CREDIT_CARD_FEE');
      
      // ✅ OPTIMIZATION: Use React Query cache invalidation instead of manual refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accountsReceivable });
      refresh(); // Refresh pagination data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankAccounts });
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(extractErrorMessage(error));
    }
  }, [paymentModal.data, paymentAmount, selectedBankAccountId, collectionDescription, transferReference, expenseCategory, queryClient, paymentModal, refresh]);
  // ✅ PRESERVED: Keep original handleCreditSaleCollection exactly as it was
  const handleCreditSaleCollection = useCallback((ar: AccountsReceivable) => {
    // First check if customer has credit balance
    // If yes, show Customer Credit Aware Payment Modal
    // If no, navigate to Cash Register
    const isCardSale = ar.type === 'CREDIT_CARD_SALE' || ar.type === 'DEBIT_CARD_SALE';
    const collectionType = isCardSale ? 'Credit Card Collection' : 'Credit Sale Collection';
    const description = isCardSale 
      ? `Credit Card Collection - ${ar.relatedDocumentNumber} - ${ar.clientName} (${ar.cardNetwork})`
      : `Credit Sale Collection - ${ar.relatedDocumentNumber} - ${ar.clientName}`;
    
    const collectionData = {
      transactionType: 'INFLOW',
      relatedDocumentType: 'AR_COLLECTION',
      amount: ar.balanceAmount.toString(),
      description,
      customerId: ar.clientId,
      clientName: ar.clientName,
      accountsReceivableId: ar.id,
      collectionType
    };
    
    // Navigate to Cash Register with state
    navigate('/cash-register', { 
      state: { 
        prefilledData: collectionData,
        fromAccountsReceivable: true 
      } 
    });
  }, [navigate]);



  // ✅ PRESERVED: Keep original getARStatusBadge exactly as it was
  const getARStatusBadge = useCallback((ar: AccountsReceivable) => {
    if (ar.deletion_status === 'EXECUTED') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
          🗑️ DELETED
        </span>
      );
    }
    
    if (ar.is_reversal) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
          ↩️ REVERSAL
        </span>
      );
    }
    
    return getStatusBadge(ar.status);
  }, [getStatusBadge]);
  // ✅ PRESERVED: Keep original renderARTable function exactly as it was, but memoized for performance
  const renderARTable = useCallback((arList: AccountsReceivable[], title?: string) => (
    <div className="mb-6">
      {title && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600">{arList.length} records • Total: ${arList.reduce((sum, ar) => sum + Number(ar.balanceAmount), 0).toFixed(2)} pending</p>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('registrationNumber').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('date').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('type').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">RECEIVABLE FROM</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">{t('relatedDocumentNumber').toUpperCase()}</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">RNC</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">NCF</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">SALE OF</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">{t('amount').toUpperCase()}</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">{t('received').toUpperCase()}</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">{t('balance').toUpperCase()}</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-blue-800" title="Expected amount to be deposited by credit card network">🏦 EXPECTED DEPOSIT</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-purple-800" title="Actual amount manually entered and deposited to bank account">💳 ACTUAL BANK DEPOSIT</th>
              <th className="px-6 py-4 text-right text-sm font-bold text-red-800" title="Processing fees recorded as business expense">📊 EXPENSE RECORDED</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">{t('status').toUpperCase()}</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">{t('action').toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            {arList.length === 0 ? (
              <tr>
                <td colSpan={16} className="px-6 py-12 text-center text-gray-500">
                  {t('noAccountsReceivableFound')}
                </td>
              </tr>
            ) : (
              arList.map((ar, index) => {
                const isDeleted = ar.deletion_status === 'EXECUTED';
                const isReversal = ar.is_reversal === true;
                
                return (
                  <motion.tr
                    key={ar.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      isDeleted ? 'bg-red-50 opacity-75' : isReversal ? 'bg-orange-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {isDeleted && <span className="text-red-500">🗑️</span>}
                        {isReversal && <span className="text-orange-500">↩️</span>}
                        <span className={isDeleted ? 'line-through text-gray-500' : ''}>
                          {ar.registrationNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{new Date(ar.registrationDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">{ar.type}</td>
                    <td className="px-6 py-4 text-sm">
                      {ar.clientName && ar.cardNetwork ? (
                        <div>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-1">
                            👤 Customer
                          </span>
                          <div className={`text-sm font-medium ${isDeleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {ar.clientName}
                          </div>
                          <div className="text-xs text-purple-600 mt-1">via {ar.cardNetwork}</div>
                        </div>
                      ) : ar.clientName && !ar.cardNetwork ? (
                        <div>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-1">
                            👤 Customer
                          </span>
                          <div className={`text-sm font-medium ${isDeleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {ar.clientName}
                          </div>
                        </div>
                      ) : ar.cardNetwork || ar.type === 'CREDIT_CARD_SALE' ? (
                        <div>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-1">
                            💳 Card Company
                          </span>
                          <div className={`text-sm font-medium ${isDeleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {ar.cardNetwork || 'Card Company'}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mb-1">
                            📄 Other
                          </span>
                          <div className={`text-sm font-medium ${isDeleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {ar.clientName || ar.cardNetwork || 'N/A'}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={isDeleted ? 'line-through text-gray-500' : ''}>
                        {ar.relatedDocumentType} - {ar.relatedDocumentNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{ar.clientRnc || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{ar.ncf || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={ar.saleOf}>
                      <span className={isDeleted ? 'line-through text-gray-500' : ''}>
                        {ar.saleOf || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-right">
                      <span className={isDeleted ? 'line-through text-gray-500' : ''}>
                        {formatNumber(Number(ar.amount))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-right text-green-600">
                      <span className={isDeleted ? 'line-through text-gray-500' : ''}>
                        {formatNumber(Number(ar.receivedAmount))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-right text-orange-600">
                      <span className={isDeleted ? 'line-through text-gray-500' : ''}>
                        {formatNumber(Number(ar.balanceAmount))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-right bg-blue-50 text-blue-700">
                      {ar.expectedBankDeposit ? (
                        <div className="flex items-center justify-end gap-1">
                          <span>🏦</span>
                          <span className={isDeleted ? 'line-through text-gray-500' : ''}>
                            {formatNumber(Number(ar.expectedBankDeposit))}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-right bg-purple-50 text-purple-700">
                      {ar.actualBankDeposit ? (
                        <div className="flex items-center justify-end gap-1">
                          <span>💳</span>
                          <span className={isDeleted ? 'line-through text-gray-500' : ''}>
                            {formatNumber(Number(ar.actualBankDeposit))}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-right bg-red-50 text-red-700">
                      {getExpenseRecordedAmount(ar) > 0 ? (
                        <div className="flex items-center justify-end gap-1 cursor-help" 
                             title={ar.relatedExpenses && ar.relatedExpenses.length > 0 
                               ? `Expense Records: ${ar.relatedExpenses.map(exp => `${exp.registrationNumber}: ₹${exp.amount} (${exp.expenseType})`).join(', ')}`
                               : 'No expense records found'
                             }>
                          <span>📊</span>
                          <span className={isDeleted ? 'line-through text-gray-500' : ''}>
                            {formatNumber(getExpenseRecordedAmount(ar))}
                          </span>
                          {ar.relatedExpenses && ar.relatedExpenses.length > 1 && (
                            <span className="text-xs text-red-500 ml-1">({ar.relatedExpenses.length})</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">{getARStatusBadge(ar)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {ar.status !== 'Received' && !isDeleted && (
                          <>
                            {/* ✅ PRESERVED: Show correct button based on transaction type exactly as original */}
                            {ar.type === 'CREDIT_CARD_SALE' || ar.type === 'DEBIT_CARD_SALE' ? (
                              // Credit Card Sale - Show Record Payment button (blue)
                              <button
                                onClick={() => handleRecordPayment(ar)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              >
                                Record Payment
                              </button>
                            ) : (
                              // Client Credit Sale - Show Collect button (green)
                              <button
                                onClick={() => handleCreditSaleCollection(ar)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                              >
                                {t('collect')}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  ), [t, getARStatusBadge, getExpenseRecordedAmount, handleCreditSaleCollection, handleRecordPayment]);
  // ✅ NEW: Filter by status only (search handled by backend)
  const filteredAR = useMemo(() => {
    if (filterStatus === 'All') return accountsReceivable;
    return accountsReceivable.filter((ar) => ar.status === filterStatus);
  }, [accountsReceivable, filterStatus]);

  // ✅ OPTIMIZATION: Memoized grouping for better performance
  const groupedAR = useMemo(() => {
    return groupByType ? {
      customers: filteredAR.filter(ar => ar.clientName && ar.clientId), // All records with customer info
      cards: filteredAR.filter(ar => ar.cardNetwork && !ar.clientId), // Only card company records without customer info
    } : null;
  }, [groupByType, filteredAR]);

  // ✅ OPTIMIZATION: Memoized totals for better performance
  const { totalAmount, totalReceived, totalBalance } = useMemo(() => {
    const totalAmount = filteredAR.reduce((sum, ar) => sum + Number(ar.amount), 0);
    const totalReceived = filteredAR.reduce((sum, ar) => sum + Number(ar.receivedAmount), 0);
    const totalBalance = filteredAR.reduce((sum, ar) => sum + Number(ar.balanceAmount), 0);
    return { totalAmount, totalReceived, totalBalance };
  }, [filteredAR]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('accountsReceivable')}</h1>
        <p className="text-gray-600">{t('moneyOwedToYou')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 rounded-xl p-6 border border-blue-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">{t('totalAmount')}</p>
              <p className="text-2xl font-bold text-blue-900">{totalAmount.toFixed(2)}</p>
            </div>
            <DollarSign className="text-blue-600" size={32} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-green-50 rounded-xl p-6 border border-green-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">{t('received')}</p>
              <p className="text-2xl font-bold text-green-900">{totalReceived.toFixed(2)}</p>
            </div>
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-orange-50 rounded-xl p-6 border border-orange-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">{t('balancePending')}</p>
              <p className="text-2xl font-bold text-orange-900">{totalBalance.toFixed(2)}</p>
            </div>
            <Clock className="text-orange-600" size={32} />
          </div>
        </motion.div>
      </div>
      {/* ✅ PRESERVED: Credit Balance Summary for Customers exactly as original */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <DollarSign className="text-blue-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Customer Credit Balances</h3>
                <p className="text-sm text-gray-600">Available credits from overpayments</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">💡 When customers overpay invoices, the excess amount is automatically converted to credit balance for future purchases.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 items-center">
        <SearchBar
          value={search}
          onChange={updateSearch}
          placeholder={t('search') + '...'}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">{t('allStatus')}</option>
          <option value="Pending">{t('pending')}</option>
          <option value="Partial">{t('partial')}</option>
          <option value="Received">{t('received')}</option>
        </select>
        <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-300">
          <input
            type="checkbox"
            checked={groupByType}
            onChange={(e) => setGroupByType(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Group by Type</span>
        </label>
      </div>

      {/* ✅ PRESERVED: Table exactly as original */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {groupByType && groupedAR ? (
          <div>
            {groupedAR.customers.length > 0 && (
              <>{renderARTable(groupedAR.customers, "👤 Customer Receivables")}</>
            )}
            
            {groupedAR.cards.length > 0 && (
              <>{renderARTable(groupedAR.cards, "💳 Card Company Receivables")}</>
            )}
            
            {filteredAR.length === 0 && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <p className="text-gray-500">{t('noAccountsReceivableFound')}</p>
              </div>
            )}
          </div>
        ) : (
          <>{renderARTable(filteredAR)}</>
        )}
      </motion.div>

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

      {/* ✅ PRESERVED: Payment Modal exactly as original */}
      {paymentModal.isOpen && paymentModal.data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold mb-4">
              {(paymentModal.data.type === 'CREDIT_CARD_SALE' || paymentModal.data.type === 'DEBIT_CARD_SALE') 
                ? 'Record Payment' 
                : t('recordPayment')
              }
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">{t('document')}: {paymentModal.data.relatedDocumentNumber}</p>
                <p className="text-sm text-gray-600">{t('client')}: {paymentModal.data.clientName || paymentModal.data.cardNetwork}</p>
                {paymentModal.data.cardNetwork && (
                  <p className="text-sm text-gray-600">Card Network: {paymentModal.data.cardNetwork}</p>
                )}
                <p className="text-sm text-gray-600">{t('totalAmount')}: {Number(paymentModal.data.amount).toFixed(2)}</p>
                <p className="text-sm text-gray-600">{t('alreadyPaid')}: {Number(paymentModal.data.receivedAmount).toFixed(2)}</p>
                <p className="text-sm font-semibold text-orange-600">{t('balance')}: {Number(paymentModal.data.balanceAmount).toFixed(2)}</p>
              </div>

              {/* Bank Account Selection for Credit Card Sales */}
              {(paymentModal.data.type === 'CREDIT_CARD_SALE' || paymentModal.data.type === 'DEBIT_CARD_SALE') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Business Bank Account *</label>
                  <select
                    value={selectedBankAccountId}
                    onChange={(e) => setSelectedBankAccountId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Bank Account</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.bankName} - {account.accountNumber} (Balance: {Number(account.balance).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-600 mt-1">💳 Credit card payments will be deposited to the selected bank account</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount Received *</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter actual amount received"
                />
                
                {paymentAmount && paymentModal.data && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Invoice Amount:</span>
                        <span className="font-medium">{Number(paymentModal.data.amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount Received:</span>
                        <span className="font-medium text-green-600">{parseFloat(paymentAmount || '0').toFixed(2)}</span>
                      </div>
                      {parseFloat(paymentAmount || '0') < Number(paymentModal.data.amount) && (
                        <div className="flex justify-between border-t pt-2 mt-2">
                          <span className="text-red-600">Processing Fee:</span>
                          <span className="font-medium text-red-600">{(Number(paymentModal.data.amount) - parseFloat(paymentAmount || '0')).toFixed(2)}</span>
                        </div>
                      )}
                      {(paymentModal.data.type === 'CREDIT_CARD_SALE' || paymentModal.data.type === 'DEBIT_CARD_SALE') && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                          ✅ This will be marked as "Received" (one-time payment for credit cards)
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* Transfer Reference for Credit Card Sales */}
              {(paymentModal.data.type === 'CREDIT_CARD_SALE' || paymentModal.data.type === 'DEBIT_CARD_SALE') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Reference</label>
                  <input
                    type="text"
                    value={transferReference}
                    onChange={(e) => setTransferReference(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Bank transfer reference or transaction ID"
                  />
                </div>
              )}

              {/* Collection Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={collectionDescription}
                  onChange={(e) => setCollectionDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes about this collection"
                  rows={2}
                />
              </div>

              {/* Expense Category for Processing Fees */}
              {paymentAmount && paymentModal.data && parseFloat(paymentAmount) < Number(paymentModal.data.amount) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Processing Fee Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CREDIT_CARD_FEE">Credit Card Fee</option>
                    <option value="PROCESSING_FEE">Processing Fee</option>
                    <option value="TRANSACTION_FEE">Transaction Fee</option>
                    <option value="BANK_CHARGES">Bank Charges</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={submitPayment}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {(paymentModal.data.type === 'CREDIT_CARD_SALE' || paymentModal.data.type === 'DEBIT_CARD_SALE') 
                    ? 'Collect Payment' 
                    : t('confirmPayment')
                  }
                </button>
                <button
                  onClick={() => {
                    paymentModal.close();
                    setPaymentAmount('');
                    setSelectedBankAccountId('');
                    setTransferReference('');
                    setCollectionDescription('');
                    setExpenseCategory('CREDIT_CARD_FEE');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AccountsReceivablePage;