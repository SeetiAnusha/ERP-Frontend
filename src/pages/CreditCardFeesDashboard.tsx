import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaChartBar, FaArrowLeft, FaCreditCard, FaMoneyBillWave, FaPercentage, FaCalendar, FaTrophy } from 'react-icons/fa';
import { useFeeStatistics } from '../hooks/queries/useCreditCardFees';
import { formatNumber } from '../utils/formatNumber';
import { useNavigate } from 'react-router-dom';

const CreditCardFeesDashboard = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: statistics, isLoading } = useFeeStatistics(filters);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-6 bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-2xl p-8 text-white"
      >
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-4xl font-bold flex items-center gap-3 mb-2">
              <FaChartBar className="text-yellow-300" />
              Credit Card Fees Dashboard
            </h2>
            <p className="text-purple-100 text-lg">Analytics and insights for processing fees</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/expenses/credit-card-fees')}
            className="px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-gray-100 transition flex items-center gap-2 font-semibold shadow-lg"
          >
            <FaArrowLeft />
            Back to List
          </motion.button>
        </div>
      </motion.div>

      {/* Date Filters */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-2xl shadow-xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <FaCalendar className="text-purple-600 text-xl" />
          <h3 className="text-lg font-bold text-gray-800">Date Range</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            />
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl shadow-xl p-8 text-white transform hover:scale-105 transition-transform"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Total Fees Paid</h3>
            <FaMoneyBillWave className="text-4xl opacity-75" />
          </div>
          <p className="text-5xl font-bold mb-2">{formatNumber(statistics?.totalFees || 0)}</p>
          <p className="text-sm opacity-75">Total processing costs</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white transform hover:scale-105 transition-transform"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Total Transactions</h3>
            <FaCreditCard className="text-4xl opacity-75" />
          </div>
          <p className="text-5xl font-bold mb-2">{statistics?.totalTransactions || 0}</p>
          <p className="text-sm opacity-75">Card payments processed</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-xl p-8 text-white transform hover:scale-105 transition-transform"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Average Fee Rate</h3>
            <FaPercentage className="text-4xl opacity-75" />
          </div>
          <p className="text-5xl font-bold mb-2">{statistics?.averageFeePercentage?.toFixed(2) || 0}%</p>
          <p className="text-sm opacity-75">Across all cards</p>
        </motion.div>
      </div>

      {/* Fees by Card Type */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <FaTrophy className="text-yellow-500 text-2xl" />
          <h3 className="text-2xl font-bold text-gray-800">Fees by Card Type</h3>
        </div>
        <div className="space-y-4">
          {statistics?.feesByCardType && Object.entries(statistics.feesByCardType).length > 0 ? (
            Object.entries(statistics.feesByCardType)
              .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
              .map(([cardType, amount]: [string, any], index) => (
                <motion.div 
                  key={cardType}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                      'bg-gradient-to-br from-blue-400 to-purple-500'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="px-4 py-2 bg-white rounded-lg font-bold text-gray-800 shadow-sm">
                      {cardType}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-red-600">
                    {formatNumber(amount)}
                  </span>
                </motion.div>
              ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FaCreditCard className="text-5xl mx-auto mb-3 opacity-30" />
              <p>No card type data available</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Fees by Month */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <FaCalendar className="text-blue-500 text-2xl" />
          <h3 className="text-2xl font-bold text-gray-800">Monthly Fee Trends</h3>
        </div>
        <div className="space-y-3">
          {statistics?.feesByMonth && statistics.feesByMonth.length > 0 ? (
            statistics.feesByMonth.map((item: any, index: number) => {
              const maxFee = Math.max(...statistics.feesByMonth.map((m: any) => m.total));
              const percentage = (item.total / maxFee) * 100;
              
              return (
                <motion.div 
                  key={item.month}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-700">
                      {new Date(item.month + '-01').toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </span>
                    <span className="text-xl font-bold text-red-600">{formatNumber(item.total)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-red-500 to-pink-600 rounded-full"
                    />
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FaCalendar className="text-5xl mx-auto mb-3 opacity-30" />
              <p>No monthly data available</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CreditCardFeesDashboard;
