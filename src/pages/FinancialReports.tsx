import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaFileInvoice, FaChartBar, FaMoneyBillWave, FaBook, FaCalendarAlt, FaDownload } from 'react-icons/fa';
// import { useLanguage } from '../contexts/LanguageContext';
import { useBalanceSheet, useProfitLoss, useCashFlow, useExportReport } from '../hooks/queries/useAccounting';
import { formatNumber } from '../utils/formatNumber';

const FinancialReports = () => {
  // const { t } = useLanguage(); // Unused for now
  const [activeReport, setActiveReport] = useState<'balance-sheet' | 'profit-loss' | 'cash-flow' | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [cashFlowMethod, setCashFlowMethod] = useState<'DIRECT' | 'INDIRECT'>('INDIRECT');

  const exportReport = useExportReport();

  // Fetch reports based on active selection
  const { data: balanceSheet, isLoading: bsLoading } = useBalanceSheet(
    dateRange.endDate,
    { includeZeroBalances: false }
  );

  const { data: profitLoss, isLoading: plLoading } = useProfitLoss(
    dateRange.startDate,
    dateRange.endDate
  );

  const { data: cashFlow, isLoading: cfLoading } = useCashFlow(
    dateRange.startDate,
    dateRange.endDate,
    cashFlowMethod
  );

  const handleExport = (reportType: string, reportData: any, format: 'CSV' | 'PDF' | 'JSON') => {
    exportReport.mutate({
      reportType,
      reportData,
      format,
      metadata: {
        title: reportType.replace(/_/g, ' '),
        asOfDate: dateRange.endDate,
        companyName: 'My Company'
      }
    });
  };

  const reportCards = [
    {
      id: 'balance-sheet',
      title: 'Balance Sheet',
      description: 'Assets, Liabilities, and Equity',
      icon: FaFileInvoice,
      color: 'from-blue-500 to-blue-600',
      data: balanceSheet,
      isLoading: bsLoading
    },
    {
      id: 'profit-loss',
      title: 'Profit & Loss',
      description: 'Revenue and Expenses',
      icon: FaChartBar,
      color: 'from-green-500 to-green-600',
      data: profitLoss,
      isLoading: plLoading
    },
    {
      id: 'cash-flow',
      title: 'Cash Flow Statement',
      description: 'Operating, Investing, Financing',
      icon: FaMoneyBillWave,
      color: 'from-purple-500 to-purple-600',
      data: cashFlow,
      isLoading: cfLoading
    }
  ];

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
              <FaBook className="text-blue-600" />
              Financial Reports
            </h2>
            <p className="text-gray-600 mt-1">Professional financial statements and reports</p>
          </div>
          
          <div className="flex items-center gap-4">
            <FaCalendarAlt className="text-gray-500" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Report Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportCards.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setActiveReport(report.id as any)}
            className={`bg-gradient-to-br ${report.color} rounded-xl shadow-lg p-6 text-white cursor-pointer hover:scale-105 transition-transform ${
              activeReport === report.id ? 'ring-4 ring-white' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <report.icon className="text-4xl opacity-90" />
              {activeReport === report.id && (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(report.id.toUpperCase().replace('-', '_'), report.data, 'PDF');
                    }}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                    title="Export PDF"
                  >
                    <FaDownload />
                  </button>
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold mb-2">{report.title}</h3>
            <p className="text-sm opacity-90">{report.description}</p>
            {report.isLoading && (
              <div className="mt-4 text-sm opacity-75">Loading...</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Balance Sheet Report */}
      {activeReport === 'balance-sheet' && balanceSheet && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-2xl font-bold mb-6">Balance Sheet</h3>
          <p className="text-gray-600 mb-6">As of {new Date(dateRange.endDate).toLocaleDateString()}</p>

          {/* Assets */}
          <div className="mb-8">
            <h4 className="text-xl font-bold text-blue-600 mb-4">ASSETS</h4>
            {balanceSheet.assets?.map((section: any) => (
              <div key={section.sectionName} className="mb-4">
                <h5 className="font-semibold text-gray-700 mb-2">{section.sectionName}</h5>
                {section.accounts.map((account: any) => (
                  <div key={account.accountCode} className="flex justify-between py-2 px-4 hover:bg-gray-50">
                    <span className="text-gray-600">{account.accountName}</span>
                    <span className="font-medium">{formatNumber(account.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 px-4 bg-gray-100 font-semibold">
                  <span>Total {section.sectionName}</span>
                  <span>{formatNumber(section.total)}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between py-3 px-4 bg-blue-100 font-bold text-lg">
              <span>TOTAL ASSETS</span>
              <span>{formatNumber(balanceSheet.totalAssets)}</span>
            </div>
          </div>

          {/* Liabilities */}
          <div className="mb-8">
            <h4 className="text-xl font-bold text-red-600 mb-4">LIABILITIES</h4>
            {balanceSheet.liabilities?.map((section: any) => (
              <div key={section.sectionName} className="mb-4">
                <h5 className="font-semibold text-gray-700 mb-2">{section.sectionName}</h5>
                {section.accounts.map((account: any) => (
                  <div key={account.accountCode} className="flex justify-between py-2 px-4 hover:bg-gray-50">
                    <span className="text-gray-600">{account.accountName}</span>
                    <span className="font-medium">{formatNumber(account.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 px-4 bg-gray-100 font-semibold">
                  <span>Total {section.sectionName}</span>
                  <span>{formatNumber(section.total)}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between py-3 px-4 bg-red-100 font-bold text-lg">
              <span>TOTAL LIABILITIES</span>
              <span>{formatNumber(balanceSheet.totalLiabilities)}</span>
            </div>
          </div>

          {/* Equity */}
          <div className="mb-8">
            <h4 className="text-xl font-bold text-green-600 mb-4">EQUITY</h4>
            {balanceSheet.equity?.map((section: any) => (
              <div key={section.sectionName} className="mb-4">
                {section.accounts.map((account: any) => (
                  <div key={account.accountCode} className="flex justify-between py-2 px-4 hover:bg-gray-50">
                    <span className="text-gray-600">{account.accountName}</span>
                    <span className="font-medium">{formatNumber(account.balance)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="flex justify-between py-3 px-4 bg-green-100 font-bold text-lg">
              <span>TOTAL EQUITY</span>
              <span>{formatNumber(balanceSheet.totalEquity)}</span>
            </div>
          </div>

          {/* Accounting Equation */}
          <div className="border-t-2 border-gray-300 pt-4">
            <div className="flex justify-between py-3 px-4 bg-gray-800 text-white font-bold text-xl rounded-lg">
              <span>TOTAL LIABILITIES + EQUITY</span>
              <span>{formatNumber(balanceSheet.totalLiabilitiesAndEquity)}</span>
            </div>
            {balanceSheet.isBalanced && (
              <p className="text-green-600 text-center mt-4 font-semibold">
                ✓ Accounting Equation Balanced
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Profit & Loss Report */}
      {activeReport === 'profit-loss' && profitLoss && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-2xl font-bold mb-6">Profit & Loss Statement</h3>
          <p className="text-gray-600 mb-6">
            {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
          </p>

          {/* Revenue */}
          <div className="mb-6">
            <h4 className="text-xl font-bold text-green-600 mb-4">REVENUE</h4>
            {profitLoss.revenue?.map((section: any) => (
              <div key={section.sectionName} className="mb-4">
                {section.accounts.map((account: any) => (
                  <div key={account.accountCode} className="flex justify-between py-2 px-4 hover:bg-gray-50">
                    <span className="text-gray-600">{account.accountName}</span>
                    <span className="font-medium">{formatNumber(account.amount)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="flex justify-between py-3 px-4 bg-green-100 font-bold text-lg">
              <span>TOTAL REVENUE</span>
              <span>{formatNumber(profitLoss.totalRevenue)}</span>
            </div>
          </div>

          {/* Expenses */}
          <div className="mb-6">
            <h4 className="text-xl font-bold text-red-600 mb-4">EXPENSES</h4>
            {profitLoss.expenses?.map((section: any) => (
              <div key={section.sectionName} className="mb-4">
                <h5 className="font-semibold text-gray-700 mb-2">{section.sectionName}</h5>
                {section.accounts.map((account: any) => (
                  <div key={account.accountCode} className="flex justify-between py-2 px-4 hover:bg-gray-50">
                    <span className="text-gray-600">{account.accountName}</span>
                    <span className="font-medium">{formatNumber(account.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 px-4 bg-gray-100 font-semibold">
                  <span>Total {section.sectionName}</span>
                  <span>{formatNumber(section.total)}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between py-3 px-4 bg-red-100 font-bold text-lg">
              <span>TOTAL EXPENSES</span>
              <span>{formatNumber(profitLoss.totalExpenses)}</span>
            </div>
          </div>

          {/* Net Income */}
          <div className="border-t-2 border-gray-300 pt-4">
            <div className={`flex justify-between py-3 px-4 ${
              profitLoss.netIncome >= 0 ? 'bg-green-600' : 'bg-red-600'
            } text-white font-bold text-xl rounded-lg`}>
              <span>NET INCOME</span>
              <span>{formatNumber(profitLoss.netIncome)}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cash Flow Report */}
      {activeReport === 'cash-flow' && cashFlow && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold">Cash Flow Statement</h3>
              <p className="text-gray-600 mt-1">
                {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
              </p>
            </div>
            <select
              value={cashFlowMethod}
              onChange={(e) => setCashFlowMethod(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="INDIRECT">Indirect Method</option>
              <option value="DIRECT">Direct Method</option>
            </select>
          </div>

          {/* Operating Activities */}
          <div className="mb-6">
            <h4 className="text-xl font-bold text-blue-600 mb-4">OPERATING ACTIVITIES</h4>
            {cashFlow.operatingActivities?.map((item: any) => (
              <div key={item.description} className="flex justify-between py-2 px-4 hover:bg-gray-50">
                <span className="text-gray-600">{item.description}</span>
                <span className="font-medium">{formatNumber(item.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between py-3 px-4 bg-blue-100 font-bold">
              <span>Net Cash from Operating Activities</span>
              <span>{formatNumber(cashFlow.netOperatingCash)}</span>
            </div>
          </div>

          {/* Investing Activities */}
          <div className="mb-6">
            <h4 className="text-xl font-bold text-purple-600 mb-4">INVESTING ACTIVITIES</h4>
            {cashFlow.investingActivities?.map((item: any) => (
              <div key={item.description} className="flex justify-between py-2 px-4 hover:bg-gray-50">
                <span className="text-gray-600">{item.description}</span>
                <span className="font-medium">{formatNumber(item.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between py-3 px-4 bg-purple-100 font-bold">
              <span>Net Cash from Investing Activities</span>
              <span>{formatNumber(cashFlow.netInvestingCash)}</span>
            </div>
          </div>

          {/* Financing Activities */}
          <div className="mb-6">
            <h4 className="text-xl font-bold text-green-600 mb-4">FINANCING ACTIVITIES</h4>
            {cashFlow.financingActivities?.map((item: any) => (
              <div key={item.description} className="flex justify-between py-2 px-4 hover:bg-gray-50">
                <span className="text-gray-600">{item.description}</span>
                <span className="font-medium">{formatNumber(item.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between py-3 px-4 bg-green-100 font-bold">
              <span>Net Cash from Financing Activities</span>
              <span>{formatNumber(cashFlow.netFinancingCash)}</span>
            </div>
          </div>

          {/* Net Change in Cash */}
          <div className="border-t-2 border-gray-300 pt-4 space-y-3">
            <div className="flex justify-between py-2 px-4 font-semibold">
              <span>Net Change in Cash</span>
              <span>{formatNumber(cashFlow.netChangeInCash)}</span>
            </div>
            <div className="flex justify-between py-2 px-4 text-gray-600">
              <span>Cash at Beginning of Period</span>
              <span>{formatNumber(cashFlow.beginningCash)}</span>
            </div>
            <div className="flex justify-between py-3 px-4 bg-blue-600 text-white font-bold text-xl rounded-lg">
              <span>Cash at End of Period</span>
              <span>{formatNumber(cashFlow.endingCash)}</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FinancialReports;
