import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Building2, Users, Calendar, MapPin, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import { formatNumber } from '../utils/formatNumber';

interface InvestmentSummaryData {
  investors: {
    id: number;
    name: string;
    code: string;
    type: string;
    totalInvested: number;
    storesCount: number;
    lastInvestment: string;
    outstandingDebt: number;
    investments: {
      storeId: number;
      storeName: string;
      storeLocation: string;
      amount: number;
      percentage: number;
      transactionCount: number;
      lastDate: string;
    }[];
  }[];
  banks: {
    id: number;
    name: string;
    code: string;
    type: string;
    totalLoaned: number;
    storesCount: number;
    lastLoan: string;
    outstandingDebt: number;
    loans: {
      storeId: number;
      storeName: string;
      storeLocation: string;
      amount: number;
      percentage: number;
      transactionCount: number;
      lastDate: string;
    }[];
  }[];
  stores: {
    id: number;
    name: string;
    location: string;
    currentBalance: number;
    totalInvestments: number;
    totalLoans: number;
    totalFinancing: number;
    investments: {
      financerId: number;
      financerName: string;
      amount: number;
      transactionCount: number;
    }[];
    loans: {
      financerId: number;
      financerName: string;
      amount: number;
      transactionCount: number;
    }[];
  }[];
  recentActivity: {
    date: string;
    type: string;
    financerName: string;
    financerType: string;
    storeName: string;
    storeLocation: string;
    amount: number;
    storeBalanceAfter: number;
    registrationNumber: string;
  }[];
}

const InvestmentSummary = forwardRef((_props, ref) => {
  const [summaryData, setSummaryData] = useState<InvestmentSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'investors' | 'banks' | 'stores' | 'recent'>('investors');

  useEffect(() => {
    fetchInvestmentSummary();
  }, []);

  const fetchInvestmentSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get('/investment-summary');
      setSummaryData(response.data);
      console.log('Investment Summary Data:', response.data); // Debug log
    } catch (error) {
      console.error('Error fetching investment summary:', error);
      // Set empty data structure if API fails
      setSummaryData({
        investors: [],
        banks: [],
        stores: [],
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refresh: fetchInvestmentSummary
  }));

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <p className="text-gray-500 text-center">No investment data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Investment & Loan Summary
            </h2>
            <p className="text-blue-100 mt-1">Track investments and loans across all stores</p>
          </div>
          <button
            onClick={fetchInvestmentSummary}
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { key: 'investors', label: 'Investors', icon: Users, count: summaryData.investors.length },
            { key: 'banks', label: 'Banks', icon: Building2, count: summaryData.banks.length },
            { key: 'stores', label: 'Stores', icon: MapPin, count: summaryData.stores.length },
            { key: 'recent', label: 'Recent Activity', icon: Calendar, count: summaryData.recentActivity.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                selectedTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {selectedTab === 'investors' && (
          <InvestorCards investors={summaryData.investors} />
        )}
        {selectedTab === 'banks' && (
          <BankCards banks={summaryData.banks} />
        )}
        {selectedTab === 'stores' && (
          <StoreCards stores={summaryData.stores} />
        )}
        {selectedTab === 'recent' && (
          <RecentActivity activities={summaryData.recentActivity} />
        )}
      </div>
    </div>
  );
});

// Investor Cards Component
const InvestorCards = ({ investors }: { investors: InvestmentSummaryData['investors'] }) => {
  if (investors.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No investors found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {investors.map(investor => (
        <motion.div
          key={investor.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{investor.name}</h3>
                <p className="text-sm text-gray-500">{investor.code}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Invested:</span>
              <span className="font-semibold text-green-600">{formatNumber(investor.totalInvested)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Stores:</span>
              <span className="font-medium">{investor.storesCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Outstanding:</span>
              <span className="font-semibold text-red-600">{formatNumber(investor.outstandingDebt)}</span>
            </div>
            {investor.lastInvestment && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Investment:</span>
                <span className="text-sm">{new Date(investor.lastInvestment).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {investor.investments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Investment Breakdown:</h4>
              <div className="space-y-2">
                {investor.investments.map(investment => (
                  <div key={investment.storeId} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{investment.storeName}:</span>
                    <span className="font-medium">{formatNumber(investment.amount)} ({investment.percentage.toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

// Bank Cards Component
const BankCards = ({ banks }: { banks: InvestmentSummaryData['banks'] }) => {
  if (banks.length === 0) {
    return (
      <div className="text-center py-8">
        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No banks found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {banks.map(bank => (
        <motion.div
          key={bank.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{bank.name}</h3>
                <p className="text-sm text-gray-500">{bank.code}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Loaned:</span>
              <span className="font-semibold text-blue-600">{formatNumber(bank.totalLoaned)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Stores:</span>
              <span className="font-medium">{bank.storesCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Outstanding:</span>
              <span className="font-semibold text-red-600">{formatNumber(bank.outstandingDebt)}</span>
            </div>
            {bank.lastLoan && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Loan:</span>
                <span className="text-sm">{new Date(bank.lastLoan).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {bank.loans.length > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Loan Breakdown:</h4>
              <div className="space-y-2">
                {bank.loans.map(loan => (
                  <div key={loan.storeId} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{loan.storeName}:</span>
                    <span className="font-medium">{formatNumber(loan.amount)} ({loan.percentage.toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

// Store Cards Component
const StoreCards = ({ stores }: { stores: InvestmentSummaryData['stores'] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stores.map(store => (
        <motion.div
          key={store.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{store.name}</h3>
                <p className="text-sm text-gray-500">{store.location}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Current Balance:</span>
              <span className={`font-semibold ${store.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatNumber(store.currentBalance)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Financing:</span>
              <span className="font-semibold text-purple-600">{formatNumber(store.totalFinancing)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Investments:</span>
              <span className="font-medium text-green-600">{formatNumber(store.totalInvestments)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Loans:</span>
              <span className="font-medium text-blue-600">{formatNumber(store.totalLoans)}</span>
            </div>
          </div>

          {(store.investments.length > 0 || store.loans.length > 0) && (
            <div className="mt-4 pt-4 border-t border-purple-200">
              {store.investments.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Investors:</h4>
                  <div className="space-y-1">
                    {store.investments.map(investment => (
                      <div key={investment.financerId} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{investment.financerName}:</span>
                        <span className="font-medium text-green-600">{formatNumber(investment.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {store.loans.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Lenders:</h4>
                  <div className="space-y-1">
                    {store.loans.map(loan => (
                      <div key={loan.financerId} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{loan.financerName}:</span>
                        <span className="font-medium text-blue-600">{formatNumber(loan.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

// Recent Activity Component
const RecentActivity = ({ activities }: { activities: InvestmentSummaryData['recentActivity'] }) => {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Financer</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Store</th>
            <th className="text-right py-3 px-4 font-medium text-gray-700">Amount</th>
            <th className="text-right py-3 px-4 font-medium text-gray-700">Store Balance</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity, index) => (
            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4 text-sm">
                {new Date(activity.date).toLocaleDateString()}
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activity.type === 'CONTRIBUTION' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {activity.type === 'CONTRIBUTION' ? '💼 Investment' : '🏛️ Loan'}
                </span>
              </td>
              <td className="py-3 px-4 text-sm">
                <div>
                  <div className="font-medium">{activity.financerName}</div>
                  <div className="text-gray-500 text-xs">{activity.financerType}</div>
                </div>
              </td>
              <td className="py-3 px-4 text-sm">
                <div>
                  <div className="font-medium">{activity.storeName}</div>
                  <div className="text-gray-500 text-xs">{activity.storeLocation}</div>
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <span className={`font-semibold ${
                  activity.type === 'CONTRIBUTION' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {formatNumber(activity.amount)}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <span className={`font-medium ${
                  activity.storeBalanceAfter >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatNumber(activity.storeBalanceAfter)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvestmentSummary;