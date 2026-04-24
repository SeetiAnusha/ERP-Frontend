import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber } from '../utils/formatNumber';
import { extractErrorMessage } from '../utils/errorHandler';
import axios from 'axios';

// Reusable Components
import SearchBar from '../components/common/SearchBar';
import { Pagination } from '../components/common/Pagination';

interface InventoryItem {
  id: number;
  code: string;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  unitCost: number;
  amount: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  from: number;
  to: number;
}

const InventoryAssistant = () => {
  const { t } = useLanguage();
  
  // Date selector - defaults to today
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // State management
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
    from: 0,
    to: 0
  });
  
  // Calculate total inventory value
  const totalInventoryValue = inventory.reduce((sum, item) => {
    return sum + (Number(item.amount) || 0);
  }, 0);
  
  // Fetch inventory data
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/inventory/as-of-date`, {
        params: {
          asOfDate: selectedDate,
          page,
          limit,
          search
        }
      });
      
      if (response.data.success) {
        setInventory(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      toast.error(extractErrorMessage(error));
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh data when date, page, limit, or search changes
  useEffect(() => {
    fetchInventory();
  }, [selectedDate, page, limit, search]);

  return (
    <div>
      {/* Header with Search and Date Selector */}
      <div className="flex justify-between items-center mb-6 gap-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t('search') + '...'}
        />
        
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
          <Calendar size={20} className="text-blue-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setPage(1); // Reset to first page when date changes
            }}
            className="border-none focus:outline-none focus:ring-0 text-sm font-medium"
          />
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-max table-auto">
              <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-20">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">PRODUCT CODE</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">PRODUCT NAME</th>
                  <th className="px-4 py-4 text-center text-sm font-bold text-gray-800 whitespace-nowrap">UNIT OF MEASURE</th>
                  <th className="px-4 py-4 text-right text-sm font-bold text-gray-800 whitespace-nowrap">QUANTITY</th>
                  <th className="px-4 py-4 text-right text-sm font-bold text-gray-800 whitespace-nowrap">UNIT COST</th>
                  <th className="px-4 py-4 text-right text-sm font-bold text-gray-800 whitespace-nowrap bg-blue-50">AMOUNT</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">DESCRIPTION</th>
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No inventory found for {selectedDate}
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{item.code}</td>
                      <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.unit}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatNumber(item.quantity)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatNumber(item.unitCost)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600 bg-blue-50">
                        {formatNumber(item.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.description || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {/* Total Row */}
              {inventory.length > 0 && (
                <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-right text-sm font-bold text-gray-800">
                      TOTAL INVENTORY VALUE:
                    </td>
                    <td className="px-4 py-4 text-right text-lg font-bold text-blue-700 bg-blue-100">
                      {formatNumber(totalInventoryValue)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </motion.div>
      )}

      {/* Pagination Component */}
      <div className="mt-6">
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          from={pagination.from}
          to={pagination.to}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
};

export default InventoryAssistant;
