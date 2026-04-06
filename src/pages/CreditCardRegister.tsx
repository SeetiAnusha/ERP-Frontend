import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaCreditCard, FaSearch, FaArrowUp, FaArrowDown, FaEye, FaCalendarAlt } from 'react-icons/fa';
import { formatNumber } from '../utils/formatNumber';
import { useCreditCardTransactions, useCards } from '../hooks/queries/useSharedData';

interface CreditCardTransaction {
  id: number;
  registrationNumber: string;
  registrationDate: string;
  transactionType: 'CHARGE' | 'PAYMENT' | 'REFUND';
  amount: number;
  relatedDocumentType: string;
  relatedDocumentNumber: string;
  supplierName?: string;
  supplierRnc?: string;
  description: string;
  cardId: number;
  cardIssuer?: string;
  cardBrand?: string;
  cardNumberLast4?: string;
  authorizationCode?: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// interface CreditCard {
//   id: number;
//   code: string;
//   cardName: string;
//   cardBrand: string;
//   cardNumberLast4: string;
//   creditLimit: number;
//   usedCredit: number;
//   status: 'ACTIVE' | 'INACTIVE';
// }

const CreditCardRegister = () => {
  // ✅ React Query Hooks
  const { data: transactions = [], isLoading: isLoadingTransactions, isError, refetch: refetchTransactions } = useCreditCardTransactions();
  const { data: allCards = [] } = useCards();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCard, setFilterCard] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [selectedTransaction, setSelectedTransaction] = useState<CreditCardTransaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // ✅ Memoized: Filter credit cards only
  const creditCards = useMemo(() => {
    return allCards.filter((card: any) => 
      card.cardType === 'CREDIT' && card.status === 'ACTIVE'
    );
  }, [allCards]);

  // ✅ Memoized: Transaction type utilities
  const getTransactionTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'CHARGE':
        return <FaArrowUp className="text-red-500" />;
      case 'PAYMENT':
        return <FaArrowDown className="text-green-500" />;
      case 'REFUND':
        return <FaArrowDown className="text-blue-500" />;
      default:
        return <FaCreditCard className="text-gray-500" />;
    }
  }, []);

  const getTransactionTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'CHARGE':
        return 'text-red-600 bg-red-50';
      case 'PAYMENT':
        return 'text-green-600 bg-green-50';
      case 'REFUND':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }, []);

  // ✅ Memoized: Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction: any) => {
      const matchesSearch = Object.values(transaction).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const matchesCard = filterCard === 'All' || transaction.cardId.toString() === filterCard;
      const matchesType = filterType === 'All' || transaction.transactionType === filterType;
      
      return matchesSearch && matchesCard && matchesType;
    });
  }, [transactions, searchTerm, filterCard, filterType]);

  // ✅ Memoized: View details handler
  const handleViewDetails = useCallback((transaction: CreditCardTransaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  }, []);

  // ✅ Memoized: Credit calculations
  const getTotalUsedCredit = useMemo(() => {
    return creditCards.reduce((total, card) => total + Number(card.usedCredit || 0), 0);
  }, [creditCards]);

  const getTotalCreditLimit = useMemo(() => {
    return creditCards.reduce((total, card) => total + Number(card.creditLimit || 0), 0);
  }, [creditCards]);

  const getAvailableCredit = useMemo(() => {
    return getTotalCreditLimit - getTotalUsedCredit;
  }, [getTotalCreditLimit, getTotalUsedCredit]);

  // ✅ Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">Error loading credit card transactions</p>
          <button
            onClick={() => refetchTransactions()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaCreditCard className="text-blue-600" />
            Credit Card Register
          </h1>
          <p className="text-gray-600 mt-2">Track all credit card transactions and usage</p>
        </div>
      </div>

      {/* Credit Card Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Credit Limit</p>
              <p className="text-2xl font-bold">{formatNumber(getTotalCreditLimit)}</p>
            </div>
            <FaCreditCard className="text-3xl text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Used Credit</p>
              <p className="text-2xl font-bold">{formatNumber(getTotalUsedCredit)}</p>
            </div>
            <FaArrowUp className="text-3xl text-red-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Available Credit</p>
              <p className="text-2xl font-bold">{formatNumber(getAvailableCredit)}</p>
            </div>
            <FaArrowDown className="text-3xl text-green-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Transactions</p>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </div>
            <FaCalendarAlt className="text-3xl text-purple-200" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Card Filter */}
          <div>
            <select
              value={filterCard}
              onChange={(e) => setFilterCard(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Credit Cards</option>
              {creditCards.map((card) => (
                <option key={card.id} value={card.id.toString()}>
                  {card.cardName} - {card.cardBrand} ****{card.cardNumberLast4}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Transaction Types</option>
              <option value="CHARGE">Charges</option>
              <option value="PAYMENT">Payments</option>
              <option value="REFUND">Refunds</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        {isLoadingTransactions ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading credit card transactions...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">REGISTRATION #</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">DATE</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">TYPE</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">CARD</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">DESCRIPTION</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">DOCUMENT</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">AMOUNT</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <FaCreditCard className="mx-auto text-4xl text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No credit card transactions found</p>
                      <p className="text-sm">Credit card transactions will appear here when payments are made</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction: any, index: number) => (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium">{transaction.registrationNumber}</td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(transaction.registrationDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.transactionType)}`}>
                          {getTransactionTypeIcon(transaction.transactionType)}
                          {transaction.transactionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium">{transaction.cardBrand} ****{transaction.cardNumberLast4 || 'N/A'}</p>
                          <p className="text-gray-500 text-xs">{transaction.cardIssuer}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          {transaction.supplierName && (
                            <p className="text-gray-500 text-xs">{transaction.supplierName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium">{transaction.relatedDocumentType}</p>
                          <p className="text-gray-500 text-xs">{transaction.relatedDocumentNumber}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-right">
                        <span className={transaction.transactionType === 'CHARGE' ? 'text-red-600' : 'text-green-600'}>
                          {transaction.transactionType === 'CHARGE' ? '+' : '-'}{formatNumber(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewDetails(transaction)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FaEye size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaCreditCard className="text-blue-600" />
                Transaction Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registration Number</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.registrationNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedTransaction.registrationDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(selectedTransaction.transactionType)}`}>
                    {getTransactionTypeIcon(selectedTransaction.transactionType)}
                    {selectedTransaction.transactionType}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <p className="text-lg font-bold text-gray-900">{formatNumber(selectedTransaction.amount)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-900">{selectedTransaction.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Related Document</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.relatedDocumentType}</p>
                  <p className="text-xs text-gray-500">{selectedTransaction.relatedDocumentNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Card Information</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.cardBrand} ****{selectedTransaction.cardNumberLast4}</p>
                  <p className="text-xs text-gray-500">{selectedTransaction.cardIssuer}</p>
                </div>
              </div>

              {selectedTransaction.supplierName && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.supplierName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier RNC</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.supplierRnc || 'N/A'}</p>
                  </div>
                </div>
              )}

              {(selectedTransaction.authorizationCode || selectedTransaction.referenceNumber) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedTransaction.authorizationCode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Authorization Code</label>
                      <p className="text-sm text-gray-900">{selectedTransaction.authorizationCode}</p>
                    </div>
                  )}
                  {selectedTransaction.referenceNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reference Number</label>
                      <p className="text-sm text-gray-900">{selectedTransaction.referenceNumber}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedTransaction.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CreditCardRegister;