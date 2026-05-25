/**
 * Cash Register Summary Component
 * 
 * Displays summary cards for inflow, outflow, and net position
 */

import React from 'react';
import { FaArrowUp, FaArrowDown, FaWallet } from 'react-icons/fa';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatNumber } from '../../../utils/formatNumber';

interface CashRegisterSummaryProps {
  totalInflow: number;
  totalOutflow: number;
  inflowCount: number;
  outflowCount: number;
}

export const CashRegisterSummary: React.FC<CashRegisterSummaryProps> = ({
  totalInflow,
  totalOutflow,
  inflowCount,
  outflowCount,
}) => {
  const { t } = useLanguage();
  const netPosition = totalInflow - totalOutflow;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      {/* Inflow Card */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-600 text-sm font-medium">{t('totalInflow')}</p>
            <p className="text-2xl font-bold text-green-700">
              {formatNumber(totalInflow)}
            </p>
            <p className="text-xs text-green-500 mt-1">
              {inflowCount} transactions
            </p>
          </div>
          <FaArrowUp className="text-green-400 text-3xl" />
        </div>
      </div>

      {/* Outflow Card */}
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-600 text-sm font-medium">{t('totalOutflow')}</p>
            <p className="text-2xl font-bold text-red-700">
              {formatNumber(totalOutflow)}
            </p>
            <p className="text-xs text-red-500 mt-1">
              {outflowCount} transactions
            </p>
          </div>
          <FaArrowDown className="text-red-400 text-3xl" />
        </div>
      </div>

      {/* Net Position Card */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-600 text-sm font-medium">{t('netCashPosition')}</p>
            <p className={`text-2xl font-bold ${netPosition >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {formatNumber(netPosition)}
            </p>
            <p className="text-xs text-blue-500 mt-1">
              Inflow - Outflow
            </p>
          </div>
          <FaWallet className="text-blue-400 text-3xl" />
        </div>
      </div>
    </div>
  );
};
