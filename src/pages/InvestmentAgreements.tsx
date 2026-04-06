import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, TrendingUp, DollarSign, RefreshCw, Users, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { formatNumber } from '../utils/formatNumber';
import { toast } from 'sonner';
import { useInvestmentAgreements, useInvestmentSummary, useFinancers } from '../hooks/queries/useSharedData';
import { QUERY_KEYS } from '../lib/queryKeys';

interface InvestmentAgreement {
  id: number;
  agreementNumber: string;
  agreementDate: string;
  investorId: number;
  investorName: string;
  agreementType: 'INVESTMENT' | 'LOAN';
  totalCommittedAmount: number;
  receivedAmount: number;
  balanceAmount: number;
  interestRate?: number;
  maturityDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  terms?: string;
  notes?: string;
}

interface AgreementSummary {
  totalAgreements: number;
  activeAgreements: number;
  completedAgreements: number;
  totalCommitted: number;
  totalReceived: number;
  totalPending: number;
  investmentCount: number;
  loanCount: number;
  investmentAmount: number;
  loanAmount: number;
}

interface Financer {
  id: number;
  code: string;
  name: string;
  type: string;
}

const InvestmentAgreements = () => {
  // ✅ React Query Hooks
  const { data: agreements = [], isLoading, isError, refetch: refetchAgreements } = useInvestmentAgreements();
  const { data: summary, refetch: refetchSummary } = useInvestmentSummary();
  const { data: financers = [] } = useFinancers();
  const queryClient = useQueryClient();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    agreementDate: new Date().toISOString().split('T')[0],
    investorId: '',
    agreementType: 'INVESTMENT' as 'INVESTMENT' | 'LOAN',
    totalCommittedAmount: '',
    interestRate: '',
    maturityDate: '',
    terms: '',
    notes: '',
  });

  // Clear investor selection when agreement type changes
  useEffect(() => {
    if (formData.investorId) {
      // Clear investor selection when switching between INVESTMENT and LOAN
      setFormData(prev => ({ ...prev, investorId: '' }));
    }
  }, [formData.agreementType]);

  // ✅ Memoized: Handle refresh
  const handleRefresh = useCallback(() => {
    refetchAgreements();
    refetchSummary();
  }, [refetchAgreements, refetchSummary]);

  // ✅ Memoized: Handle create agreement
  const handleCreateAgreement = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!formData.investorId || !formData.totalCommittedAmount) {
        toast.error('Please fill in all required fields');
        return;
      }

      await api.post('/investment-agreements', {
        ...formData,
        totalCommittedAmount: parseFloat(formData.totalCommittedAmount),
        interestRate: formData.interestRate ? parseFloat(formData.interestRate) : null,
      });

      toast.success('Investment agreement created successfully');
      setShowCreateModal(false);
      setFormData({
        agreementDate: new Date().toISOString().split('T')[0],
        investorId: '',
        agreementType: 'INVESTMENT',
        totalCommittedAmount: '',
        interestRate: '',
        maturityDate: '',
        terms: '',
        notes: '',
      });
      // ✅ Invalidate cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.investmentAgreements });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.investmentSummary });
      refetchAgreements();
      refetchSummary();
    } catch (error: any) {
      console.error('Error creating agreement:', error);
      toast.error(error.response?.data?.error || 'Failed to create agreement');
    }
  }, [formData, queryClient, refetchAgreements, refetchSummary]);

  // ✅ Memoized: Handle cleanup
  const handleCleanupAccountsPayable = useCallback(async () => {
    try {
      const response = await api.post('/cleanup-accounts-payable');
      toast.success(`Cleaned up ${response.data.removedCount} incorrect AccountsPayable entries`);
      refetchAgreements();
      refetchSummary();
    } catch (error) {
      console.error('Error cleaning up AccountsPayable:', error);
      toast.error('Failed to cleanup AccountsPayable entries');
    }
  }, [refetchAgreements, refetchSummary]);

  // ✅ Error state
  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">Error loading investment agreements</p>
          <button
            onClick={() => refetchAgreements()}
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
              <FileText className="text-blue-600" />
              Investment Agreements
            </h1>
            <p className="text-gray-600 mt-1">Manage investment and loan agreements before receiving money</p>
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
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Agreement
            </button>
            <button
              onClick={handleCleanupAccountsPayable}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              title="Clean up incorrect AccountsPayable entries for CONTRIBUTION/LOAN transactions"
            >
              <AlertCircle className="w-4 h-4" />
              Cleanup AP
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Agreements</p>
                <p className="text-2xl font-bold text-blue-700">{summary.totalAgreements}</p>
                <p className="text-xs text-blue-500">Active: {summary.activeAgreements}</p>
              </div>
              <FileText className="text-blue-400 text-3xl" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Committed</p>
                <p className="text-2xl font-bold text-green-700">{formatNumber(summary.totalCommitted)}</p>
                <p className="text-xs text-green-500">Received: {formatNumber(summary.totalReceived)}</p>
              </div>
              <TrendingUp className="text-green-400 text-3xl" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Pending Amount</p>
                <p className="text-2xl font-bold text-orange-700">{formatNumber(summary.totalPending)}</p>
                <p className="text-xs text-orange-500">To be received</p>
              </div>
              <DollarSign className="text-orange-400 text-3xl" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Investments vs Loans</p>
                <p className="text-lg font-bold text-purple-700">{summary.investmentCount} / {summary.loanCount}</p>
                <p className="text-xs text-purple-500">Investment / Loan</p>
              </div>
              <Users className="text-purple-400 text-3xl" />
            </div>
          </div>
        </div>
      )}

      {/* Important Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-yellow-600 w-5 h-5 mt-0.5" />
          <div>
            <h3 className="text-yellow-800 font-semibold">Important: Create Agreements Before Cash Transactions</h3>
            <p className="text-yellow-700 text-sm mt-1">
              You must create investment/loan agreements here first, specifying the committed amount. 
              Only then can you receive money in the cash register for these agreements. 
              This prevents random amounts and ensures proper tracking.
            </p>
            <p className="text-yellow-700 text-sm mt-2">
              <strong>Note:</strong> CONTRIBUTION/LOAN transactions are tracked through Cash Register + Investment Agreement only. 
              They should NOT appear in Accounts Payable (which is for credit/unpaid transactions only).
            </p>
          </div>
        </div>
      </div>

      {/* Agreements Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Investment & Loan Agreements</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agreement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Committed</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agreements.map(agreement => {
                const progressPercentage = (agreement.receivedAmount / agreement.totalCommittedAmount) * 100;
                
                return (
                  <tr key={agreement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{agreement.agreementNumber}</div>
                        <div className="text-sm text-gray-500">{new Date(agreement.agreementDate).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{agreement.investorName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        agreement.agreementType === 'INVESTMENT' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {agreement.agreementType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatNumber(agreement.totalCommittedAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                      {formatNumber(agreement.receivedAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-orange-600">
                      {formatNumber(agreement.balanceAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        agreement.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        agreement.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {agreement.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-center">
                        {progressPercentage.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {agreements.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Agreements Found</h3>
            <p className="text-gray-500 mb-4">Create your first investment or loan agreement to get started.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Agreement
            </button>
          </div>
        )}
      </div>

      {/* Create Agreement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Create Investment Agreement</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateAgreement} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Date *</label>
                    <input
                      type="date"
                      value={formData.agreementDate}
                      onChange={(e) => setFormData({ ...formData, agreementDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.agreementType === 'INVESTMENT' ? 'Investor *' : 'Lender *'}
                    </label>
                    <select
                      value={formData.investorId}
                      onChange={(e) => setFormData({ ...formData, investorId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">
                        {formData.agreementType === 'INVESTMENT' ? 'Select Investor' : 'Select Lender'}
                      </option>
                      {financers
                        .filter(financer => {
                          // Filter based on agreement type
                          if (formData.agreementType === 'INVESTMENT') {
                            // For investments, show INVESTOR type financers
                            return financer.type === 'INVESTOR';
                          } else if (formData.agreementType === 'LOAN') {
                            // For loans, show BANK and OTHER type financers
                            return financer.type === 'BANK' || financer.type === 'OTHER';
                          }
                          return false;
                        })
                        .map(financer => (
                          <option key={financer.id} value={financer.id}>
                            {financer.name} ({financer.code}) - {financer.type}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.agreementType === 'INVESTMENT' 
                        ? '💰 Showing INVESTOR type financers only'
                        : '🏦 Showing BANK and OTHER type financers (lenders)'
                      }
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Type *</label>
                    <select
                      value={formData.agreementType}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        agreementType: e.target.value as 'INVESTMENT' | 'LOAN',
                        investorId: '' // Clear investor selection when type changes
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="INVESTMENT">Investment</option>
                      <option value="LOAN">Loan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Committed Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.totalCommittedAmount}
                      onChange={(e) => setFormData({ ...formData, totalCommittedAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  {formData.agreementType === 'LOAN' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.interestRate}
                          onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Maturity Date</label>
                        <input
                          type="date"
                          value={formData.maturityDate}
                          onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                  <textarea
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter agreement terms and conditions..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Agreement
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default InvestmentAgreements;