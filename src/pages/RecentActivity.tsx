import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, Users, Building2, RefreshCw, Filter } from 'lucide-react';
import api from '../api/axios';
import { formatNumber } from '../utils/formatNumber';

interface Activity {
  id: number;
  date: string;
  type: 'CONTRIBUTION' | 'LOAN';
  amount: number;
  registrationNumber: string;
  financerId: number | null;
  financerName: string;
  financerCode: string;
  financerType: string;
  financerContact: string | null;
  financerPhone: string | null;
  storeId: number | null;
  storeName: string;
  storeLocation: string;
  storeCode: string;
  storeBalanceAfter: number;
  apId: number | null;
  apRegistrationNumber: string | null;
  apAmount: number;
  apBalanceAmount: number;
  apStatus: string;
  apNotes: string | null;
}

interface ActivityStatistics {
  totalActivities: number;
  contributionCount: number;
  loanCount: number;
  totalAmount: number;
  contributionAmount: number;
  loanAmount: number;
  recentActivities: {
    count: number;
    amount: number;
  };
  monthlyActivities: {
    count: number;
    amount: number;
  };
}

const RecentActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [statistics, setStatistics] = useState<ActivityStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'CONTRIBUTION' | 'LOAN'>('ALL');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchActivities();
    fetchStatistics();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/recent-activity?limit=100');
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/recent-activity/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchActivitiesByDateRange = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      fetchActivities();
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/recent-activity/date-range?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities by date range:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchActivitiesByDateRange();
    } else {
      fetchActivities();
    }
    fetchStatistics();
  };

  const filteredActivities = activities.filter(activity => {
    if (filterType === 'ALL') return true;
    return activity.type === filterType;
  });

  if (loading) {
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Calendar className="text-purple-600" />
              Recent Activity
            </h1>
            <p className="text-gray-600 mt-1">Track all investment and loan transactions</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Total Activities</p>
                <p className="text-2xl font-bold text-purple-700">{statistics.totalActivities}</p>
              </div>
              <Calendar className="text-purple-400 text-3xl" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Contributions</p>
                <p className="text-2xl font-bold text-green-700">{statistics.contributionCount}</p>
                <p className="text-xs text-green-500">{formatNumber(statistics.contributionAmount)}</p>
              </div>
              <Users className="text-green-400 text-3xl" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Loans</p>
                <p className="text-2xl font-bold text-blue-700">{statistics.loanCount}</p>
                <p className="text-xs text-blue-500">{formatNumber(statistics.loanAmount)}</p>
              </div>
              <Building2 className="text-blue-400 text-3xl" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Total Amount</p>
                <p className="text-2xl font-bold text-orange-700">{formatNumber(statistics.totalAmount)}</p>
              </div>
              <DollarSign className="text-orange-400 text-3xl" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'ALL' | 'CONTRIBUTION' | 'LOAN')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Activities</option>
            <option value="CONTRIBUTION">Contributions Only</option>
            <option value="LOAN">Loans Only</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={fetchActivitiesByDateRange}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Apply
            </button>
            <button
              onClick={() => {
                setDateRange({ startDate: '', endDate: '' });
                fetchActivities();
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Registration #</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Financer</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Store</th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-800 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-800 uppercase tracking-wider">Store Balance</th>
                <th className="px-6 py-3 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(activity.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.type === 'CONTRIBUTION' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {activity.type === 'CONTRIBUTION' ? '💼 Investment' : '🏛️ Loan'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {activity.registrationNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{activity.financerName}</div>
                      <div className="text-gray-500 text-xs">{activity.financerCode} • {activity.financerType}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{activity.storeName}</div>
                      <div className="text-gray-500 text-xs">{activity.storeLocation}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                    <span className={activity.type === 'CONTRIBUTION' ? 'text-green-600' : 'text-blue-600'}>
                      {formatNumber(activity.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    <span className={activity.storeBalanceAfter >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatNumber(activity.storeBalanceAfter)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.apStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      activity.apStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.apStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredActivities.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Found</h3>
          <p className="text-gray-500">
            {filterType === 'ALL' 
              ? 'No investment or loan transactions have been recorded yet.'
              : `No ${filterType.toLowerCase()} transactions found for the selected criteria.`
            }
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default RecentActivity;