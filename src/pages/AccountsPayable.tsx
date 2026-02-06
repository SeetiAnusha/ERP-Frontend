import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaFileInvoiceDollar, FaSearch, FaExclamationTriangle, FaCheckCircle, FaClock } from 'react-icons/fa';
import axios from '../api/axios';
import { Purchase, Supplier } from '../types';

interface AccountPayable {
  id: number;
  registrationNumber: string;
  date: string;
  supplierId: number;
  supplierName: string;
  supplierRnc: string;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  paymentType: string;
  paymentTerms: string;
  dueDate: string;
  daysOverdue: number;
  status: 'Current' | 'Due Soon' | 'Overdue' | 'Paid';
}

const AccountsPayable = () => {
  const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterSupplier, setFilterSupplier] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPurchases(),
        fetchSuppliers()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await axios.get('/purchases');
      const purchases: Purchase[] = response.data;
      
      const payables = purchases
        .filter(p => p.balanceAmount > 0 && p.paymentType === 'Credit')
        .map(p => {
          const dueDate = calculateDueDate(p.date, p.supplier?.paymentTerms || '30 days');
          const daysOverdue = calculateDaysOverdue(dueDate);
          const status = determineStatus(daysOverdue, p.balanceAmount);
          
          return {
            id: p.id,
            registrationNumber: p.registrationNumber,
            date: p.date,
            supplierId: p.supplierId,
            supplierName: p.supplier?.name || '',
            supplierRnc: p.supplierRnc || '',
            total: p.total,
            paidAmount: p.paidAmount,
            balanceAmount: p.balanceAmount,
            paymentType: p.paymentType,
            paymentTerms: p.supplier?.paymentTerms || '30 days',
            dueDate,
            daysOverdue,
            status
          };
        });
      
      setAccountsPayable(payables);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };



  const calculateDueDate = (invoiceDate: string, paymentTerms: string): string => {
    const date = new Date(invoiceDate);
    const daysMatch = paymentTerms.match(/(\d+)/);
    const days = daysMatch ? parseInt(daysMatch[1]) : 30;
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const calculateDaysOverdue = (dueDate: string): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const determineStatus = (daysOverdue: number, balance: number): 'Current' | 'Due Soon' | 'Overdue' | 'Paid' => {
    if (balance === 0) return 'Paid';
    if (daysOverdue > 0) return 'Overdue';
    if (daysOverdue >= -7) return 'Due Soon';
    return 'Current';
  };

  const filteredAccountsPayable = accountsPayable.filter(ap => {
    const matchesSearch = 
      ap.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ap.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ap.supplierRnc.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || ap.status === filterStatus;
    const matchesSupplier = filterSupplier === 'All' || ap.supplierId.toString() === filterSupplier;
    
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const totalOutstanding = accountsPayable.reduce((sum, ap) => sum + ap.balanceAmount, 0);
  const totalOverdue = accountsPayable
    .filter(ap => ap.status === 'Overdue')
    .reduce((sum, ap) => sum + ap.balanceAmount, 0);
  const totalDueSoon = accountsPayable
    .filter(ap => ap.status === 'Due Soon')
    .reduce((sum, ap) => sum + ap.balanceAmount, 0);
  const totalCurrent = accountsPayable
    .filter(ap => ap.status === 'Current')
    .reduce((sum, ap) => sum + ap.balanceAmount, 0);

  const getStatusBadge = (status: string) => {
    const badges = {
      'Current': 'bg-blue-100 text-blue-800',
      'Due Soon': 'bg-yellow-100 text-yellow-800',
      'Overdue': 'bg-red-100 text-red-800',
      'Paid': 'bg-green-100 text-green-800'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Current':
        return <FaCheckCircle className="text-blue-500" />;
      case 'Due Soon':
        return <FaClock className="text-yellow-500" />;
      case 'Overdue':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'Paid':
        return <FaCheckCircle className="text-green-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading accounts payable...</div>
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
            <h2 className="text-3xl font-bold text-gray-800">Accounts Payable (CxP)</h2>
            <p className="text-gray-600 mt-1">Track outstanding invoices and payment obligations</p>
          </div>
          <FaFileInvoiceDollar className="text-5xl text-blue-600" />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Outstanding</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">{accountsPayable.length} invoices</p>
              </div>
              <FaFileInvoiceDollar className="text-gray-400 text-3xl" />
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Overdue</p>
                <p className="text-2xl font-bold text-red-700">
                  ${totalOverdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-red-500 mt-1">
                  {accountsPayable.filter(ap => ap.status === 'Overdue').length} invoices
                </p>
              </div>
              <FaExclamationTriangle className="text-red-400 text-3xl" />
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Due Soon (7 days)</p>
                <p className="text-2xl font-bold text-yellow-700">
                  ${totalDueSoon.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-yellow-500 mt-1">
                  {accountsPayable.filter(ap => ap.status === 'Due Soon').length} invoices
                </p>
              </div>
              <FaClock className="text-yellow-400 text-3xl" />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Current</p>
                <p className="text-2xl font-bold text-blue-700">
                  ${totalCurrent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  {accountsPayable.filter(ap => ap.status === 'Current').length} invoices
                </p>
              </div>
              <FaCheckCircle className="text-blue-400 text-3xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice #, supplier name, or RNC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Status</option>
            <option value="Overdue">Overdue</option>
            <option value="Due Soon">Due Soon</option>
            <option value="Current">Current</option>
          </select>

          <select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Suppliers</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Accounts Payable Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CxP #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RNC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Terms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Overdue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccountsPayable.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                    No accounts payable found
                  </td>
                </tr>
              ) : (
                filteredAccountsPayable.map((ap) => (
                  <tr key={ap.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ap.status)}
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(ap.status)}`}>
                          {ap.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ap.registrationNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ap.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {ap.supplierName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ap.supplierRnc}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ap.paymentTerms}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ap.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      ${ap.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                      ${ap.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-red-600">
                      ${ap.balanceAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {ap.daysOverdue > 0 ? (
                        <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded">
                          {ap.daysOverdue} days
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td colSpan={7} className="px-6 py-4 text-right font-bold text-gray-700">
                  Totals:
                </td>
                <td className="px-6 py-4 text-right font-bold text-gray-900">
                  ${filteredAccountsPayable.reduce((sum, ap) => sum + ap.total, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 text-right font-bold text-green-600">
                  ${filteredAccountsPayable.reduce((sum, ap) => sum + ap.paidAmount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 text-right font-bold text-red-600">
                  ${filteredAccountsPayable.reduce((sum, ap) => sum + ap.balanceAmount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default AccountsPayable;
