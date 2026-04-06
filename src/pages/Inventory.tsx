import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaFileExcel, FaCalendar, FaSearch, FaChartLine } from 'react-icons/fa';
import { Product, Purchase, Sale } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber } from '../utils/formatNumber';
import { useProducts } from '../hooks/queries/useProducts';
import { useSales } from '../hooks/queries/useSales';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../lib/queryKeys';
import { CACHE_STRATEGIES } from '../lib/queryClient';
import api from '../api/axios';

interface InventoryMovement {
  registrationNo: string;
  registrationDate: string;
  rnc: string;
  supplierOrClient: string;
  ncf: string;
  date: string;
  operation: 'BUYS' | 'SALE';
  product: string;
  amount: number;
  unitPrice: number; // For BUYS: purchase cost, For SALES: actual cost (not selling price)
  totalAmount: number; // For BUYS: total cost, For SALES: total cost (not revenue)
  balanceInAmount: number;
  balanceIn: number;
  averageUnitCost: number;
  // New fields for SALES only
  sellingPrice?: number; // Selling price per unit (for SALES only)
  salesRevenue?: number; // Total sales revenue (for SALES only)
  grossMargin?: number; // Revenue - Cost (for SALES only)
  marginPercentOnRevenue?: number; // (Margin / Revenue) * 100
  marginPercentOnCost?: number; // (Margin / Cost) * 100
}

interface InventorySheet {
  product: string;
  movements: InventoryMovement[];
  totals: {
    totalPurchases: number;
    totalSales: number;
    currentBalance: number;
    averageCost: number;
    totalIncome: number;
    totalCost: number;
    grossMargin: number;
    grossMarginPercent: number;
    grossMarginOnRevenue: number;
    grossMarginOnCost: number;
  };
}

const Inventory = () => {
  const { t } = useLanguage();
  
  // ✅ React Query Hooks
  const { data: products = [], isLoading: isLoadingProducts, isError: isErrorProducts } = useProducts();
  
  // ✅ Custom hook for purchases with full details (including items)
  const { data: purchases = [], isLoading: isLoadingPurchases, isError: isErrorPurchases } = useQuery({
    queryKey: QUERY_KEYS.purchases,
    queryFn: async (): Promise<Purchase[]> => {
      const response = await api.get('/purchases');
      return Array.isArray(response.data) ? response.data : [];
    },
    ...CACHE_STRATEGIES.MASTER_DATA,
    throwOnError: false,
  });
  
  const { data: sales = [], isLoading: isLoadingSales, isError: isErrorSales } = useSales();
  
  const [inventorySheets, setInventorySheets] = useState<InventorySheet[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ Combined loading and error states
  const isLoading = isLoadingProducts || isLoadingPurchases || isLoadingSales;
  const isError = isErrorProducts || isErrorPurchases || isErrorSales;

  // ✅ Memoized: Calculate inventory sheets
  const calculateInventorySheets = useCallback(() => {
    const sheets: InventorySheet[] = [];
    const productsToProcess = selectedProduct === 'all' 
      ? products 
      : products.filter(p => p.id === parseInt(selectedProduct));

    productsToProcess.forEach(product => {
      const movements: InventoryMovement[] = [];

      // Collect all purchases for this product
      purchases.forEach(purchase => {
        if (purchase.items) {
          purchase.items.forEach(item => {
            if (item.productId === product.id) {
              const purchaseDate = new Date(purchase.date);
              if (purchaseDate >= new Date(dateRange.startDate) && purchaseDate <= new Date(dateRange.endDate)) {
                movements.push({
                  registrationNo: purchase.registrationNumber,
                  registrationDate: purchase.registrationDate,
                  rnc: purchase.supplierRnc || '',
                  supplierOrClient: purchase.supplier?.name || '',
                  ncf: purchase.ncf || '',
                  date: purchase.date,
                  operation: 'BUYS',
                  product: product.name,
                  amount: Number(item.quantity) || 0,
                  unitPrice: parseFloat((item.adjustedUnitCost || item.unitCost).toString()),
                  totalAmount: parseFloat((item.adjustedTotal || item.total).toString()),
                  balanceInAmount: 0, // Will be calculated after sorting
                  balanceIn: 0, // Will be calculated after sorting
                  averageUnitCost: 0, // Will be calculated after sorting
                });
              }
            }
          });
        }
      });

      // Collect all sales for this product
      sales.forEach(sale => {
        if (sale.items) {
          sale.items.forEach(item => {
            if (item.productId === product.id) {
              const saleDate = new Date(sale.date);
              if (saleDate >= new Date(dateRange.startDate) && saleDate <= new Date(dateRange.endDate)) {
                // Calculate cost at time of sale (will be refined after sorting)
                const sellingPrice = parseFloat(item.unitPrice.toString());
                const quantity = Number(item.quantity) || 0;
                const salesRevenue = parseFloat(item.total.toString());
                
                // Cost will be calculated based on average cost at time of sale
                // This is a placeholder, will be updated in the running balance calculation
                const estimatedCost = parseFloat((product.unitCost || 0).toString());
                const totalCost = estimatedCost * quantity;
                
                movements.push({
                  registrationNo: sale.registrationNumber,
                  registrationDate: sale.registrationDate,
                  rnc: sale.clientRnc || '',
                  supplierOrClient: sale.client?.name || '',
                  ncf: sale.ncf || '',
                  date: sale.date,
                  operation: 'SALE',
                  product: product.name,
                  amount: quantity,
                  unitPrice: estimatedCost, // COST per unit (not selling price!)
                  totalAmount: totalCost, // Total COST (not revenue!)
                  balanceInAmount: 0, // Will be calculated after sorting
                  balanceIn: 0, // Will be calculated after sorting
                  averageUnitCost: 0, // Will be calculated after sorting
                  // Sales-specific fields
                  sellingPrice: sellingPrice,
                  salesRevenue: salesRevenue,
                  grossMargin: 0, // Will be calculated after we know actual cost
                  marginPercentOnRevenue: 0,
                  marginPercentOnCost: 0,
                });
              }
            }
          });
        }
      });

      // Sort movements by date first, then by registration number
      movements.sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        // If same date, sort by registration number
        return a.registrationNo.localeCompare(b.registrationNo);
      });

      // Calculate opening balance (stock before date range)
      let openingBalance = 0;
      let openingBalanceAmount = 0;

      // Get all transactions BEFORE the start date to calculate opening balance
      purchases.forEach(purchase => {
        if (purchase.items) {
          purchase.items.forEach(item => {
            if (item.productId === product.id) {
              const purchaseDate = new Date(purchase.date);
              if (purchaseDate < new Date(dateRange.startDate)) {
                openingBalance += Number(item.quantity) || 0;
                openingBalanceAmount += parseFloat((item.adjustedTotal || item.total).toString());
              }
            }
          });
        }
      });

      sales.forEach(sale => {
        if (sale.items) {
          sale.items.forEach(item => {
            if (item.productId === product.id) {
              const saleDate = new Date(sale.date);
              if (saleDate < new Date(dateRange.startDate)) {
                const avgCost = openingBalance > 0 ? openingBalanceAmount / openingBalance : 0;
                const costOfSale = avgCost * (Number(item.quantity) || 0);
                openingBalance -= Number(item.quantity) || 0;
                openingBalanceAmount -= costOfSale;
              }
            }
          });
        }
      });

      // Now calculate running balances starting from opening balance
      let runningBalance = openingBalance;
      let runningBalanceAmount = openingBalanceAmount;

      movements.forEach(movement => {
        if (movement.operation === 'BUYS') {
          runningBalance += movement.amount;
          runningBalanceAmount += movement.totalAmount;
        } else {
          // SALE - Calculate actual cost based on average cost at time of sale
          const avgCost = runningBalance > 0 ? runningBalanceAmount / runningBalance : 0;
          const actualCostPerUnit = avgCost;
          const actualTotalCost = actualCostPerUnit * movement.amount;
          
          // Update movement with actual cost (not selling price!)
          movement.unitPrice = actualCostPerUnit;
          movement.totalAmount = actualTotalCost;
          
          // Calculate margins
          const revenue = movement.salesRevenue || 0;
          const cost = actualTotalCost;
          const margin = revenue - cost;
          
          movement.grossMargin = margin;
          movement.marginPercentOnRevenue = revenue > 0 ? (margin / revenue) * 100 : 0;
          movement.marginPercentOnCost = cost > 0 ? (margin / cost) * 100 : 0;
          
          // Reduce inventory
          runningBalance -= movement.amount;
          runningBalanceAmount -= actualTotalCost;
        }

        // Update the movement with calculated values
        movement.balanceIn = runningBalance;
        movement.balanceInAmount = runningBalanceAmount;
        movement.averageUnitCost = runningBalance > 0 ? runningBalanceAmount / runningBalance : 0;
      });

      // Calculate totals
      const totalPurchases = movements.filter(m => m.operation === 'BUYS').reduce((sum, m) => sum + m.amount, 0);
      const totalSales = movements.filter(m => m.operation === 'SALE').reduce((sum, m) => sum + m.amount, 0);
      const totalIncome = movements.filter(m => m.operation === 'SALE').reduce((sum, m) => sum + m.totalAmount, 0);
      const totalCost = movements.filter(m => m.operation === 'BUYS').reduce((sum, m) => sum + m.totalAmount, 0);
      const grossMargin = totalIncome - totalCost;
      const grossMarginPercent = totalIncome > 0 ? (grossMargin / totalIncome) * 100 : 0;

      // Get final balance from last movement
      const finalBalance = movements.length > 0 ? movements[movements.length - 1].balanceIn : 0;
      const finalBalanceAmount = movements.length > 0 ? movements[movements.length - 1].balanceInAmount : 0;
      const finalAvgCost = finalBalance > 0 ? finalBalanceAmount / finalBalance : 0;

      if (movements.length > 0) {
        sheets.push({
          product: product.name,
          movements,
          totals: {
            totalPurchases,
            totalSales,
            currentBalance: finalBalance,
            averageCost: finalAvgCost,
            totalIncome,
            totalCost,
            grossMargin,
            grossMarginPercent,
            grossMarginOnRevenue: grossMarginPercent,
            grossMarginOnCost: totalCost > 0 ? (grossMargin / totalCost) * 100 : 0,
          },
        });
      }
    });

    setInventorySheets(sheets);
  }, [products, purchases, sales, dateRange, selectedProduct]);

  // ✅ Recalculate inventory sheets when data or filters change
  useEffect(() => {
    if (products.length > 0 && purchases.length > 0 && sales.length > 0) {
      calculateInventorySheets();
    }
  }, [products, purchases, sales, dateRange, selectedProduct, calculateInventorySheets]);

  // ✅ Memoized: Export to Excel
  const exportToExcel = useCallback(() => {
    alert('Excel export functionality would be implemented here');
  }, []);

  // ✅ Memoized: Filtered sheets
  const filteredSheets = useMemo(() => {
    return inventorySheets.filter(sheet =>
      sheet.product.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventorySheets, searchTerm]);

  // ✅ Error state
  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">Error loading inventory data</p>
          <p className="text-sm text-gray-600 mt-2">Please refresh the page to try again</p>
        </div>
      </div>
    );
  }

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory data...</p>
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
            <h2 className="text-3xl font-bold text-gray-800">{t('inventorySheet')}</h2>
            <p className="text-gray-600 mt-1">{t('trackPurchasesAndSales')}</p>
          </div>
          
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <FaFileExcel /> {t('exportToExcel')}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaCalendar className="inline mr-2" />
              {t('startDate')}
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaCalendar className="inline mr-2" />
              {t('endDate')}
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('productFilter')}
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('allProducts')}</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaSearch className="inline mr-2" />
              {t('searchProduct')}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Inventory Sheets */}
      {filteredSheets.map((sheet, sheetIndex) => (
        <div key={sheetIndex} className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white p-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <FaChartLine />
              {sheet.product}
            </h3>
          </div>

          {/* Movements Table */}
          <style>{`
            .inventory-header-blue { background-color: #1e3a8a !important; color: white !important; }
            .inventory-header-green { background-color: #15803d !important; color: white !important; }
            .inventory-header-orange { background-color: #c2410c !important; color: white !important; }
            .inventory-header-yellow { background-color: #a16207 !important; color: white !important; }
          `}</style>
          <div 
            className="overflow-auto max-h-[600px]" 
            style={{ position: 'relative' }}
          >
            <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
                <tr>
                  <th className="px-3 py-2 text-left inventory-header-blue" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('registrationNumber')}</th>
                  <th className="px-3 py-2 text-left inventory-header-blue" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('registrationDate')}</th>
                  <th className="px-3 py-2 text-left inventory-header-blue" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('supplierRnc')}</th>
                  <th className="px-3 py-2 text-left inventory-header-blue" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('supplierName')}</th>
                  <th className="px-3 py-2 text-left inventory-header-blue" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('ncf')}</th>
                  <th className="px-3 py-2 text-left inventory-header-blue" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('date')}</th>
                  <th className="px-3 py-2 text-left inventory-header-blue" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('operation')}</th>
                  <th className="px-3 py-2 text-left inventory-header-blue" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('product')}</th>
                  <th className="px-3 py-2 text-right inventory-header-blue" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('quantity')}</th>
                  <th className="px-3 py-2 text-right inventory-header-blue" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('unitCost')}</th>
                  <th className="px-3 py-2 text-right inventory-header-blue" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('amount')}</th>
                  <th className="px-3 py-2 text-right inventory-header-green" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('salesPrice')}</th>
                  <th className="px-3 py-2 text-right inventory-header-green" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('totalRevenue')}</th>
                  <th className="px-3 py-2 text-right inventory-header-orange" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('cost')}</th>
                  <th className="px-3 py-2 text-right inventory-header-yellow" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('grossMargin')}</th>
                  <th className="px-3 py-2 text-right inventory-header-yellow" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('grossMargin')} %</th>
                  <th className="px-3 py-2 text-right inventory-header-yellow" style={{ position: 'sticky', top: 0, zIndex: 20 }}>% On Cost</th>
                  <th className="px-3 py-2 text-right inventory-header-blue" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('balanceInQuantity')}</th>
                  <th className="px-3 py-2 text-right inventory-header-blue" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('balanceInAmount')}</th>
                  <th className="px-3 py-2 text-right inventory-header-blue" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('averageUnitCost')}</th>
                  <th className="px-3 py-2 text-center inventory-header-blue" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('year')}</th>
                  <th className="px-3 py-2 text-center inventory-header-blue" style={{ position: 'sticky', top: 0, zIndex: 20 }}>{t('month')}</th>
                </tr>
              </thead>
              <tbody>
                {sheet.movements.map((movement, index) => (
                  <tr key={index} className={`border-b ${movement.operation === 'BUYS' ? 'bg-green-50' : 'bg-red-50'}`}>
                    <td className="px-3 py-2">{movement.registrationNo}</td>
                    <td className="px-3 py-2">{new Date(movement.registrationDate).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{movement.rnc}</td>
                    <td className="px-3 py-2">{movement.supplierOrClient}</td>
                    <td className="px-3 py-2">{movement.ncf}</td>
                    <td className="px-3 py-2">{new Date(movement.date).toLocaleDateString()}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        movement.operation === 'BUYS' 
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-red-200 text-red-800'
                      }`}>
                        {movement.operation}
                      </span>
                    </td>
                    <td className="px-3 py-2">{movement.product}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(movement.amount)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-blue-600">{formatNumber(movement.unitPrice)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(movement.totalAmount)}</td>
                    <td className="px-3 py-2 text-right bg-green-50 font-semibold">
                      {movement.operation === 'SALE' ? formatNumber(movement.sellingPrice) : '-'}
                    </td>
                    <td className="px-3 py-2 text-right bg-green-50 font-semibold">
                      {movement.operation === 'SALE' ? formatNumber(movement.salesRevenue) : '-'}
                    </td>
                    <td className="px-3 py-2 text-right bg-orange-50 font-semibold">
                      {movement.operation === 'SALE' ? formatNumber(movement.totalAmount) : '-'}
                    </td>
                    <td className="px-3 py-2 text-right bg-yellow-50 font-semibold">
                      {movement.operation === 'SALE' ? formatNumber(movement.grossMargin) : '-'}
                    </td>
                    <td className="px-3 py-2 text-right bg-yellow-50">
                      {movement.operation === 'SALE' ? formatNumber(movement.marginPercentOnRevenue) + '%' : '-'}
                    </td>
                    <td className="px-3 py-2 text-right bg-yellow-50">
                      {movement.operation === 'SALE' ? formatNumber(movement.marginPercentOnCost) + '%' : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">{formatNumber(movement.balanceIn)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(movement.balanceInAmount)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(movement.averageUnitCost)}</td>
                    <td className="px-3 py-2 text-center">{new Date(movement.date).getFullYear()}</td>
                    <td className="px-3 py-2 text-center">{new Date(movement.date).toLocaleString('en-US', { month: 'long' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 border-t-2 border-blue-600">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-lg shadow">
                <p className="text-xs text-gray-600">Current Balance</p>
                <p className="text-xl font-bold text-blue-600">{formatNumber(sheet.totals.currentBalance)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <p className="text-xs text-gray-600">Average Cost</p>
                <p className="text-xl font-bold text-purple-600">{formatNumber(sheet.totals.averageCost)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <p className="text-xs text-gray-600">Total Income</p>
                <p className="text-xl font-bold text-green-600">{formatNumber(sheet.totals.totalIncome)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <p className="text-xs text-gray-600">{t('totalCost')}</p>
                <p className="text-xl font-bold text-red-600">{formatNumber(sheet.totals.totalCost)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <p className="text-xs text-gray-600">{t('grossMargin')}</p>
                <p className="text-xl font-bold text-orange-600">{formatNumber(sheet.totals.grossMargin)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <p className="text-xs text-gray-600">{t('grossMarginOnRevenue')}</p>
                <p className="text-xl font-bold text-teal-600">{formatNumber(sheet.totals.grossMarginPercent)}%</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <p className="text-xs text-gray-600">{t('grossMarginOnCost')}</p>
                <p className="text-xl font-bold text-indigo-600">{formatNumber(sheet.totals.grossMarginOnCost)}%</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <p className="text-xs text-gray-600">{t('purchases')}</p>
                <p className="text-xl font-bold text-gray-600">{formatNumber(sheet.totals.totalPurchases)}</p>
              </div>
            </div>
          </div>
        </div>
      ))}

      {filteredSheets.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-500 text-lg">{t('noInventoryMovements')}</p>
          <p className="text-gray-400 text-sm mt-2">{t('adjustDateRange')}</p>
        </div>
      )}
    </motion.div>
  );
};

export default Inventory;
