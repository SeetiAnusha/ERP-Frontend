import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaCalendar, FaFileAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

const Reports = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [salesData, setSalesData] = useState({
    totalSales: 0,
    totalRevenue: 0,
    paidSales: 0,
    unpaidSales: 0,
    salesCount: 0,
  });

  const [purchasesData, setPurchasesData] = useState({
    totalPurchases: 0,
    totalCost: 0,
    paidPurchases: 0,
    unpaidPurchases: 0,
    purchasesCount: 0,
  });

  const [paymentsData, setPaymentsData] = useState({
    paymentsIn: 0,
    paymentsOut: 0,
    netCashFlow: 0,
  });

  const [productsData, setProductsData] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    totalInventoryValue: 0,
  });

  useEffect(() => {
    fetchReportsData();
  }, [dateRange]);

  const fetchReportsData = async () => {
    try {
      // Fetch Sales
      const salesResponse = await axios.get('/sales');
      const sales = salesResponse.data.filter((sale: any) => {
        const saleDate = new Date(sale.date);
        return saleDate >= new Date(dateRange.startDate) && saleDate <= new Date(dateRange.endDate);
      });

      setSalesData({
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum: number, sale: any) => sum + parseFloat(sale.total), 0),
        paidSales: sales.filter((s: any) => s.paymentStatus === 'Paid').length,
        unpaidSales: sales.filter((s: any) => s.paymentStatus === 'Unpaid').length,
        salesCount: sales.length,
      });

      // Fetch Purchases
      const purchasesResponse = await axios.get('/purchases');
      const purchases = purchasesResponse.data.filter((purchase: any) => {
        const purchaseDate = new Date(purchase.date);
        return purchaseDate >= new Date(dateRange.startDate) && purchaseDate <= new Date(dateRange.endDate);
      });

      setPurchasesData({
        totalPurchases: purchases.length,
        totalCost: purchases.reduce((sum: number, purchase: any) => sum + parseFloat(purchase.total), 0),
        paidPurchases: purchases.filter((p: any) => p.paymentStatus === 'Paid').length,
        unpaidPurchases: purchases.filter((p: any) => p.paymentStatus === 'Unpaid').length,
        purchasesCount: purchases.length,
      });

      // Fetch Payments
      const paymentsResponse = await axios.get('/payments');
      const payments = paymentsResponse.data.filter((payment: any) => {
        const paymentDate = new Date(payment.registrationDate);
        return paymentDate >= new Date(dateRange.startDate) && paymentDate <= new Date(dateRange.endDate);
      });

      const paymentsIn = payments
        .filter((p: any) => p.type === 'Payment In')
        .reduce((sum: number, p: any) => sum + parseFloat(p.paymentAmount), 0);

      const paymentsOut = payments
        .filter((p: any) => p.type === 'Payment Out')
        .reduce((sum: number, p: any) => sum + parseFloat(p.paymentAmount), 0);

      setPaymentsData({
        paymentsIn,
        paymentsOut,
        netCashFlow: paymentsIn - paymentsOut,
      });

      // Fetch Products
      const productsResponse = await axios.get('/products');
      const products = productsResponse.data;

      setProductsData({
        totalProducts: products.length,
        lowStockProducts: products.filter((p: any) => parseFloat(p.amount) <= parseFloat(p.minimumStock)).length,
        totalInventoryValue: products.reduce((sum: number, p: any) => 
          sum + (parseFloat(p.amount) * parseFloat(p.unitCost)), 0
        ),
      });

    } catch (error) {
      console.error('Error fetching reports data:', error);
    }
  };

  const profitMargin = salesData.totalRevenue - purchasesData.totalCost;
  const profitMarginPercentage = salesData.totalRevenue > 0 
    ? ((profitMargin / salesData.totalRevenue) * 100).toFixed(2)
    : 0;

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
            <h2 className="text-3xl font-bold text-gray-800">Business Reports</h2>
            <p className="text-gray-600 mt-1">Analytics and insights for your business</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FaCalendar className="text-gray-500" />
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
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
            <FaChartLine className="text-2xl opacity-75" />
          </div>
          <p className="text-3xl font-bold">
            {salesData.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm opacity-75 mt-2">{salesData.salesCount} sales</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Expenses</h3>
            <FaChartLine className="text-2xl opacity-75" />
          </div>
          <p className="text-3xl font-bold">
            {purchasesData.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm opacity-75 mt-2">{purchasesData.purchasesCount} purchases</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Gross Profit</h3>
            <FaChartLine className="text-2xl opacity-75" />
          </div>
          <p className="text-3xl font-bold">
            {profitMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm opacity-75 mt-2">{profitMarginPercentage}% margin</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Net Cash Flow</h3>
            <FaChartLine className="text-2xl opacity-75" />
          </div>
          <p className="text-3xl font-bold">
            {paymentsData.netCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm opacity-75 mt-2">In - Out</p>
        </motion.div>
      </div>

      {/* Specialized Reports Links */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Specialized Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/reports/ppe')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-blue-200 transition text-left"
          >
            <FaFileAlt className="text-2xl text-blue-600 mb-2" />
            <h4 className="font-semibold text-gray-800">PPE Tracking Report</h4>
            <p className="text-sm text-gray-600 mt-1">Property, Plant & Equipment with depreciation schedules</p>
          </button>

          <button
            onClick={() => navigate('/reports/investments')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border-2 border-green-200 transition text-left"
          >
            <FaFileAlt className="text-2xl text-green-600 mb-2" />
            <h4 className="font-semibold text-gray-800">Investment Tracking</h4>
            <p className="text-sm text-gray-600 mt-1">Portfolio performance and ROI analysis</p>
          </button>

          <button
            onClick={() => navigate('/inventory')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border-2 border-purple-200 transition text-left"
          >
            <FaFileAlt className="text-2xl text-purple-600 mb-2" />
            <h4 className="font-semibold text-gray-800">Inventory Movement</h4>
            <p className="text-sm text-gray-600 mt-1">Detailed inventory tracking with COGS and margins</p>
          </button>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Report */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            Sales Report
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Sales</span>
              <span className="font-semibold">{salesData.salesCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold text-blue-600">
                {salesData.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Paid Sales</span>
              <span className="font-semibold text-green-600">{salesData.paidSales}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Unpaid Sales</span>
              <span className="font-semibold text-red-600">{salesData.unpaidSales}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Average Sale Value</span>
              <span className="font-semibold">
                {salesData.salesCount > 0 
                  ? (salesData.totalRevenue / salesData.salesCount).toLocaleString('en-US', { minimumFractionDigits: 2 })
                  : '0.00'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Purchases Report */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            Purchases Report
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Purchases</span>
              <span className="font-semibold">{purchasesData.purchasesCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Cost</span>
              <span className="font-semibold text-purple-600">
                {purchasesData.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Paid Purchases</span>
              <span className="font-semibold text-green-600">{purchasesData.paidPurchases}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Unpaid Purchases</span>
              <span className="font-semibold text-red-600">{purchasesData.unpaidPurchases}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Average Purchase Value</span>
              <span className="font-semibold">
                {purchasesData.purchasesCount > 0 
                  ? (purchasesData.totalCost / purchasesData.purchasesCount).toLocaleString('en-US', { minimumFractionDigits: 2 })
                  : '0.00'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Cash Flow Report */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            Cash Flow Report
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-gray-600">Payments In (Received)</span>
              <span className="font-semibold text-green-600">
                {paymentsData.paymentsIn.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
              <span className="text-gray-600">Payments Out (Paid)</span>
              <span className="font-semibold text-red-600">
                {paymentsData.paymentsOut.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-gray-600 font-medium">Net Cash Flow</span>
              <span className={`font-bold text-lg {paymentsData.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {paymentsData.netCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Report */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            Inventory Report
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Products</span>
              <span className="font-semibold">{productsData.totalProducts}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Low Stock Products</span>
              <span className="font-semibold text-red-600">{productsData.lowStockProducts}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Inventory Value</span>
              <span className="font-semibold text-orange-600">
                {productsData.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profitability Analysis */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Profitability Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Revenue</p>
            <p className="text-2xl font-bold text-blue-600">
              {salesData.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600 mb-1">Cost of Goods</p>
            <p className="text-2xl font-bold text-red-600">
              {purchasesData.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 mb-1">Gross Profit</p>
            <p className="text-2xl font-bold text-green-600">
              {profitMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-600 mt-1">{profitMarginPercentage}% margin</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Reports;

