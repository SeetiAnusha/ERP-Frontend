import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, DollarSign, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AccountsReceivable } from '../types/accountsTypes';
import { handleApiError } from '../utils/notifications';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber } from '../utils/formatNumber';
import EnhancedPaymentModal from '../components/EnhancedPaymentModal';

const AccountsReceivablePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [accountsReceivable, setAccountsReceivable] = useState<AccountsReceivable[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [groupByType, setGroupByType] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAR, setSelectedAR] = useState<AccountsReceivable | null>(null);

  // Helper function to calculate expense recorded amount from actual expense table
  const getExpenseRecordedAmount = (ar: AccountsReceivable) => {
    // Return the actual total expense amount from expense table
    return ar.totalExpenseAmount || 0;
  };

  useEffect(() => {
    fetchAccountsReceivable();
  }, []);

  const fetchAccountsReceivable = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/accounts-receivable');
      setAccountsReceivable(response.data);
    } catch (error) {
      handleApiError(error, 'Loading accounts receivable');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
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
  };

  const handleRecordPayment = (ar: AccountsReceivable) => {
    setSelectedAR(ar);
    setShowPaymentModal(true);
  };

  const handleCreditSaleCollection = (ar: AccountsReceivable) => {
    // Navigate to Cash Register with pre-filled data for credit sale or credit card sale collection
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
  };

  const handlePaymentSuccess = () => {
    fetchAccountsReceivable();
  };

  const renderARTable = (arList: AccountsReceivable[], title?: string) => (
    <div className="mb-6">
      {title && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600">
            {arList.length} records • Total: ${arList.reduce((sum, ar) => sum + Number(ar.balanceAmount), 0).toFixed(2)} pending
          </p>
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
              <th className="px-6 py-4 text-right text-sm font-bold text-blue-800" title="Expected amount to be deposited by credit card network">
                🏦 EXPECTED DEPOSIT
              </th>
              <th className="px-6 py-4 text-right text-sm font-bold text-purple-800" title="Actual amount manually entered and deposited to bank account">
                💳 ACTUAL BANK DEPOSIT
              </th>
              <th className="px-6 py-4 text-right text-sm font-bold text-red-800" title="Processing fees recorded as business expense">
                📊 EXPENSE RECORDED
              </th>
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
              arList.map((ar, index) => (
                <motion.tr
                  key={ar.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium">{ar.registrationNumber}</td>
                  <td className="px-6 py-4 text-sm">{new Date(ar.registrationDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">{ar.type}</td>
                  <td className="px-6 py-4 text-sm">
                    {ar.clientName && ar.cardNetwork ? (
                      <div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-1">
                          👤 Customer
                        </span>
                        <div className="text-sm font-medium text-gray-900">{ar.clientName}</div>
                        <div className="text-xs text-purple-600 mt-1">via {ar.cardNetwork}</div>
                      </div>
                    ) : ar.clientName && !ar.cardNetwork ? (
                      <div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-1">
                          👤 Customer
                        </span>
                        <div className="text-sm font-medium text-gray-900">{ar.clientName}</div>
                      </div>
                    ) : ar.cardNetwork || ar.type === 'CREDIT_CARD_SALE' ? (
                      <div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-1">
                          💳 Card Company
                        </span>
                        <div className="text-sm font-medium text-gray-900">{ar.cardNetwork || 'Card Company'}</div>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mb-1">
                          📄 Other
                        </span>
                        <div className="text-sm font-medium text-gray-900">{ar.clientName || ar.cardNetwork || 'N/A'}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {ar.relatedDocumentType} - {ar.relatedDocumentNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{ar.clientRnc || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{ar.ncf || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={ar.saleOf}>
                    {ar.saleOf || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-right">{formatNumber(Number(ar.amount))}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-right text-green-600">
                    {formatNumber(Number(ar.receivedAmount))}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-right text-orange-600">
                    {formatNumber(Number(ar.balanceAmount))}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-right bg-blue-50 text-blue-700">
                    {ar.expectedBankDeposit ? (
                      <div className="flex items-center justify-end gap-1">
                        <span>🏦</span>
                        <span>{formatNumber(Number(ar.expectedBankDeposit))}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-right bg-purple-50 text-purple-700">
                    {ar.actualBankDeposit ? (
                      <div className="flex items-center justify-end gap-1">
                        <span>💳</span>
                        <span>{formatNumber(Number(ar.actualBankDeposit))}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-right bg-red-50 text-red-700">
                    {getExpenseRecordedAmount(ar) > 0 ? (
                      <div 
                        className="flex items-center justify-end gap-1 cursor-help" 
                        title={ar.relatedExpenses && ar.relatedExpenses.length > 0 
                          ? `Expense Records: ${ar.relatedExpenses.map(exp => `${exp.registrationNumber}: ₹${exp.amount} (${exp.expenseType})`).join(', ')}`
                          : 'No expense records found'
                        }
                      >
                        <span>📊</span>
                        <span>{formatNumber(getExpenseRecordedAmount(ar))}</span>
                        {ar.relatedExpenses && ar.relatedExpenses.length > 1 && (
                          <span className="text-xs text-red-500 ml-1">({ar.relatedExpenses.length})</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">{getStatusBadge(ar.status)}</td>
                  <td className="px-6 py-4 text-center">
                    {ar.status !== 'Received' && (
                      <>
                        {/* Show different buttons based on sale type */}
                        {ar.type === 'CREDIT_SALE' || ar.type === 'CLIENT_CREDIT' ? (
                          // Credit Sale - Navigate to Cash Register
                          <button
                            onClick={() => handleCreditSaleCollection(ar)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <Plus size={16} />
                            Collect via Cash
                          </button>
                        ) : ar.type === 'CREDIT_CARD_SALE' || ar.type === 'DEBIT_CARD_SALE' ? (
                          // Credit Card Sale - Show modal with bank account selection
                          <button
                            onClick={() => handleRecordPayment(ar)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Plus size={16} />
                            {t('collect')}
                          </button>
                        ) : (
                          // Other types - Show generic collect button
                          <button
                            onClick={() => handleRecordPayment(ar)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                          >
                            <Plus size={16} />
                            {t('collect')}
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const filteredAR = accountsReceivable.filter((ar) => {
    const matchesSearch = Object.values(ar).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = filterStatus === 'All' || ar.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Group AR by type if grouping is enabled
  const groupedAR = groupByType ? {
    customers: filteredAR.filter(ar => ar.clientName && ar.clientId), // All records with customer info
    cards: filteredAR.filter(ar => ar.cardNetwork && !ar.clientId), // Only card company records without customer info
  } : null;

  const totalAmount = filteredAR.reduce((sum, ar) => sum + Number(ar.amount), 0);
  const totalReceived = filteredAR.reduce((sum, ar) => sum + Number(ar.receivedAmount), 0);
  const totalBalance = filteredAR.reduce((sum, ar) => sum + Number(ar.balanceAmount), 0);

  if (isLoading) {
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

      {/* Credit Balance Summary for Customers */}
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
          <p className="text-sm text-gray-600">
            💡 When customers overpay invoices, the excess amount is automatically converted to credit balance for future purchases.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('search') + '...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
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

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {groupByType && groupedAR ? (
          <div>
            {/* Customer Receivables */}
            {groupedAR.customers.length > 0 && renderARTable(
              groupedAR.customers, 
              "👤 Customer Receivables"
            )}
            
            {/* Card Company Receivables */}
            {groupedAR.cards.length > 0 && renderARTable(
              groupedAR.cards, 
              "💳 Card Company Receivables"
            )}
            
            {filteredAR.length === 0 && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <p className="text-gray-500">{t('noAccountsReceivableFound')}</p>
              </div>
            )}
          </div>
        ) : (
          renderARTable(filteredAR)
        )}
      </motion.div>

      {/* Enhanced Payment Modal with Phase 1 Overpayment Detection */}
      {selectedAR && (
        <EnhancedPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedAR(null);
          }}
          onSuccess={handlePaymentSuccess}
          transaction={{
            id: selectedAR.id,
            type: 'AR',
            registrationNumber: selectedAR.registrationNumber || '',
            relatedDocumentNumber: selectedAR.relatedDocumentNumber || '',
            entityName: selectedAR.clientName || selectedAR.cardNetwork || '',
            entityId: selectedAR.clientId,
            entityType: 'CLIENT',
            amount: Number(selectedAR.amount),
            paidAmount: Number(selectedAR.receivedAmount),
            balanceAmount: Number(selectedAR.balanceAmount),
            isCardTransaction: selectedAR.type === 'CREDIT_CARD_SALE' || selectedAR.type === 'DEBIT_CARD_SALE'
          }}
          title={(selectedAR.type === 'CREDIT_CARD_SALE' || selectedAR.type === 'DEBIT_CARD_SALE') 
            ? 'Collect Credit Card Payment' 
            : t('recordPayment')
          }
        />
      )}
    </div>
  );
};

export default AccountsReceivablePage;
