import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaFileExcel, FaCalendar, FaSearch, FaChartLine } from 'react-icons/fa';
import axios from '../api/axios';
import { Product, Purchase, Sale } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

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
  unitPrice: number;
  totalAmount: number;
  balanceInAmount: number;
  balanceIn: number;
  averageUnitCost: number;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [inventorySheets, setInventorySheets] = useState<InventorySheet[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (products.length > 0 && purchases.length > 0 && sales.length > 0) {
      calculateInventorySheets();
    }
  }, [products, purchases, sales, dateRange, selectedProduct]);

  const fetchData = async () => {
    try {
      const [productsRes, purchasesRes, salesRes] = await Promise.all([
        axios.get('/products'),
        axios.get('/purchases'),
        axios.get('/sales'),
      ]);
      setProducts(productsRes.data);
      setPurchases(purchasesRes.data);
      setSales(salesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const calculateInventorySheets = () => {
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
                  amount: item.quantity,
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
                movements.push({
                  registrationNo: sale.registrationNumber,
                  registrationDate: sale.registrationDate,
                  rnc: sale.clientRnc || '',
                  supplierOrClient: sale.client?.name || '',
                  ncf: sale.ncf || '',
                  date: sale.date,
                  operation: 'SALE',
                  product: product.name,
                  amount: item.quantity,
                  unitPrice: parseFloat(item.unitPrice.toString()),
                  totalAmount: parseFloat(item.total.toString()),
                  balanceInAmount: 0, // Will be calculated after sorting
                  balanceIn: 0, // Will be calculated after sorting
                  averageUnitCost: 0, // Will be calculated after sorting
                });
              }
            }
          });
        }
      });

      // Sort movements by date first
      movements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
                openingBalance += item.quantity;
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
                const costOfSale = avgCost * item.quantity;
                openingBalance -= item.quantity;
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
          // SALE
          const avgCost = runningBalance > 0 ? runningBalanceAmount / runningBalance : 0;
          const costOfSale = avgCost * movement.amount;
          runningBalance -= movement.amount;
          runningBalanceAmount -= costOfSale;
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
  };

  const exportToExcel = () => {
    alert('Excel export functionality would be implemented here');
  };

  const filteredSheets = inventorySheets.filter(sheet =>
    sheet.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="px-3 py-2 text-left">{t('registrationNumber')}</th>
                  <th className="px-3 py-2 text-left">{t('registrationDate')}</th>
                  <th className="px-3 py-2 text-left">{t('supplierRnc')}</th>
                  <th className="px-3 py-2 text-left">{t('supplierName')}</th>
                  <th className="px-3 py-2 text-left">{t('ncf')}</th>
                  <th className="px-3 py-2 text-left">{t('date')}</th>
                  <th className="px-3 py-2 text-left">{t('operation')}</th>
                  <th className="px-3 py-2 text-left">{t('product')}</th>
                  <th className="px-3 py-2 text-right">{t('quantity')}</th>
                  <th className="px-3 py-2 text-right">{t('unitPrice')}</th>
                  <th className="px-3 py-2 text-right">{t('amount')}</th>
                  <th className="px-3 py-2 text-right">{t('balanceInQuantity')}</th>
                  <th className="px-3 py-2 text-right">{t('balanceInAmount')}</th>
                  <th className="px-3 py-2 text-right">{t('averageUnitCost')}</th>
                  <th className="px-3 py-2 text-center">{t('year')}</th>
                  <th className="px-3 py-2 text-center">{t('month')}</th>
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
                    <td className="px-3 py-2 text-right">{movement.amount}</td>
                    <td className="px-3 py-2 text-right">{movement.unitPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{movement.totalAmount.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{movement.balanceIn}</td>
                    <td className="px-3 py-2 text-right">{movement.balanceInAmount.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{movement.averageUnitCost.toFixed(2)}</td>
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
                <p className="text-xl font-bold text-blue-600">{sheet.totals.currentBalance}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <p className="text-xs text-gray-600">Average Cost</p>
                <p className="text-xl font-bold text-purple-600">{sheet.totals.averageCost.toFixed(2)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <p className="text-xs text-gray-600">Total Income</p>
                <p className="text-xl font-bold text-green-600">{sheet.totals.totalIncome.toFixed(2)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <p className="text-xs text-gray-600">{t('totalCost')}</p>
                <p className="text-xl font-bold text-red-600">{sheet.totals.totalCost.toFixed(2)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <p className="text-xs text-gray-600">{t('grossMargin')}</p>
                <p className="text-xl font-bold text-orange-600">{sheet.totals.grossMargin.toFixed(2)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <p className="text-xs text-gray-600">{t('grossMarginOnRevenue')}</p>
                <p className="text-xl font-bold text-teal-600">{sheet.totals.grossMarginPercent.toFixed(2)}%</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <p className="text-xs text-gray-600">{t('grossMarginOnCost')}</p>
                <p className="text-xl font-bold text-indigo-600">{sheet.totals.grossMarginOnCost.toFixed(2)}%</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow">
                <p className="text-xs text-gray-600">{t('purchases')}</p>
                <p className="text-xl font-bold text-gray-600">{sheet.totals.totalPurchases}</p>
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
