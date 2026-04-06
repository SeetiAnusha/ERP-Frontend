import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, TrendingUp, DollarSign, Calendar, MapPin, Phone, Mail, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import { formatNumber } from '../utils/formatNumber';

interface Bank {
  id: number;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  totalLoaned: number;
  outstandingDebt: number;
  storesCount: number;
  lastLoan: string | null;
  storeBreakdown: {
    storeName: string;
    storeLocation: string;
    totalAmount: number;
    transactionCount: number;
    lastDate: string;
    percentage: number;
  }[];
  allLoans: {
    id: number;
    amount: number;
    date: string;
    storeName: string;
    storeLocation: string;
    registrationNumber: string;
    status: string;
    notes: string;
  }[];
}

interface BankSummary {
  totalBanks: number;
  totalLoaned: number;
  totalOutstanding: number;
  averageLoan: number;
  topBank: Bank | null;
  recentLoansCount: number;
  recentLoansAmount: number;
}

const Banks = () => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [summary, setSummary] = useState<BankSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  useEffect(() => {
    fetchBanks();
    fetchSummary();
  }, []);

  // ✅ MEMOIZED: Fetch banks
  const fetchBanks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/banks');
      setBanks(response.data);
    } catch (error) {
      console.error('Error fetching banks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ MEMOIZED: Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const response = await api.get('/banks/summary/statistics');
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching bank summary:', error);
    }
  }, []);

  // ✅ MEMOIZED: Handle refresh
  const handleRefresh = useCallback(() => {
    fetchBanks();
    fetchSummary();
  }, [fetchBanks, fetchSummary]);

  if (loading) {
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
              <Building2 className="text-blue-600" />
              Banks & Lenders
            </h1>
            <p className="text-gray-600 mt-1">Manage and track all bank loans and financing</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Banks</p>
                <p className="text-2xl font-bold text-blue-700">{summary.totalBanks}</p>
              </div>
              <Building2 className="text-blue-400 text-3xl" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Loaned</p>
                <p className="text-2xl font-bold text-green-700">{formatNumber(summary.totalLoaned)}</p>
              </div>
              <TrendingUp className="text-green-400 text-3xl" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Outstanding Debt</p>
                <p className="text-2xl font-bold text-red-700">{formatNumber(summary.totalOutstanding)}</p>
              </div>
              <DollarSign className="text-red-400 text-3xl" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Average Loan</p>
                <p className="text-2xl font-bold text-purple-700">{formatNumber(summary.averageLoan)}</p>
              </div>
              <Calendar className="text-purple-400 text-3xl" />
            </div>
          </div>
        </div>
      )}

      {/* Banks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {banks.map(bank => (
          <motion.div
            key={bank.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setSelectedBank(bank)}
          >
            {/* Bank Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">{bank.name}</h3>
                  <p className="text-blue-100 text-sm">{bank.code}</p>
                </div>
                <Building2 className="text-blue-200 text-2xl" />
              </div>
            </div>

            {/* Bank Details */}
            <div className="p-4 space-y-3">
              {/* Contact Info */}
              {bank.contactPerson && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="w-4 h-4" />
                  {bank.contactPerson}
                </div>
              )}
              {bank.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {bank.phone}
                </div>
              )}
              {bank.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  {bank.email}
                </div>
              )}

              {/* Loan Summary */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Loaned:</span>
                  <span className="font-semibold text-blue-600">{formatNumber(bank.totalLoaned)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Outstanding:</span>
                  <span className="font-semibold text-red-600">{formatNumber(bank.outstandingDebt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stores Financed:</span>
                  <span className="font-medium">{bank.storesCount}</span>
                </div>
                {bank.lastLoan && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Loan:</span>
                    <span className="text-sm">{new Date(bank.lastLoan).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Store Breakdown */}
              {bank.storeBreakdown.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Loan Breakdown:</h4>
                  <div className="space-y-1">
                    {bank.storeBreakdown.slice(0, 3).map((store, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {store.storeName}:
                        </span>
                        <span className="font-medium">{formatNumber(store.totalAmount)} ({store.percentage.toFixed(1)}%)</span>
                      </div>
                    ))}
                    {bank.storeBreakdown.length > 3 && (
                      <p className="text-xs text-gray-500">+{bank.storeBreakdown.length - 3} more stores</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {banks.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Banks Found</h3>
          <p className="text-gray-500">No loan transactions have been recorded yet.</p>
        </div>
      )}

      {/* Bank Detail Modal */}
      {selectedBank && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{selectedBank.name} - Loan Details</h2>
                <button
                  onClick={() => setSelectedBank(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Detailed Loan History */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-600 text-sm font-medium">Total Loaned</p>
                    <p className="text-2xl font-bold text-blue-700">{formatNumber(selectedBank.totalLoaned)}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-red-600 text-sm font-medium">Outstanding Debt</p>
                    <p className="text-2xl font-bold text-red-700">{formatNumber(selectedBank.outstandingDebt)}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-green-600 text-sm font-medium">Total Loans</p>
                    <p className="text-2xl font-bold text-green-700">{selectedBank.allLoans.length}</p>
                  </div>
                </div>

                {/* Loan History Table */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Loan History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Registration #</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Store</th>
                          <th className="border border-gray-200 px-4 py-2 text-right">Amount</th>
                          <th className="border border-gray-200 px-4 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBank.allLoans.map(loan => (
                          <tr key={loan.id} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2">
                              {new Date(loan.date).toLocaleDateString()}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                              {loan.registrationNumber}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              {loan.storeName}
                              {loan.storeLocation && (
                                <div className="text-xs text-gray-500">{loan.storeLocation}</div>
                              )}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right font-semibold text-blue-600">
                              {formatNumber(loan.amount)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                loan.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                loan.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {loan.status}
                              </span>
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

export default Banks;