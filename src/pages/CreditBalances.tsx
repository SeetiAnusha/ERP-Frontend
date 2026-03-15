import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  User, 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  FileText,
  Eye,
  Download,
  RefreshCw,
  TrendingUp,
  Users,
  Building
} from 'lucide-react';
import api from '../api/axios';
import { useLanguage } from '../contexts/LanguageContext';

interface CreditBalance {
  id: number;
  registrationNumber: string;
  registrationDate: string;
  type: 'CUSTOMER_CREDIT' | 'SUPPLIER_CREDIT';
  relatedEntityType: 'CLIENT' | 'SUPPLIER';
  relatedEntityId: number;
  relatedEntityName: string;
  originalTransactionType: 'AR' | 'AP';
  originalTransactionId: number;
  originalTransactionNumber: string;
  creditAmount: number;
  usedAmount: number;
  availableAmount: number;
  status: 'ACTIVE' | 'FULLY_USED' | 'EXPIRED';
  expiryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreditSummary {
  totalCustomerCredits: number;
  totalSupplierCredits: number;
  activeCustomerCredits: number;
  activeSupplierCredits: number;
  totalActiveCredits: number;
  totalUsedCredits: number;
}

const CreditBalances: React.FC = () => {
  const { t } = useLanguage();
  const [creditBalances, setCreditBalances] = useState<CreditBalance[]>([]);
  const [filteredCredits, setFilteredCredits] = useState<CreditBalance[]>([]);
  const [summary, setSummary] = useState<CreditSummary>({
    totalCustomerCredits: 0,
    totalSupplierCredits: 0,
    activeCustomerCredits: 0,
    activeSupplierCredits: 0,
    totalActiveCredits: 0,
    totalUsedCredits: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedCredit, setSelectedCredit] = useState<CreditBalance | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchCreditBalances();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [creditBalances, searchTerm, filterType, filterStatus]);

  const fetchCreditBalances = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/credit-balances');
      setCreditBalances(response.data);
      calculateSummary(response.data);
    } catch (error) {
      console.error('Error fetching credit balances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSummary = (credits: CreditBalance[]) => {
    const summary = credits.reduce((acc, credit) => {
      if (credit.type === 'CUSTOMER_CREDIT') {
        acc.totalCustomerCredits += credit.creditAmount;
        if (credit.status === 'ACTIVE') {
          acc.activeCustomerCredits += credit.availableAmount;
        }
      } else {
        acc.totalSupplierCredits += credit.creditAmount;
        if (credit.status === 'ACTIVE') {
          acc.activeSupplierCredits += credit.availableAmount;
        }
      }
      
      if (credit.status === 'ACTIVE') {
        acc.totalActiveCredits += credit.availableAmount;
      }
      acc.totalUsedCredits += credit.usedAmount;
      
      return acc;
    }, {
      totalCustomerCredits: 0,
      totalSupplierCredits: 0,
      activeCustomerCredits: 0,
      activeSupplierCredits: 0,
      totalActiveCredits: 0,
      totalUsedCredits: 0
    });

    setSummary(summary);
  };

  const applyFilters = () => {
    let filtered = creditBalances;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(credit =>
        credit.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.relatedEntityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.originalTransactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'ALL') {
      filtered = filtered.filter(credit => credit.type === filterType);
    }

    // Status filter
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(credit => credit.status === filterStatus);
    }

    setFilteredCredits(filtered);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'FULLY_USED': return 'bg-gray-100 text-gray-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'CUSTOMER_CREDIT' ? User : Building;
  };

  const getTypeColor = (type: string) => {
    return type === 'CUSTOMER_CREDIT' ? 'blue' : 'green';
  };

  const handleViewDetails = (credit: CreditBalance) => {
    setSelectedCredit(credit);
    setShowDetailModal(true);
  };

  const exportToCSV = () => {
    const headers = [
      'Registration Number',
      'Date',
      'Type',
      'Entity Name',
      'Original Transaction',
      'Credit Amount',
      'Used Amount',
      'Available Amount',
      'Status',
      'Notes'
    ];

    const csvData = filteredCredits.map(credit => [
      credit.registrationNumber,
      new Date(credit.registrationDate).toLocaleDateString(),
      credit.type,
      credit.relatedEntityName,
      credit.originalTransactionNumber,
      credit.creditAmount,
      credit.usedAmount,
      credit.availableAmount,
      credit.status,
      credit.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-balances-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <CreditCard className="text-blue-600" />
          Credit Balance Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage and track all customer and supplier credit balances from overpayments
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Active Customer Credits</p>
              <p className="text-2xl font-bold mt-2">{formatNumber(summary.activeCustomerCredits)}</p>
            </div>
            <User className="text-4xl text-blue-300 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active Supplier Credits</p>
              <p className="text-2xl font-bold mt-2">{formatNumber(summary.activeSupplierCredits)}</p>
            </div>
            <Building className="text-4xl text-green-300 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Active Credits</p>
              <p className="text-2xl font-bold mt-2">{formatNumber(summary.totalActiveCredits)}</p>
            </div>
            <TrendingUp className="text-4xl text-purple-300 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Total Used Credits</p>
              <p className="text-2xl font-bold mt-2">{formatNumber(summary.totalUsedCredits)}</p>
            </div>
            <DollarSign className="text-4xl text-orange-300 opacity-50" />
          </div>
        </motion.div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by registration number, entity name, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Types</option>
          <option value="CUSTOMER_CREDIT">Customer Credits</option>
          <option value="SUPPLIER_CREDIT">Supplier Credits</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="FULLY_USED">Fully Used</option>
          <option value="EXPIRED">Expired</option>
        </select>

        <button
          onClick={fetchCreditBalances}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700"
        >
          <RefreshCw size={16} />
          Refresh
        </button>

        <button
          onClick={exportToCSV}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Credit Balances Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Registration #</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Date</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Type</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Entity</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Original Transaction</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">Credit Amount</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">Used Amount</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-800">Available</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">Status</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCredits.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || filterType !== 'ALL' || filterStatus !== 'ALL' 
                      ? 'No credit balances found matching your filters'
                      : 'No credit balances found'
                    }
                  </td>
                </tr>
              ) : (
                filteredCredits.map((credit, index) => {
                  const TypeIcon = getTypeIcon(credit.type);
                  const typeColor = getTypeColor(credit.type);
                  
                  return (
                    <motion.tr
                      key={credit.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-sm font-medium">{credit.registrationNumber}</td>
                      <td className="px-6 py-4 text-sm">{new Date(credit.registrationDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TypeIcon className={`text-${typeColor}-600`} size={16} />
                          <span className={`text-sm font-medium text-${typeColor}-800`}>
                            {credit.type === 'CUSTOMER_CREDIT' ? 'Customer' : 'Supplier'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{credit.relatedEntityName}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="text-blue-600 font-medium">
                          {credit.originalTransactionNumber}
                        </span>
                        <span className="text-gray-500 text-xs block">
                          ({credit.originalTransactionType})
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-right">
                        {formatNumber(credit.creditAmount)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-right text-red-600">
                        {formatNumber(credit.usedAmount)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-right text-green-600">
                        {formatNumber(credit.availableAmount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(credit.status)}`}>
                          {credit.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleViewDetails(credit)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Detail Modal */}
      {showDetailModal && selectedCredit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="text-blue-600" />
                Credit Balance Details
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                  <p className="text-lg font-semibold">{selectedCredit.registrationNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>
                  <p className="text-lg">{new Date(selectedCredit.registrationDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Entity Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Entity Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <div className="flex items-center gap-2">
                      {React.createElement(getTypeIcon(selectedCredit.type), { 
                        className: `text-${getTypeColor(selectedCredit.type)}-600`, 
                        size: 16 
                      })}
                      <span>{selectedCredit.type === 'CUSTOMER_CREDIT' ? 'Customer Credit' : 'Supplier Credit'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entity Name</label>
                    <p className="font-medium">{selectedCredit.relatedEntityName}</p>
                  </div>
                </div>
              </div>

              {/* Original Transaction */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Original Transaction</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                    <p className="font-medium">{selectedCredit.originalTransactionType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Number</label>
                    <p className="font-medium text-blue-600">{selectedCredit.originalTransactionNumber}</p>
                  </div>
                </div>
              </div>

              {/* Credit Amounts */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Credit Amounts</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Credit</label>
                    <p className="text-xl font-bold text-green-600">{formatNumber(selectedCredit.creditAmount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Used Amount</label>
                    <p className="text-xl font-bold text-red-600">{formatNumber(selectedCredit.usedAmount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Available</label>
                    <p className="text-xl font-bold text-green-600">{formatNumber(selectedCredit.availableAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Status and Notes */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCredit.status)}`}>
                    {selectedCredit.status}
                  </span>
                </div>
                
                {selectedCredit.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded">{selectedCredit.notes}</p>
                  </div>
                )}

                {selectedCredit.expiryDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <p className="text-gray-900">{new Date(selectedCredit.expiryDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <label className="block font-medium mb-1">Created At</label>
                    <p>{new Date(selectedCredit.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Updated At</label>
                    <p>{new Date(selectedCredit.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CreditBalances;