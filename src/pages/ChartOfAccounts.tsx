import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBook, FaPlus, FaEdit, FaTrash, FaSearch, FaUpload } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  useChartOfAccounts, 
  useCreateAccount, 
  useUpdateAccount, 
  useDeleteAccount,
  useInitializeAccounts 
} from '../hooks/queries/useAccounting';
import { formatNumber } from '../utils/formatNumber';
import AccountModal from '../components/modals/AccountModal';

const ChartOfAccounts = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const { data: accounts = [], isLoading } = useChartOfAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const initializeAccounts = useInitializeAccounts();

  const accountTypes = ['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

  const filteredAccounts = accounts.filter((account: any) => {
    const matchesSearch = 
      account.accountCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'ALL' || account.accountType === filterType;
    
    return matchesSearch && matchesType;
  });

  const groupedAccounts = filteredAccounts.reduce((acc: any, account: any) => {
    if (!acc[account.accountType]) {
      acc[account.accountType] = [];
    }
    acc[account.accountType].push(account);
    return acc;
  }, {});

  const getTypeColor = (type: string) => {
    const colors: any = {
      ASSET: 'bg-blue-100 text-blue-800',
      LIABILITY: 'bg-red-100 text-red-800',
      EQUITY: 'bg-green-100 text-green-800',
      REVENUE: 'bg-purple-100 text-purple-800',
      EXPENSE: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleAddAccount = () => {
    setSelectedAccount(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditAccount = (account: any) => {
    setSelectedAccount(account);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteAccount = async (id: number, accountName: string) => {
    if (window.confirm(`Are you sure you want to delete "${accountName}"?`)) {
      await deleteAccount.mutateAsync(id);
    }
  };

  const handleModalSubmit = async (data: any) => {
    try {
      if (modalMode === 'create') {
        await createAccount.mutateAsync(data);
      } else {
        await updateAccount.mutateAsync({ id: selectedAccount.id, ...data });
      }
      setIsModalOpen(false);
      setSelectedAccount(null);
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  const handleInitializeAccounts = async () => {
    if (window.confirm('This will create default Chart of Accounts. Continue?')) {
      await initializeAccounts.mutateAsync();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FaBook className="text-blue-600" />
              Chart of Accounts
            </h2>
            <p className="text-gray-600 mt-1">Manage your accounting structure</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleInitializeAccounts}
              disabled={initializeAccounts.isPending || accounts.length > 0}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FaUpload />
              Initialize Accounts
            </button>
            <button 
              onClick={handleAddAccount}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <FaPlus />
              Add Account
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            {accountTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg transition ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-6">
        {Object.entries(groupedAccounts).map(([type, typeAccounts]: [string, any]) => (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className={`p-4 ${getTypeColor(type)} font-bold text-lg`}>
              {type} ({typeAccounts.length})
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Normal Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {typeAccounts.map((account: any) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-gray-900">
                          {account.accountCode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {account.accountName}
                        </div>
                        {account.description && (
                          <div className="text-sm text-gray-500">
                            {account.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          account.normalBalance === 'DEBIT'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {account.normalBalance}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          account.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEditAccount(account)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Edit Account"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDeleteAccount(account.id, account.accountName)}
                          disabled={account.isSystemAccount}
                          className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                          title={account.isSystemAccount ? 'System account cannot be deleted' : 'Delete Account'}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredAccounts.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-500 text-lg">No accounts found</p>
        </div>
      )}

      <AccountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAccount(null);
        }}
        onSubmit={handleModalSubmit}
        account={selectedAccount}
        mode={modalMode}
      />
    </motion.div>
  );
};

export default ChartOfAccounts;
