import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaFileExcel, FaEye } from 'react-icons/fa';
import axios from '../api/axios';

interface PPEAsset {
  id: number;
  code: string;
  name: string;
  category: string;
  acquisitionDate: string;
  acquisitionCost: number;
  usefulLife: number;
  depreciationMethod: string;
  residualValue: number;
  monthlyDepreciation: number;
  accumulatedDepreciation: number;
  currentBookValue: number;
  remainingLife: number;
  depreciationPercent: number;
  status: string;
  location?: string;
  serialNumber?: string;
}

interface DepreciationScheduleItem {
  period: number;
  date: string;
  periodDepreciation: number;
  accumulatedDepreciation: number;
  bookValue: number;
}

const PPEReport = () => {
  const [assets, setAssets] = useState<PPEAsset[]>([]);
  const [totals, setTotals] = useState({
    totalAcquisitionCost: 0,
    totalAccumulatedDepreciation: 0,
    totalCurrentBookValue: 0,
    totalMonthlyDepreciation: 0,
    assetCount: 0,
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Depreciation schedule modal
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleData, setScheduleData] = useState<any>(null);

  useEffect(() => {
    fetchReport();
  }, [selectedCategory]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      
      const response = await axios.get('/reports/ppe-tracking', { params });
      setAssets(response.data.assets);
      setTotals(response.data.totals);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.assets.map((a: PPEAsset) => a.category))] as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching PPE report:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewDepreciationSchedule = async (assetId: number) => {
    try {
      const response = await axios.get(`/reports/depreciation-schedule/${assetId}`);
      setScheduleData(response.data);
      setShowSchedule(true);
    } catch (error) {
      console.error('Error fetching depreciation schedule:', error);
    }
  };

  const exportToExcel = () => {
    alert('Excel export functionality would be implemented here');
  };

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
            <h2 className="text-3xl font-bold text-gray-800">PPE Tracking Report</h2>
            <p className="text-gray-600 mt-1">Property, Plant & Equipment with Depreciation</p>
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
              Category Filter
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
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
          <h3 className="text-sm font-medium opacity-90">Total Acquisition Cost</h3>
          <p className="text-3xl font-bold mt-2">
            ${totals.totalAcquisitionCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm opacity-75 mt-2">{totals.assetCount} assets</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white"
        >
          <h3 className="text-sm font-medium opacity-90">Accumulated Depreciation</h3>
          <p className="text-3xl font-bold mt-2">
            ${totals.totalAccumulatedDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
        >
          <h3 className="text-sm font-medium opacity-90">Current Book Value</h3>
          <p className="text-3xl font-bold mt-2">
            ${totals.totalCurrentBookValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
        >
          <h3 className="text-sm font-medium opacity-90">Monthly Depreciation</h3>
          <p className="text-3xl font-bold mt-2">
            ${totals.totalMonthlyDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Acquisition Date</th>
                <th className="px-4 py-3 text-right">Acquisition Cost</th>
                <th className="px-4 py-3 text-right">Useful Life (Years)</th>
                <th className="px-4 py-3 text-right">Monthly Depreciation</th>
                <th className="px-4 py-3 text-right">Accumulated Depreciation</th>
                <th className="px-4 py-3 text-right">Book Value</th>
                <th className="px-4 py-3 text-right">Depreciation %</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500">
                    No assets found
                  </td>
                </tr>
              ) : (
                assets.map((asset, index) => (
                  <tr key={asset.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3">{asset.code}</td>
                    <td className="px-4 py-3">{asset.name}</td>
                    <td className="px-4 py-3">{asset.category}</td>
                    <td className="px-4 py-3">{new Date(asset.acquisitionDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">${asset.acquisitionCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right">{asset.usefulLife}</td>
                    <td className="px-4 py-3 text-right">${asset.monthlyDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right text-red-600">${asset.accumulatedDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">${asset.currentBookValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right">{asset.depreciationPercent.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => viewDepreciationSchedule(asset.id)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Depreciation Schedule"
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Depreciation Schedule Modal */}
      {showSchedule && scheduleData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-blue-600 text-white p-6">
              <h3 className="text-2xl font-bold">Depreciation Schedule</h3>
              <p className="mt-1">{scheduleData.asset.name} ({scheduleData.asset.code})</p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Asset Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Acquisition Cost</p>
                  <p className="font-semibold">${scheduleData.asset.acquisitionCost.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Residual Value</p>
                  <p className="font-semibold">${scheduleData.asset.residualValue.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Useful Life</p>
                  <p className="font-semibold">{scheduleData.asset.usefulLife} years</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Method</p>
                  <p className="font-semibold">{scheduleData.asset.depreciationMethod}</p>
                </div>
              </div>

              {/* Schedule Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Period</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-right">Period Depreciation</th>
                      <th className="px-3 py-2 text-right">Accumulated Depreciation</th>
                      <th className="px-3 py-2 text-right">Book Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleData.schedule.map((item: DepreciationScheduleItem, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2">{item.period}</td>
                        <td className="px-3 py-2">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2 text-right">${item.periodDepreciation.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-red-600">${item.accumulatedDepreciation.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-semibold">${item.bookValue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-50 p-4 flex justify-end">
              <button
                onClick={() => setShowSchedule(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PPEReport;
