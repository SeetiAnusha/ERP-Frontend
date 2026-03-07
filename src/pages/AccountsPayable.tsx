import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, DollarSign, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AccountsPayable } from '../types/accountsTypes';
import { notify, handleApiError } from '../utils/notifications';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber } from '../utils/formatNumber';

const AccountsPayablePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [accountsPayable, setAccountsPayable] = useState<AccountsPayable[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAP, setSelectedAP] = useState<AccountsPayable | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');
  const [cards, setCards] = useState<any[]>([]);
  const [editingDeadline, setEditingDeadline] = useState<number | null>(null);
  const [newDeadline, setNewDeadline] = useState('');

  useEffect(() => {
    fetchAccountsPayable();
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await api.get('/cards');
      setCards(response.data);
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  };

  // ✅ DSA: Helper function for determining payable entity (Single Responsibility Principle)
  const getPayableEntity = (ap: AccountsPayable) => {
    // Check payment type to determine if it's supplier or card company
    const isCardPurchase = ap.paymentType === 'CREDIT_CARD' || ap.type === 'CREDIT_CARD_PURCHASE';
    
    if (isCardPurchase) {
      return {
        type: 'CARD_COMPANY',
        icon: '💳',
        label: t('cardCompany'),
        name: ap.cardIssuer || t('cardCompany'),
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
      };
    }
    
    // Default to supplier
    return {
      type: 'SUPPLIER',
      icon: '🏢',
      label: t('supplier'),
      name: ap.supplierName || t('supplier'),
      badgeClass: 'bg-green-100 text-green-800 border-green-300',
    };
  };

  const fetchAccountsPayable = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/accounts-payable');
      console.log('🔍 Accounts Payable API Response:', response.data);
      console.log('🔍 First item:', response.data[0]);
      console.log('🔍 First item supplierRnc:', response.data[0]?.supplierRnc);
      console.log('🔍 First item ncf:', response.data[0]?.ncf);
      console.log('🔍 First item paymentType:', response.data[0]?.paymentType);
      setAccountsPayable(response.data);
    } catch (error) {
      handleApiError(error, t('loadingAccountsPayable'));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'Paid': 'bg-green-100 text-green-800',
      'Partial': 'bg-yellow-100 text-yellow-800',
      'Pending': 'bg-red-100 text-red-800',
    };
    const icons: Record<string, any> = {
      'Paid': CheckCircle,
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

  const handleRecordPayment = (ap: AccountsPayable) => {
    setSelectedAP(ap);
    setPaymentAmount(ap.balanceAmount.toString());
    setSelectedCardId('');
    setShowPaymentModal(true);
  };

  const handlePayCreditPurchase = (ap: AccountsPayable) => {
    // Navigate to Bank Register with pre-filled data for credit purchase payment
    const paymentData = {
      transactionType: 'OUTFLOW',
      amount: ap.balanceAmount.toString(),
      description: `${t('paymentForCreditPurchase')} - ${ap.relatedDocumentNumber || 'N/A'} - ${ap.supplierName}`,
      supplierId: ap.supplierId,
      supplierName: ap.supplierName,
      accountsPayableId: ap.id, // Pass the AP ID
      paymentType: t('creditPurchasePaymentType')
    };
    
    // Navigate to Bank Register with state
    navigate('/bank-register', { 
      state: { 
        prefilledData: paymentData,
        fromAccountsPayable: true 
      } 
    });
  };

  const submitPayment = async () => {
    if (!selectedAP || !paymentAmount) return;
    
    // ✅ For CREDIT_CARD AP, use stored cardId; for SUPPLIER, require selection
    const cardIdToUse = selectedAP.type === 'CREDIT_CARD_PURCHASE' && selectedAP.cardId 
      ? selectedAP.cardId 
      : parseInt(selectedCardId);
    
    if (!cardIdToUse) {
      notify.warning(t('pleaseSelectCardForPayment'));
      return;
    }
    
    try {
      await api.post(`/accounts-payable/${selectedAP.id}/record-payment`, {
        amount: parseFloat(paymentAmount),
        paidDate: new Date(),
        cardId: cardIdToUse,
        paymentMethod: 'CREDIT_CARD',
      });
      notify.success(t('paymentRecordedSuccessfully'));
      setShowPaymentModal(false);
      setSelectedAP(null);
      setPaymentAmount('');
      setSelectedCardId('');
      fetchAccountsPayable();
    } catch (error) {
      handleApiError(error, t('recordingPayment'));
    }
  };

  const handleEditDeadline = (ap: AccountsPayable) => {
    setEditingDeadline(ap.id);
    setNewDeadline(ap.dueDate ? new Date(ap.dueDate).toISOString().split('T')[0] : '');
  };

  const handleSaveDeadline = async (apId: number) => {
    if (!newDeadline) {
      notify.warning(t('invalidDate'), t('pleaseSelectValidDeadline'));
      return;
    }

    try {
      await api.put(`/accounts-payable/${apId}`, {
        dueDate: newDeadline,
      });
      notify.success(t('deadlineUpdated'), t('paymentDeadlineHasBeenUpdated'));
      setEditingDeadline(null);
      setNewDeadline('');
      fetchAccountsPayable();
    } catch (error) {
      handleApiError(error, t('updatingDeadline'));
    }
  };

  const handleCancelEditDeadline = () => {
    setEditingDeadline(null);
    setNewDeadline('');
  };

  const filteredAP = accountsPayable.filter((ap) => {
    const matchesSearch = Object.values(ap).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = filterStatus === 'All' || ap.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredAP.reduce((sum, ap) => sum + Number(ap.amount), 0);
  const totalPaid = filteredAP.reduce((sum, ap) => sum + Number(ap.paidAmount), 0);
  const totalBalance = filteredAP.reduce((sum, ap) => sum + Number(ap.balanceAmount), 0);

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('accountsPayable')}</h1>
        <p className="text-gray-600">{t('moneyYouOwe')}</p>
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
              <p className="text-sm text-green-600 font-medium">{t('paid')}</p>
              <p className="text-2xl font-bold text-green-900">{totalPaid.toFixed(2)}</p>
            </div>
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-red-50 rounded-xl p-6 border border-red-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">{t('balanceYouOwe')}</p>
              <p className="text-2xl font-bold text-red-900">{totalBalance.toFixed(2)}</p>
            </div>
            <Clock className="text-red-600" size={32} />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
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
          <option value="Paid">{t('paid')}</option>
        </select>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg overflow-x-auto max-h-[600px] overflow-y-auto"
      >
        <table className="w-full min-w-max table-auto">
          <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-20">
            <tr>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">{t('payableTo').toUpperCase()}</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">{t('type').toUpperCase()}</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">{t('registrationNo').toUpperCase()}</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">{t('registrationDate').toUpperCase()}</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">{t('rncSupplier').toUpperCase()}</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">{t('supplierCodeAndName').toUpperCase()}</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">{t('ncf').toUpperCase()}</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">{t('date').toUpperCase()}</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">{t('purchaseOf').toUpperCase()}</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">{t('paymentTerms').toUpperCase()}</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {t('paymentDeadline').toUpperCase()}
                  <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    ✎ {t('editable')}
                  </span>
                </div>
              </th>
              <th className="px-4 py-4 text-right text-sm font-bold text-gray-800 whitespace-nowrap">{t('amount').toUpperCase()}</th>
              <th className="px-4 py-4 text-right text-sm font-bold text-gray-800 whitespace-nowrap">{t('paid').toUpperCase()}</th>
              <th className="px-4 py-4 text-right text-sm font-bold text-gray-800 whitespace-nowrap">{t('balance').toUpperCase()}</th>
              <th className="px-4 py-4 text-center text-sm font-bold text-gray-800 whitespace-nowrap">{t('status').toUpperCase()}</th>
              <th className="px-4 py-4 text-center text-sm font-bold text-gray-800 whitespace-nowrap">{t('action').toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            {filteredAP.length === 0 ? (
              <tr>
                <td colSpan={16} className="px-6 py-12 text-center text-gray-500">
                  {t('noAccountsPayableFound')}
                </td>
              </tr>
            ) : (
              filteredAP.map((ap, index) => {
                const payableEntity = getPayableEntity(ap); // ✅ DSA: Compute once, use multiple times (efficiency)
                
                return (
                <motion.tr
                  key={ap.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {/* ✅ Phase 6: Payable To Column */}
                  <td className="px-4 py-4 text-sm whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${payableEntity.badgeClass} w-fit`}>
                        <span>{payableEntity.icon}</span>
                        <span>{payableEntity.label}</span>
                      </span>
                      <span className="text-xs text-gray-600 font-medium">{payableEntity.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap">{ap.type}</td>
                  <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">{ap.relatedDocumentNumber || 'N/A'}</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap">{new Date(ap.registrationDate).toLocaleDateString()}</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap">{ap.supplierRnc || 'N/A'}</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap">{ap.supplierName || ap.cardIssuer || 'N/A'}</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap">{ap.ncf || 'N/A'}</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap">{ap.purchaseDate ? new Date(ap.purchaseDate).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap">{ap.purchaseType || 'N/A'}</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap">{ap.paymentType || ap.type}</td>
                  <td className="px-4 py-4 text-sm whitespace-nowrap">
                    {editingDeadline === ap.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={newDeadline}
                          onChange={(e) => setNewDeadline(e.target.value)}
                          className="px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveDeadline(ap.id)}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 font-medium"
                          title={t('save')}
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleCancelEditDeadline}
                          className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 font-medium"
                          title={t('cancel')}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => handleEditDeadline(ap)}
                        className="cursor-pointer hover:bg-blue-100 px-3 py-1.5 rounded border border-dashed border-blue-300 hover:border-blue-500 inline-flex items-center gap-2 transition-all"
                        title={t('clickToEditDeadline')}
                      >
                        <span>{ap.dueDate ? new Date(ap.dueDate).toLocaleDateString() : 'N/A'}</span>
                        <span className="text-blue-600 text-xs">✎</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-right whitespace-nowrap">{formatNumber(Number(ap.amount))}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-right text-green-600 whitespace-nowrap">
                    {formatNumber(Number(ap.paidAmount))}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-right text-red-600 whitespace-nowrap">
                    {formatNumber(Number(ap.balanceAmount))}
                  </td>
                  <td className="px-4 py-4 text-center whitespace-nowrap">{getStatusBadge(ap.status)}</td>
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    {ap.status !== 'Paid' && (
                      <>
                        {/* Show Pay via Bank button for Credit payment type only */}
                        {((ap.paymentType === 'CREDIT' || ap.paymentType === 'Credit') || 
                          (ap.type === 'CREDIT' || ap.type === 'Credit')) ? (
                          <button
                            onClick={() => handlePayCreditPurchase(ap)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            <Plus size={14} />
                            {t('payViaBankButton')}
                          </button>
                        ) : (
                          /* Regular Pay button for all other types */
                          <button
                            onClick={() => handleRecordPayment(ap)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            <Plus size={14} />
                            {t('pay')}
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Payment Modal */}
      {showPaymentModal && selectedAP && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold mb-4">{t('recordPayment')}</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">{t('document')}: {selectedAP.relatedDocumentNumber}</p>
                <p className="text-sm text-gray-600">{t('supplier')}: {selectedAP.supplierName || selectedAP.cardIssuer}</p>
                <p className="text-sm text-gray-600">{t('totalAmount')}: {Number(selectedAP.amount).toFixed(2)}</p>
                <p className="text-sm text-gray-600">{t('alreadyPaid')}: {Number(selectedAP.paidAmount).toFixed(2)}</p>
                <p className="text-sm font-semibold text-red-600">{t('balance')}: {Number(selectedAP.balanceAmount).toFixed(2)}</p>
              </div>
              {/* Conditional Card Selection: Only show for SUPPLIER AP */}
              {selectedAP.type !== 'CREDIT_CARD_PURCHASE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('selectDebitCard')} * ({t('immediatePayment')})
                </label>
                <select
                  value={selectedCardId}
                  onChange={(e) => setSelectedCardId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">{t('selectADebitCard')}</option>
                  {cards.filter(card => card.cardType === 'DEBIT').map(card => (
                    <option key={card.id} value={card.id}>
                      {card.cardType} - {card.cardBrand || 'Card'} ****{card.cardNumberLast4}
                      {card.BankAccount && ` (${card.BankAccount.bankName} - Balance: $${Number(card.BankAccount.balance).toFixed(2)})`}
                      {card.cardType === 'CREDIT' && ` (Limit: $${Number(card.creditLimit).toFixed(2)})`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  💳 {t('debitCardExplanation')}
                </p>
                </div>
              )}
              
              {/* ✅ Info message for CREDIT_CARD AP */}
              {selectedAP.type === 'CREDIT_CARD_PURCHASE' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">💳</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        {t('creditCardPayment')}
                      </p>
                      <p className="text-xs text-blue-700 mb-2">
                        This payment will automatically restore your credit limit on the card used for the original purchase.
                      </p>
                      <div className="bg-white rounded p-2 text-xs">
                        <p className="text-gray-600">
                          <strong>{t('cardLabel')}</strong> {selectedAP.cardIssuer || t('creditCard')}
                        </p>
                        <p className="text-gray-600">
                          <strong>{t('whatHappens')}</strong> {t('creditLimitRestored')} ${Number(selectedAP.balanceAmount).toFixed(2)}
                        </p>
                      </div>
                      <p className="text-xs text-blue-600 mt-2 italic">
                        💡 {t('noCardSelectionNeeded')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('paymentAmount')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t('enterAmount')}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={submitPayment}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {selectedAP?.type === 'CREDIT_CARD_PURCHASE' 
                    ? `✓ ${t('confirmPaymentRestoreCredit')}` 
                    : t('confirmPayment')}
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedAP(null);
                    setPaymentAmount('');
                    setSelectedCardId('');
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

export default AccountsPayablePage;
