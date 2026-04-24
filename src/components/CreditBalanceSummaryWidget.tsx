import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, User, Building, TrendingUp, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface CreditSummary {
  totalCustomerCredits: number;
  totalSupplierCredits: number;
  activeCustomerCredits: number;
  activeSupplierCredits: number;
  totalActiveCredits: number;
  totalCreditCount: number;
}

const CreditBalanceSummaryWidget: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<CreditSummary>({
    totalCustomerCredits: 0,
    totalSupplierCredits: 0,
    activeCustomerCredits: 0,
    activeSupplierCredits: 0,
    totalActiveCredits: 0,
    totalCreditCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCreditSummary();
  }, []);

  const fetchCreditSummary = async () => {
    try {
      const response = await api.get('/credit-balances');
      const credits = response.data;
      
      const calculatedSummary = credits.reduce((acc: CreditSummary, credit: any) => {
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
        
        return acc;
      }, {
        totalCustomerCredits: 0,
        totalSupplierCredits: 0,
        activeCustomerCredits: 0,
        activeSupplierCredits: 0,
        totalActiveCredits: 0,
        totalCreditCount: credits.length
      });

      setSummary(calculatedSummary);
    } catch (error) {
      console.error('Error fetching credit summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(num);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (summary.totalCreditCount === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="text-blue-600" size={20} />
            Credit Balances
          </h3>
        </div>
        <div className="text-center py-8">
          <CreditCard className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No credit balances found</p>
          <p className="text-sm text-gray-400 mt-1">
            Credit balances are created when customers or suppliers overpay
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CreditCard className="text-blue-600" size={20} />
          Credit Balances Overview
        </h3>
        <button
          onClick={() => navigate('/expenses/credit-balances')}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium"
        >
          <Eye size={14} />
          View All
        </button>
      </div>

      <div className="space-y-4">
        {/* Total Active Credits */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-green-600" size={16} />
              <span className="text-sm font-medium text-green-800">Total Active Credits</span>
            </div>
            <span className="text-lg font-bold text-green-900">
              {formatNumber(summary.totalActiveCredits)}
            </span>
          </div>
        </div>

        {/* Customer Credits */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="text-blue-600" size={16} />
              <span className="text-sm font-medium text-blue-800">Customer Credits</span>
            </div>
            <span className="text-lg font-bold text-blue-900">
              {formatNumber(summary.activeCustomerCredits)}
            </span>
          </div>
          {summary.totalCustomerCredits > summary.activeCustomerCredits && (
            <div className="mt-2 text-xs text-blue-600">
              Total created: {formatNumber(summary.totalCustomerCredits)}
            </div>
          )}
        </div>

        {/* Supplier Credits */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="text-purple-600" size={16} />
              <span className="text-sm font-medium text-purple-800">Supplier Credits</span>
            </div>
            <span className="text-lg font-bold text-purple-900">
              {formatNumber(summary.activeSupplierCredits)}
            </span>
          </div>
          {summary.totalSupplierCredits > summary.activeSupplierCredits && (
            <div className="mt-2 text-xs text-purple-600">
              Total created: {formatNumber(summary.totalSupplierCredits)}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Total Credit Records:</span>
            <span className="font-semibold text-gray-900">{summary.totalCreditCount}</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => navigate('/expenses/credit-balances')}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Manage Credit Balances
        </button>
      </div>
    </motion.div>
  );
};

export default CreditBalanceSummaryWidget;