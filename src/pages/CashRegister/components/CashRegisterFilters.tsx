/**
 * Cash Register Filters Component
 * 
 * Displays search and filter controls
 */

import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import SearchBar from '../../../components/common/SearchBar';

interface CashRegisterFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
}

export const CashRegisterFilters: React.FC<CashRegisterFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search Bar */}
        <SearchBar
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={t('searchTransactions')}
        />

        {/* Transaction Type Filter */}
        <select
          value={filterType}
          onChange={(e) => onFilterTypeChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="All">{t('allTransactions')}</option>
          <option value="INFLOW">{t('inflowMoneyIn')}</option>
          <option value="OUTFLOW">{t('outflowMoneyOut')}</option>
        </select>
      </div>
    </div>
  );
};
