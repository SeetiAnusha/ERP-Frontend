import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBalanceScale, FaCalendarAlt, FaDownload, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useTrialBalance } from '../hooks/queries/useAccounting';
import { formatNumber } from '../utils/formatNumber';

const TrialBalance = () => {
  // const { t } = useLanguage(); // Unused for now
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: trialBalance, isLoading } = useTrialBalance(asOfDate);

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
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FaBalanceScale className="text-blue-600" />
              Trial Balance
            </h2>
            <p className="text-gray-600 mt-1">Verify accounting equation balance</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-500" />
              <label className="text-sm font-medium text-gray-700">As of Date:</label>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
              <FaDownload />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Balance Status */}
      {trialBalance && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-xl shadow-lg p-6 ${
            trialBalance.isBalanced
              ? 'bg-gradient-to-br from-green-500 to-green-600'
              : 'bg-gradient-to-br from-red-500 to-red-600'
          } text-white`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {trialBalance.isBalanced ? (
                <FaCheckCircle className="text-5xl" />
              ) : (
                <FaExclamationTriangle className="text-5xl" />
              )}
              <div>
                <h3 className="text-2xl font-bold">
                  {trialBalance.isBalanced ? 'Books are Balanced' : 'Books are Out of Balance'}
                </h3>
                <p className="text-sm opacity-90 mt-1">
                  As of {new Date(asOfDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {!trialBalance.isBalanced && (
              <div className="text-right">
                <p className="text-sm opacity-90">Difference</p>
                <p className="text-3xl font-bold">{formatNumber(trialBalance.difference)}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      {trialBalance && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
          >
            <h3 className="text-sm font-medium opacity-90 mb-2">Total Debits</h3>
            <p className="text-4xl font-bold">{formatNumber(trialBalance.totalDebits)}</p>
            <p className="text-sm opacity-75 mt-2">
              {trialBalance.rows?.filter((r: any) => r.debitBalance > 0).length} accounts
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
          >
            <h3 className="text-sm font-medium opacity-90 mb-2">Total Credits</h3>
            <p className="text-4xl font-bold">{formatNumber(trialBalance.totalCredits)}</p>
            <p className="text-sm opacity-75 mt-2">
              {trialBalance.rows?.filter((r: any) => r.creditBalance > 0).length} accounts
            </p>
          </motion.div>
        </div>
      )}

      {/* Trial Balance Table */}
      {trialBalance && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debit Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trialBalance.rows?.map((row: any) => (
                  <tr key={row.accountCode} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-semibold text-gray-900">
                        {row.accountCode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {row.accountName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        row.accountType === 'ASSET' ? 'bg-blue-100 text-blue-800' :
                        row.accountType === 'LIABILITY' ? 'bg-red-100 text-red-800' :
                        row.accountType === 'EQUITY' ? 'bg-green-100 text-green-800' :
                        row.accountType === 'REVENUE' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {row.accountType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {row.debitBalance > 0 ? (
                        <span className="text-blue-600">{formatNumber(row.debitBalance)}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {row.creditBalance > 0 ? (
                        <span className="text-green-600">{formatNumber(row.creditBalance)}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                
                {/* Totals Row */}
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={3} className="px-6 py-4 text-right text-gray-900">
                    TOTALS
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-blue-600">
                    {formatNumber(trialBalance.totalDebits)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-green-600">
                    {formatNumber(trialBalance.totalCredits)}
                  </td>
                </tr>
                
                {/* Difference Row (if not balanced) */}
                {!trialBalance.isBalanced && (
                  <tr className="bg-red-50 font-bold text-red-600">
                    <td colSpan={3} className="px-6 py-4 text-right">
                      DIFFERENCE
                    </td>
                    <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-right">
                      {formatNumber(trialBalance.difference)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accounting Equation */}
      {trialBalance && trialBalance.isBalanced && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold mb-4 text-center">Accounting Equation</h3>
          <div className="flex items-center justify-center gap-4 text-lg font-semibold">
            <div className="text-center">
              <p className="text-gray-600 mb-2">Assets</p>
              <p className="text-2xl text-blue-600">
                {formatNumber(
                  trialBalance.rows
                    ?.filter((r: any) => r.accountType === 'ASSET')
                    .reduce((sum: number, r: any) => sum + r.debitBalance - r.creditBalance, 0) || 0
                )}
              </p>
            </div>
            
            <span className="text-3xl text-gray-400">=</span>
            
            <div className="text-center">
              <p className="text-gray-600 mb-2">Liabilities</p>
              <p className="text-2xl text-red-600">
                {formatNumber(
                  trialBalance.rows
                    ?.filter((r: any) => r.accountType === 'LIABILITY')
                    .reduce((sum: number, r: any) => sum + r.creditBalance - r.debitBalance, 0) || 0
                )}
              </p>
            </div>
            
            <span className="text-3xl text-gray-400">+</span>
            
            <div className="text-center">
              <p className="text-gray-600 mb-2">Equity</p>
              <p className="text-2xl text-green-600">
                {formatNumber(
                  trialBalance.rows
                    ?.filter((r: any) => r.accountType === 'EQUITY')
                    .reduce((sum: number, r: any) => sum + r.creditBalance - r.debitBalance, 0) || 0
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TrialBalance;
