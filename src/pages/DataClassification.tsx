/**
 * Data Classification Dashboard
 * Simple, professional dashboard using existing ERP UI patterns
 */

import React, { useState, useEffect } from 'react';
import api from '../api/axios'; // ✅ FIX: Use axios instead of fetch
import { toast } from 'sonner'; // ✅ FIX: Add toast notifications

interface ClassificationSummary {
  classification: string;
  count: number;
}

interface DashboardData {
  classificationSummary: ClassificationSummary[];
  entitySummary: any[];
  retentionSummary: any[];
  expiringData: number;
  recentClassifications: any[];
  systemStatus: {
    enabled: boolean;
    totalClassified: number;
  };
}

interface ExpiringData {
  total: number;
  urgent: number;
  warning: number;
  urgentItems: any[];
  warningItems: any[];
}

const DataClassification: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [expiringData, setExpiringData] = useState<ExpiringData | null>(null);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState({
    entityType: '',
    classification: '',
    search: ''
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/data-classification/dashboard'); // ✅ FIX: Use axios
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data', {
        description: error.response?.data?.message || error.message
      });
    }
  };

  // Fetch expiring data
  const fetchExpiringData = async () => {
    try {
      const response = await api.get('/data-classification/expiring', {
        params: { withinDays: 90 }
      }); // ✅ FIX: Use axios
      
      if (response.data.success) {
        setExpiringData(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch expiring data:', error);
      toast.error('Failed to load expiring data', {
        description: error.response?.data?.message || error.message
      });
    }
  };

  // Fetch classifications
  const fetchClassifications = async () => {
    try {
      const response = await api.get('/data-classification/classifications', {
        params: {
          page: 1,
          limit: 50,
          ...filters
        }
      }); // ✅ FIX: Use axios
      
      if (response.data.success) {
        setClassifications(response.data.data.classifications);
      }
    } catch (error: any) {
      console.error('Failed to fetch classifications:', error);
      toast.error('Failed to load classifications', {
        description: error.response?.data?.message || error.message
      });
    }
  };

  // Toggle system status
  const toggleSystem = async (enable: boolean) => {
    try {
      const endpoint = enable ? 'enable' : 'disable';
      await api.post(`/data-classification/${endpoint}`); // ✅ FIX: Use axios
      
      toast.success(`Data classification system ${enable ? 'enabled' : 'disabled'} successfully`);
      fetchDashboardData();
    } catch (error: any) {
      console.error('Failed to toggle system:', error);
      toast.error(`Failed to ${enable ? 'enable' : 'disable'} system`, {
        description: error.response?.data?.message || error.message
      });
    }
  };

  // Download compliance report
  const downloadReport = async () => {
    try {
      const response = await api.get('/data-classification/compliance-report', {
        params: { format: 'csv' },
        responseType: 'blob' // ✅ FIX: Handle blob response
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Compliance report downloaded successfully');
    } catch (error: any) {
      console.error('Failed to download report:', error);
      toast.error('Failed to download report', {
        description: error.response?.data?.message || error.message
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchExpiringData(),
        fetchClassifications()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  // Get classification badge color
  const getClassificationColor = (classification: string) => {
    const colors = {
      public: 'bg-green-100 text-green-800',
      internal: 'bg-blue-100 text-blue-800',
      confidential: 'bg-yellow-100 text-yellow-800',
      restricted: 'bg-red-100 text-red-800'
    };
    return colors[classification as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Classification & Compliance</h1>
          <p className="text-gray-600">Monitor data classification status and compliance requirements</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={downloadReport}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export Report</span>
          </button>
          
          {dashboardData && (
            <button
              onClick={() => toggleSystem(!dashboardData.systemStatus.enabled)}
              className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                dashboardData.systemStatus.enabled 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {dashboardData.systemStatus.enabled ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Disable System</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Enable System</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* System Status Alert */}
      {dashboardData && !dashboardData.systemStatus.enabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Data classification system is currently disabled. New data will not be automatically classified.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['dashboard', 'classifications', 'compliance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Classified</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData?.systemStatus.totalClassified || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Expiring Soon</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {expiringData?.urgent || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Warning Period</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {expiringData?.warning || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className={`h-6 w-6 ${dashboardData?.systemStatus.enabled ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">System Status</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData?.systemStatus.enabled ? 'Active' : 'Disabled'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Classification Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Classification Distribution</h3>
                <div className="space-y-3">
                  {dashboardData?.classificationSummary.map((item) => (
                    <div key={item.classification} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getClassificationColor(item.classification)}`}>
                          {item.classification.toUpperCase()}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Classifications</h3>
                <div className="space-y-3">
                  {dashboardData?.recentClassifications.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium text-gray-900">{item.entityType}</span>
                        <span className="text-gray-500 ml-2">#{item.entityId}</span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getClassificationColor(item.classification)}`}>
                        {item.classification}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Classifications Tab */}
      {activeTab === 'classifications' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex space-x-4">
              <select
                value={filters.entityType}
                onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value }))}
                className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Entity Types</option>
                <option value="User">User</option>
                <option value="Client">Client</option>
                <option value="AccountsPayable">Accounts Payable</option>
                <option value="AccountsReceivable">Accounts Receivable</option>
                <option value="BankAccount">Bank Account</option>
              </select>

              <select
                value={filters.classification}
                onChange={(e) => setFilters(prev => ({ ...prev, classification: e.target.value }))}
                className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Classifications</option>
                <option value="public">Public</option>
                <option value="internal">Internal</option>
                <option value="confidential">Confidential</option>
                <option value="restricted">Restricted</option>
              </select>

              <input
                type="text"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Classifications Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classification</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retention</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classified</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classifications.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.entityType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.entityId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getClassificationColor(item.classification)}`}>
                        {item.classification}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.retentionDays === -1 ? 'Permanent' : `${item.retentionDays} days`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.classifiedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && expiringData && (
        <div className="space-y-4">
          {/* Urgent Items */}
          {expiringData.urgent > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-red-600 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Urgent: Expiring Within 30 Days ({expiringData.urgent})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classification</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expiringData.urgentItems.slice(0, 10).map((item) => {
                        const daysLeft = Math.ceil((new Date(item.expiresAt).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
                        return (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.entityType} #{item.entityId}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getClassificationColor(item.classification)}`}>
                                {item.classification}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.expiresAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">{daysLeft} days</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Warning Items */}
          {expiringData.warning > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-yellow-600 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Warning: Expiring Within 90 Days ({expiringData.warning})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classification</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expiringData.warningItems.slice(0, 10).map((item) => {
                        const daysLeft = Math.ceil((new Date(item.expiresAt).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
                        return (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.entityType} #{item.entityId}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getClassificationColor(item.classification)}`}>
                                {item.classification}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.expiresAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-yellow-600">{daysLeft} days</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataClassification;