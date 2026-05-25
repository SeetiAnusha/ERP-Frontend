/**
 * Cash Register Header Component
 * 
 * Displays the header with title and action buttons
 */

import React from 'react';
import { FaPlus, FaWallet, FaArrowDown } from 'react-icons/fa';
import { useLanguage } from '../../../contexts/LanguageContext';

interface CashRegisterHeaderProps {
  onNewTransaction: () => void;
  onBankDeposit: () => void;
  onEODReport: () => void;
}

export const CashRegisterHeader: React.FC<CashRegisterHeaderProps> = ({
  onNewTransaction,
  onBankDeposit,
  onEODReport,
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">{t('cashRegister')}</h2>
          <p className="text-gray-600 mt-1">{t('dailyCashManagement')}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onEODReport}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
          >
            <FaWallet /> {t('endOfDayReport')}
          </button>
          <button
            onClick={onBankDeposit}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <FaArrowDown /> {t('bankDeposit')}
          </button>
          <button
            onClick={onNewTransaction}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <FaPlus /> {t('newTransaction')}
          </button>
        </div>
      </div>
    </div>
  );
};
