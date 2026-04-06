import React, { useMemo } from 'react';
import { Building2 } from 'lucide-react';
import { useBankAccounts } from '../../hooks/queries/useSharedData';
import { formatNumber } from '../../utils/formatNumber';

interface BankAccountSelectorProps {
  value: string | number;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  showBalance?: boolean;
  filterActive?: boolean;
  className?: string;
  error?: string;
}

const BankAccountSelector: React.FC<BankAccountSelectorProps> = ({
  value,
  onChange,
  required = false,
  disabled = false,
  label = 'Bank Account',
  showBalance = true,
  filterActive = true,
  className = '',
  error
}) => {
  const { data: allBankAccounts = [], isLoading } = useBankAccounts();

  const bankAccounts = useMemo(() => {
    if (!filterActive) return allBankAccounts;
    return allBankAccounts.filter((acc: any) => acc.status === 'ACTIVE');
  }, [allBankAccounts, filterActive]);

  if (isLoading) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-gray-500 text-sm">Loading bank accounts...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Building2 size={16} className="inline mr-1" />
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        <option value="">Select bank account...</option>
        {bankAccounts.map((account: any) => (
          <option key={account.id} value={account.id}>
            {account.bankName} - {account.accountNumber}
            {showBalance && ` (Balance: ₹${formatNumber(Number(account.balance || 0))})`}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {bankAccounts.length === 0 && !isLoading && (
        <p className="mt-1 text-sm text-yellow-600">
          ⚠️ No active bank accounts found. Please add a bank account first.
        </p>
      )}
    </div>
  );
};

export default BankAccountSelector;
