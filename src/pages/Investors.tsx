import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, DollarSign, Calendar, MapPin, Phone, Mail, RefreshCw, CheckCircle, Edit } from 'lucide-react';
import api from '../api/axios';
import { formatNumber } from '../utils/formatNumber';
import { toast } from 'sonner';
import { useInvestors, useInvestorsSummary } from '../hooks/queries/useSharedData';

interface Financer {
  id: number;
  code: string;
  name: string;
  type: string; // INVESTOR, BANK, OTHER
  contactPerson: string;
  phone: string;
  email: string;
  totalProvided: number;
  outstandingDebt: number;
  storesCount: number;
  lastTransaction: string | null;
  storeBreakdown: {
    storeName: string;
    storeLocation: string;
    totalAmount: number;
    transactionCount: number;
    lastDate: string;
    percentage: number;
  }[];
  allTransactions: {
    id: number;
    amount: number;
    paidAmount?: number;
    date: string;
    storeName: string;
    storeLocation: string;
    registrationNumber: string;
    status: string;
    notes: string;
    type: string; // CONTRIBUTION or LOAN
    transactionType: string;
  }[];
}

// interface FinancerSummary {
//   totalFinancers: number;
//   totalProvided: number;
//   totalOutstanding: number;
//   averageProvided: number;
//   topFinancer: Financer | null;
//   recentTransactionsCount: number;
//   recentTransactionsAmount: number;
//   investorCount: number;
//   bankCount: number;
//   otherCount: number;
//   investorAmount: number;
//   bankAmount: number;
//   otherAmount: number;
// }

const Investors = () => {
  // ✅ React Query Hooks
  const { data: financers = [], isLoading, isError, refetch: refetchFinancers } = useInvestors();
  const { data: summary, refetch: refetchSummary } = useInvestorsSummary();
  
  const [selectedFinancer, setSelectedFinancer] = useState<Financer | null>(null);
  const [editingPayment, setEditingPayment] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  // ✅ Memoized: Handle refresh
  const handleRefresh = useCallback(() => {
    refetchFinancers();
    refetchSummary();
  }, [refetchFinancers, refetchSummary]);

  // ✅ Memoized: Handle mark as paid
  const handleMarkAsPaid = useCallback(async (investmentId: number) => {
    try {
      await api.put(`/investors/investments/${investmentId}/mark-paid`);
      toast.success('Investment marked as paid successfully');
      refetchFinancers();
      if (selectedFinancer) {
        // Refresh the selected investor details
        const updatedInvestors = await api.get('/investors');
        const updatedInvestor = updatedInvestors.data.find((inv: Financer) => inv.id === selectedFinancer.id);
        if (updatedInvestor) {
          setSelectedFinancer(updatedInvestor);
        }
      }
    } catch (error) {
      console.error('Error marking investment as paid:', error);
      toast.error('Failed to mark investment as paid');
    }
  }, [selectedFinancer, refetchFinancers]);

  // ✅ Memoized: Handle update payment
  const handleUpdatePayment = useCallback(async (investmentId: number) => {
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount < 0) {
        toast.error('Please enter a valid payment amount');
        return;
      }

      await api.put(`/investors/investments/${investmentId}/payment`, {
        paidAmount: amount,
        status: 'Partial' // Will be calculated automatically in backend
      });
      
      toast.success('Payment updated successfully');
      setEditingPayment(null);
      setPaymentAmount('');
      refetchFinancers();
      
      if (selectedFinancer) {
        // Refresh the selected investor details
        const updatedInvestors = await api.get('/investors');
        const updatedInvestor = updatedInvestors.data.find((inv: Financer) => inv.id === selectedFinancer.id);
        if (updatedInvestor) {
          setSelectedFinancer(updatedInvestor);
        }
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment');
    }
  }, [paymentAmount, selectedFinancer, refetchFinancers]);

  // ✅ Memoized: Handle fix investment status
  const handleFixInvestmentStatus = useCallback(async () => {
    try {
      const response = await api.post('/investors/fix-status');
      toast.success(`Fixed ${response.data.fixedCount} investment entries`);
      refetchFinancers();
      refetchSummary();
    } catch (error) {
      console.error('Error fixing investment status:', error);
      toast.error('Failed to fix investment status');
    }
  }, [refetchFinancers, refetchSummary]);

  // ✅ Error state
  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">Error loading investors</p>
          <button
            onClick={() => refetchFinancers()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Users className="text-green-600" />
              Investors
            </h1>
            <p className="text-gray-600 mt-1">Manage and track all investor investments</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleFixInvestmentStatus}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              title="Fix existing investment status (mark contributions as paid)"
            >
              <CheckCircle className="w-4 h-4" />
              Fix Status
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Investors</p>
                <p className="text-2xl font-bold text-green-700">{summary.totalFinancers}</p>
              </div>
              <Users className="text-green-400 text-3xl" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Invested</p>
                <p className="text-2xl font-bold text-blue-700">{formatNumber(summary.totalProvided)}</p>
              </div>
              <TrendingUp className="text-blue-400 text-3xl" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Outstanding Debt</p>
                <p className="text-2xl font-bold text-purple-700">{formatNumber(summary.totalOutstanding)}</p>
              </div>
              <DollarSign className="text-purple-400 text-3xl" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Average Investment</p>
                <p className="text-2xl font-bold text-orange-700">{formatNumber(summary.averageProvided)}</p>
              </div>
              <Calendar className="text-orange-400 text-3xl" />
            </div>
          </div>
        </div>
      )}

      {/* Investors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {financers.map(investor => (
          <motion.div
            key={investor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setSelectedFinancer(investor)}
          >
            {/* Investor Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">{investor.name}</h3>
                  <p className="text-green-100 text-sm">{investor.code}</p>
                </div>
                <Users className="text-green-200 text-2xl" />
              </div>
            </div>

            {/* Investor Details */}
            <div className="p-4 space-y-3">
              {/* Contact Info */}
              {investor.contactPerson && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  {investor.contactPerson}
                </div>
              )}
              {investor.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {investor.phone}
                </div>
              )}
              {investor.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  {investor.email}
                </div>
              )}

              {/* Investment Summary */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Invested:</span>
                  <span className="font-semibold text-green-600">{formatNumber(investor.totalProvided)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Outstanding:</span>
                  <span className="font-semibold text-red-600">{formatNumber(investor.outstandingDebt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stores:</span>
                  <span className="font-medium">{investor.storesCount}</span>
                </div>
                {investor.lastTransaction && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Investment:</span>
                    <span className="text-sm">{new Date(investor.lastTransaction).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Store Breakdown */}
              {investor.storeBreakdown.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Investment Breakdown:</h4>
                  <div className="space-y-1">
                    {investor.storeBreakdown.slice(0, 3).map((store: Financer['storeBreakdown'][0], index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {store.storeName}:
                        </span>
                        <span className="font-medium">{formatNumber(store.totalAmount)} ({store.percentage.toFixed(1)}%)</span>
                      </div>
                    ))}
                    {investor.storeBreakdown.length > 3 && (
                      <p className="text-xs text-gray-500">+{investor.storeBreakdown.length - 3} more stores</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {financers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Investors Found</h3>
          <p className="text-gray-500">No investment transactions have been recorded yet.</p>
        </div>
      )}

      {/* Investor Detail Modal */}
      {selectedFinancer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{selectedFinancer.name} - Investment Details</h2>
                <button
                  onClick={() => setSelectedFinancer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Detailed Investment History */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-green-600 text-sm font-medium">Total Invested</p>
                    <p className="text-2xl font-bold text-green-700">{formatNumber(selectedFinancer.totalProvided)}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-red-600 text-sm font-medium">Outstanding Debt</p>
                    <p className="text-2xl font-bold text-red-700">{formatNumber(selectedFinancer.outstandingDebt)}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-600 text-sm font-medium">Total Transactions</p>
                    <p className="text-2xl font-bold text-blue-700">{selectedFinancer.allTransactions.length}</p>
                  </div>
                </div>

                {/* Investment History Table */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Investment History</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md">
                      <p className="text-blue-800 text-sm">
                        <strong>Note:</strong> Investments are automatically marked as "Paid" when money is received in the cash register. 
                        Manual actions are only for corrections.
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Registration #</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Store</th>
                          <th className="border border-gray-200 px-4 py-2 text-right">Amount</th>
                          <th className="border border-gray-200 px-4 py-2 text-right">Paid</th>
                          <th className="border border-gray-200 px-4 py-2 text-right">Balance</th>
                          <th className="border border-gray-200 px-4 py-2 text-center">Status</th>
                          <th className="border border-gray-200 px-4 py-2 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedFinancer.allTransactions.map(investment => (
                          <tr key={investment.id} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2">
                              {new Date(investment.date).toLocaleDateString()}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                              {investment.registrationNumber}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              {investment.storeName}
                              {investment.storeLocation && (
                                <div className="text-xs text-gray-500">{investment.storeLocation}</div>
                              )}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right font-semibold text-green-600">
                              {formatNumber(investment.amount)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right">
                              {editingPayment === investment.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="w-20 px-2 py-1 border rounded text-sm"
                                    placeholder="0.00"
                                    step="0.01"
                                  />
                                  <button
                                    onClick={() => handleUpdatePayment(investment.id)}
                                    className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingPayment(null);
                                      setPaymentAmount('');
                                    }}
                                    className="bg-gray-400 text-white px-2 py-1 rounded text-xs hover:bg-gray-500"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <span className="font-medium">
                                  {formatNumber(investment.paidAmount || 0)}
                                </span>
                              )}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right font-medium text-red-600">
                              {formatNumber((investment.amount || 0) - (investment.paidAmount || 0))}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                investment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                investment.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                investment.status === 'Partial' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {investment.status}
                              </span>
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {investment.status === 'Paid' ? (
                                  <span className="text-green-600 text-xs font-medium flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    ✓ Completed
                                  </span>
                                ) : (
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="text-orange-600 text-xs font-medium">Manual Correction Only</span>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleMarkAsPaid(investment.id)}
                                        className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 flex items-center gap-1"
                                        title="Mark as Paid (Manual Correction)"
                                      >
                                        <CheckCircle className="w-3 h-3" />
                                        Paid
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingPayment(investment.id);
                                          setPaymentAmount((investment.paidAmount || 0).toString());
                                        }}
                                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 flex items-center gap-1"
                                        title="Edit Payment (Manual Correction)"
                                      >
                                        <Edit className="w-3 h-3" />
                                        Edit
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Investors;