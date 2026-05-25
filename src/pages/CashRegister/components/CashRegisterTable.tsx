/**
 * Cash Register Table Component
 * 
 * Displays the transactions table with all columns
 */

import React from 'react';
import { FaTrash } from 'react-icons/fa';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatNumber } from '../../../utils/formatNumber';
import { CashTransaction } from '../../../types';
import { getSourceBadgeColor, getSourceLabel } from '../../../types/CashRegisterSourceType';

interface CashRegisterTableProps {
  transactions: CashTransaction[];
  loading: boolean;
  onDelete: (id: number) => void;
}

export const CashRegisterTable: React.FC<CashRegisterTableProps> = ({
  transactions,
  loading,
  onDelete,
}) => {
  const { t } = useLanguage();

  /**
   * Get transaction status badge
   */
  const getTransactionStatusBadge = (transaction: CashTransaction) => {
    if (transaction.deletion_status === 'EXECUTED') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
          🗑️ DELETED
        </span>
      );
    }
    
    if (transaction.is_reversal) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
          ↩️ REVERSAL
        </span>
      );
    }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        transaction.transactionType === 'INFLOW' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {transaction.transactionType === 'INFLOW' ? '💰 INFLOW' : '💸 OUTFLOW'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4">
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                {t('registrationHash')}
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                {t('date')}
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                {t('source')}
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                {t('docNumber')}
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                {t('type')}
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                {t('method')}
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                Client Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">
                Store Name
              </th>
              <th className="px-6 py-3 text-right text-sm font-bold text-gray-800 uppercase tracking-wider">
                {t('amount')}
              </th>
              <th className="px-6 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                  Loading transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                  {t('noTransactionsFound')}
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => {
                const isDeleted = transaction.deletion_status === 'EXECUTED';
                const isReversal = transaction.is_reversal === true;
                
                return (
                  <tr 
                    key={transaction.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      isDeleted ? 'bg-red-50 opacity-75' : 
                      isReversal ? 'bg-orange-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {isDeleted && <span className="text-red-500">🗑️</span>}
                        {isReversal && <span className="text-orange-500">↩️</span>}
                        <span className={isDeleted ? 'line-through text-gray-500' : ''}>
                          {transaction.registrationNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.registrationDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        getSourceBadgeColor(transaction.relatedDocumentType)
                      }`}>
                        {getSourceLabel(transaction.relatedDocumentType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">
                      {transaction.relatedDocumentNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTransactionStatusBadge(transaction)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.clientName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.cashRegisterMaster?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                      <span className={`${
                        isDeleted ? 'line-through text-gray-500' : 
                        transaction.transactionType === 'INFLOW' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transactionType === 'INFLOW' ? '+' : '-'}
                        {formatNumber(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => onDelete(transaction.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
