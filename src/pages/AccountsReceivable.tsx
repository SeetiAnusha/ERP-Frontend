import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, DollarSign, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import api from '../api/axios';
import { AccountsReceivable } from '../types/accountsTypes';
import { notify, handleApiError } from '../utils/notifications';

const AccountsReceivablePage = () => {
  const [accountsReceivable, setAccountsReceivable] = useState<AccountsReceivable[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAR, setSelectedAR] = useState<AccountsReceivable | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

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
    setPaymentAmount(ar.balanceAmount.toString());
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    if (!selectedAR || !paymentAmount) return;
    
    try {
      await api.post(`/accounts-receivable/${selectedAR.id}/record-payment`, {
        amount: parseFloat(paymentAmount),
        receivedDate: new Date(),
      });
      notify.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setSelectedAR(null);
      setPaymentAmount('');
      fetchAccountsReceivable();
    } catch (error) {
      handleApiError(error, 'Recording payment');
    }
  };

  const filteredAR = accountsReceivable.filter((ar) => {
    const matchesSearch = Object.values(ar).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = filterStatus === 'All' || ar.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Accounts Receivable</h1>
        <p className="text-gray-600">Money owed to you (from credit card sales, client credits, etc.)</p>
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
              <p className="text-sm text-blue-600 font-medium">Total Amount</p>
              <p className="text-2xl font-bold text-blue-900">${totalAmount.toFixed(2)}</p>
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
              <p className="text-sm text-green-600 font-medium">Received</p>
              <p className="text-2xl font-bold text-green-900">${totalReceived.toFixed(2)}</p>
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
              <p className="text-sm text-orange-600 font-medium">Balance (Pending)</p>
              <p className="text-2xl font-bold text-orange-900">${totalBalance.toFixed(2)}</p>
            </div>
            <Clock className="text-orange-600" size={32} />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search..."
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
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Partial">Partial</option>
          <option value="Received">Received</option>
        </select>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg overflow-x-auto"
      >
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">REG. NUMBER</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">DATE</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">TYPE</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">RELATED DOC</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">CLIENT/CARD</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">AMOUNT</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">RECEIVED</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">BALANCE</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">STATUS</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredAR.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                  No accounts receivable found
                </td>
              </tr>
            ) : (
              filteredAR.map((ar, index) => (
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
                    {ar.relatedDocumentType} - {ar.relatedDocumentNumber}
                  </td>
                  <td className="px-6 py-4 text-sm">{ar.clientName || ar.cardNetwork || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-right">${Number(ar.amount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-right text-green-600">
                    ${Number(ar.receivedAmount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-right text-orange-600">
                    ${Number(ar.balanceAmount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">{getStatusBadge(ar.status)}</td>
                  <td className="px-6 py-4 text-center">
                    {ar.status !== 'Received' && (
                      <button
                        onClick={() => handleRecordPayment(ar)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Plus size={16} />
                        Record Payment
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Payment Modal */}
      {showPaymentModal && selectedAR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold mb-4">Record Payment</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Document: {selectedAR.relatedDocumentNumber}</p>
                <p className="text-sm text-gray-600">Client: {selectedAR.clientName || selectedAR.cardNetwork}</p>
                <p className="text-sm text-gray-600">Total Amount: ${Number(selectedAR.amount).toFixed(2)}</p>
                <p className="text-sm text-gray-600">Already Received: ${Number(selectedAR.receivedAmount).toFixed(2)}</p>
                <p className="text-sm font-semibold text-orange-600">Balance: ${Number(selectedAR.balanceAmount).toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={submitPayment}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Confirm Payment
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedAR(null);
                    setPaymentAmount('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
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
