import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  account?: any;
  mode: 'create' | 'edit';
}

const AccountModal = ({ isOpen, onClose, onSubmit, account, mode }: AccountModalProps) => {
  const [formData, setFormData] = useState({
    accountCode: '',
    accountName: '',
    accountType: 'ASSET',
    accountSubType: 'CURRENT_ASSET',
    normalBalance: 'DEBIT',
    description: '',
    isActive: true,
    level: 1,
  });

  useEffect(() => {
    if (account && mode === 'edit') {
      setFormData({
        accountCode: account.accountCode || '',
        accountName: account.accountName || '',
        accountType: account.accountType || 'ASSET',
        accountSubType: account.accountSubType || 'CURRENT_ASSET',
        normalBalance: account.normalBalance || 'DEBIT',
        description: account.description || '',
        isActive: account.isActive ?? true,
        level: account.level || 1,
      });
    } else {
      setFormData({
        accountCode: '',
        accountName: '',
        accountType: 'ASSET',
        accountSubType: 'CURRENT_ASSET',
        normalBalance: 'DEBIT',
        description: '',
        isActive: true,
        level: 1,
      });
    }
  }, [account, mode, isOpen]);

  const accountTypes = [
    { value: 'ASSET', label: 'Asset' },
    { value: 'LIABILITY', label: 'Liability' },
    { value: 'EQUITY', label: 'Equity' },
    { value: 'REVENUE', label: 'Revenue' },
    { value: 'EXPENSE', label: 'Expense' },
  ];

  const accountSubTypes: Record<string, { value: string; label: string }[]> = {
    ASSET: [
      { value: 'CURRENT_ASSET', label: 'Current Asset' },
      { value: 'FIXED_ASSET', label: 'Fixed Asset' },
      { value: 'INVENTORY', label: 'Inventory' },
      { value: 'ACCOUNTS_RECEIVABLE', label: 'Accounts Receivable' },
      { value: 'CASH', label: 'Cash' },
      { value: 'BANK', label: 'Bank' },
    ],
    LIABILITY: [
      { value: 'CURRENT_LIABILITY', label: 'Current Liability' },
      { value: 'LONG_TERM_LIABILITY', label: 'Long Term Liability' },
      { value: 'ACCOUNTS_PAYABLE', label: 'Accounts Payable' },
      { value: 'CREDIT_CARD', label: 'Credit Card' },
    ],
    EQUITY: [
      { value: 'CAPITAL', label: 'Capital' },
      { value: 'RETAINED_EARNINGS', label: 'Retained Earnings' },
      { value: 'DRAWINGS', label: 'Drawings' },
    ],
    REVENUE: [
      { value: 'SALES_REVENUE', label: 'Sales Revenue' },
      { value: 'SERVICE_REVENUE', label: 'Service Revenue' },
      { value: 'OTHER_INCOME', label: 'Other Income' },
    ],
    EXPENSE: [
      { value: 'COST_OF_GOODS_SOLD', label: 'Cost of Goods Sold' },
      { value: 'OPERATING_EXPENSE', label: 'Operating Expense' },
      { value: 'ADMINISTRATIVE_EXPENSE', label: 'Administrative Expense' },
      { value: 'FINANCIAL_EXPENSE', label: 'Financial Expense' },
    ],
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Auto-update normal balance based on account type
      if (name === 'accountType') {
        const normalBalance = ['ASSET', 'EXPENSE'].includes(value) ? 'DEBIT' : 'CREDIT';
        setFormData(prev => ({ ...prev, normalBalance }));
        
        // Reset sub-type when type changes
        const firstSubType = accountSubTypes[value]?.[0]?.value || '';
        setFormData(prev => ({ ...prev, accountSubType: firstSubType }));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800">
            {mode === 'create' ? 'Add New Account' : 'Edit Account'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FaTimes size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="accountCode"
                value={formData.accountCode}
                onChange={handleChange}
                required
                disabled={mode === 'edit'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="e.g., 1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Cash in Hand"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {accountTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Sub-Type <span className="text-red-500">*</span>
              </label>
              <select
                name="accountSubType"
                value={formData.accountSubType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {accountSubTypes[formData.accountType]?.map(subType => (
                  <option key={subType.value} value={subType.value}>
                    {subType.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Normal Balance <span className="text-red-500">*</span>
              </label>
              <select
                name="normalBalance"
                value={formData.normalBalance}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="DEBIT">Debit</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <input
                type="number"
                name="level"
                value={formData.level}
                onChange={handleChange}
                min="1"
                max="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">
              Active Account
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {mode === 'create' ? 'Create Account' : 'Update Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountModal;
