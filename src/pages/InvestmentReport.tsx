import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaFileExcel } from 'react-icons/fa';
import { useInvestmentReport } from '../hooks/queries/useSharedData';

interface InvestmentItem {
  id: number;
  code: string;
  name: string;
  type: string;
  acquisitionDate: string;
  acquisitionCost: number;
  currentValue: number;
  quantity: number;
  unitCost: number;
  gainLoss: number;
  roi: number;
  annualizedReturn: number;
  daysHeld: number;
  daysToMaturity: number | null;
  maturityDate: string | null;
  interestRate: number | null;
  status: string;
}

const InvestmentReport = () => {
  const [selectedType, setSelectedType] = useState('all');
  
  // ✅ React Query Hook
  const { data, isLoading, isError, refetch } = useInvestmentReport(selectedType);
  
  // ✅ Memoized: Extract data
  const investments = useMemo(() => data?.investments || [], [data]);
  const totals = useMemo(() => data?.totals || {
    totalAcquisitionCost: 0,
    totalCurrentValue: 0,
    totalGainLoss: 0,
    portfolioROI: 0,
    investmentCount: 0,
  }, [data]);
  const types = useMemo(() => {
    return [...new Set(investments.map((i: InvestmentItem) => i.type))] as string[];
  }, [investments]);

  // ✅ Memoized: Export to Excel
  const exportToExcel = useCallback(() => {
    alert('Excel export functionality would be implemented here');
  }, []);

  // ✅ Error state
  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">Error loading investment report</p>
          <button
            onClick={() => refetch()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
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
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Investment Tracking Report</h2>
            <p className="text-gray-600 mt-1">Portfolio Performance & ROI Analysis</p>
          </div>
          
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <FaFileExcel /> Export to Excel
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Investment Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
        >
          <h3 className="text-sm font-medium opacity-90">Total Investment</h3>
          <p className="text-3xl font-bold mt-2">
            ${totals.totalAcquisitionCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm opacity-75 mt-2">{totals.investmentCount} investments</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
        >
          <h3 className="text-sm font-medium opacity-90">Current Value</h3>
          <p className="text-3xl font-bold mt-2">
            ${totals.totalCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`bg-gradient-to-br ${totals.totalGainLoss >= 0 ? 'from-teal-500 to-teal-600' : 'from-red-500 to-red-600'} rounded-xl shadow-lg p-6 text-white`}
        >
          <h3 className="text-sm font-medium opacity-90">Total Gain/Loss</h3>
          <p className="text-3xl font-bold mt-2">
            ${totals.totalGainLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`bg-gradient-to-br ${totals.portfolioROI >= 0 ? 'from-purple-500 to-purple-600' : 'from-orange-500 to-orange-600'} rounded-xl shadow-lg p-6 text-white`}
        >
          <h3 className="text-sm font-medium opacity-90">Portfolio ROI</h3>
          <p className="text-3xl font-bold mt-2">
            {totals.portfolioROI.toFixed(2)}%
          </p>
        </motion.div>
      </div>

      {/* Investments Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-blue-900 text-white sticky top-0 z-20">
              <tr>
                <th className="px-4 py-3 text-left bg-blue-900">Code</th>
                <th className="px-4 py-3 text-left bg-blue-900">Name</th>
                <th className="px-4 py-3 text-left bg-blue-900">Type</th>
                <th className="px-4 py-3 text-left bg-blue-900">Acquisition Date</th>
                <th className="px-4 py-3 text-right bg-blue-900">Quantity</th>
                <th className="px-4 py-3 text-right bg-blue-900">Unit Cost</th>
                <th className="px-4 py-3 text-right bg-blue-900">Acquisition Cost</th>
                <th className="px-4 py-3 text-right bg-blue-900">Current Value</th>
                <th className="px-4 py-3 text-right bg-blue-900">Gain/Loss</th>
                <th className="px-4 py-3 text-right bg-blue-900">ROI %</th>
                <th className="px-4 py-3 text-right bg-blue-900">Annualized Return %</th>
                <th className="px-4 py-3 text-right bg-blue-900">Days Held</th>
                <th className="px-4 py-3 text-left bg-blue-900">Maturity Date</th>
                <th className="px-4 py-3 text-right bg-blue-900">Interest Rate</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={14} className="text-center py-8 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : investments.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-8 text-gray-500">
                    No investments found
                  </td>
                </tr>
              ) : (
                investments.map((investment, index) => (
                  <tr key={investment.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3">{investment.code}</td>
                    <td className="px-4 py-3">{investment.name}</td>
                    <td className="px-4 py-3">{investment.type}</td>
                    <td className="px-4 py-3">{new Date(investment.acquisitionDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">{investment.quantity}</td>
                    <td className="px-4 py-3 text-right">${investment.unitCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right">${investment.acquisitionCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right font-semibold">${investment.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${investment.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${investment.gainLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`px-4 py-3 text-right ${investment.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {investment.roi.toFixed(2)}%
                    </td>
                    <td className={`px-4 py-3 text-right ${investment.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {investment.annualizedReturn.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right">{investment.daysHeld}</td>
                    <td className="px-4 py-3">
                      {investment.maturityDate ? (
                        <>
                          {new Date(investment.maturityDate).toLocaleDateString()}
                          {investment.daysToMaturity !== null && (
                            <span className={`ml-2 text-xs ${investment.daysToMaturity < 30 ? 'text-red-600' : 'text-gray-500'}`}>
                              ({investment.daysToMaturity} days)
                            </span>
                          )}
                        </>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {investment.interestRate ? `${investment.interestRate}%` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default InvestmentReport;
