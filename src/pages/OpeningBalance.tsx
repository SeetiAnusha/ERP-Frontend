import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash, FaCalculator, FaSave } from 'react-icons/fa';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { notify } from '../utils/notifications';
import { useChartOfAccounts } from '../hooks/queries/useAccounting';

interface OpeningBalanceEntry {
  accountCode: string;
  accountName?: string;
  amount: number;
  entryType: 'DEBIT' | 'CREDIT';
}

const OpeningBalance = () => {
  const queryClient = useQueryClient();
  const { data: accounts = [] } = useChartOfAccounts();
  
  const [effectiveDate, setEffectiveDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [entries, setEntries] = useState<OpeningBalanceEntry[]>([
    { accountCode: '', amount: 0, entryType: 'DEBIT' },
  ]);
  const [autoBalance, setAutoBalance] = useState(true);
  const [equityAccountCode, setEquityAccountCode] = useState('3000');

  // Calculate totals
  const totalDebits = entries
    .filter(e => e.entryType === 'DEBIT')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const totalCredits = entries
    .filter(e => e.entryType === 'CREDIT')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const difference = totalDebits - totalCredits;
  const isBalanced = Math.abs(difference) < 0.01;

  // Mutation for creating opening balances
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/accounting/opening-balances', data);
      return response.data;
    },
    onSuccess: (data) => {
      notify.success('Success', `Opening balances created: ${data.entryNumber}`);
      queryClient.invalidateQueries({ queryKey: ['general-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['trial-balance'] });
      // Reset form
      setEntries([{ accountCode: '', amount: 0, entryType: 'DEBIT' }]);
    },
    onError: (error: any) => {
      notify.error('Error', error.response?.data?.error || 'Failed to create opening balances');
    },
  });

  const addEntry = () => {
    setEntries([...entries, { accountCode: '', amount: 0, entryType: 'DEBIT' }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, field: keyof OpeningBalanceEntry, value: any) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill account name when account code is selected
    if (field === 'accountCode') {
      const account = accounts.find((a: any) => a.accountCode === value);
      if (account) {
        updated[index].accountName = account.accountName;
      }
    }
    
    setEntries(updated);
  };

  const handleSubmit = () => {
    // Validation
    if (!effectiveDate) {
      notify.error('Validation Error', 'Effective date is required');
      return;
    }

    const validEntries = entries.filter(e => e.accountCode && e.amount > 0);
    if (validEntries.length === 0) {
      notify.error('Validation Error', 'At least one valid entry is required');
      return;
    }

    if (!isBalanced && !autoBalance) {
      notify.error('Validation Error', 'Debits and credits must be balanced, or enable auto-balance');
      return;
    }

    createMutation.mutate({
      effectiveDate: new Date(effectiveDate),
      entries: validEntries,
      description: 'Opening balance',
      autoBalanceWithEquity: autoBalance,
      equityAccountCode: equityAccountCode,
    });
  };

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
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FaCalculator className="text-blue-600" />
              Opening Balances
            </h2>
            <p className="text-gray-600 mt-1">Set initial account balances for your accounting system</p>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Effective Date *
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Date when these balances take effect</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto-Balance with Equity
            </label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoBalance}
                onChange={(e) => setAutoBalance(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Automatically balance with Owner's Capital
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Creates balancing entry if debits ≠ credits</p>
          </div>

          {autoBalance && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equity Account Code
              </label>
              <input
                type="text"
                value={equityAccountCode}
                onChange={(e) => setEquityAccountCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="3000"
              />
              <p className="text-xs text-gray-500 mt-1">Account for balancing entry</p>
            </div>
          )}
        </div>
      </div>

      {/* Entries */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Opening Balance Entries</h3>
          <button
            onClick={addEntry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <FaPlus />
            Add Entry
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Account
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map((entry, index) => (
                <tr key={index}>
                  <td className="px-4 py-3">
                    <select
                      value={entry.accountCode}
                      onChange={(e) => updateEntry(index, 'accountCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Account</option>
                      {accounts.map((account: any) => (
                        <option key={account.id} value={account.accountCode}>
                          {account.accountCode} - {account.accountName}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={entry.entryType}
                      onChange={(e) => updateEntry(index, 'entryType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DEBIT">Debit</option>
                      <option value="CREDIT">Credit</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={entry.amount}
                      onChange={(e) => updateEntry(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => removeEntry(index)}
                      disabled={entries.length === 1}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Total Debits</h3>
          <p className="text-3xl font-bold">{totalDebits.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Total Credits</h3>
          <p className="text-3xl font-bold">{totalCredits.toFixed(2)}</p>
        </div>

        <div className={`rounded-xl shadow-lg p-6 text-white ${
          isBalanced 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
            : 'bg-gradient-to-br from-orange-500 to-orange-600'
        }`}>
          <h3 className="text-sm font-medium opacity-90 mb-2">Difference</h3>
          <p className="text-3xl font-bold">{Math.abs(difference).toFixed(2)}</p>
          <p className="text-xs mt-1">
            {isBalanced ? '✓ Balanced' : autoBalance ? '⚠ Will auto-balance' : '✗ Not balanced'}
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              {isBalanced 
                ? '✓ Entries are balanced and ready to post'
                : autoBalance
                ? `⚠ Difference of ${Math.abs(difference).toFixed(2)} will be balanced with ${equityAccountCode}`
                : '✗ Entries must be balanced before posting'
              }
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending || (!isBalanced && !autoBalance)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave />
            {createMutation.isPending ? 'Creating...' : 'Create Opening Balances'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default OpeningBalance;
