import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaChartLine, FaSearch } from 'react-icons/fa';
// import { toast } from 'sonner';
// import axios from '../api/axios';
import { Investment } from '../types';
import { extractErrorMessage } from '../utils/errorHandler';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { PaymentFields, SupplierSelector } from '../components/shared';
import { useLanguage } from '../contexts/LanguageContext';
// ✅ Server-Side Pagination
import { useTableData } from '../hooks/useTableData';
import { Pagination } from '../components/common/Pagination';
// ✅ Modal pattern matching Products/Purchases
import Modal from '../components/common/Modal';
import { useModal } from '../hooks/useModal';
// ✅ Only mutations — no useQuery (useTableData handles data fetching)
import { useCreateInvestment, useUpdateInvestment, useDeleteInvestment } from '../hooks/queries/useInvestments';
import { notify } from '../utils/notifications';

const Investments = () => {
  const { t } = useLanguage();
  // ✅ Server-Side Pagination — single source of truth for data
  const { data: investments = [], pagination, goToPage, changeLimit, updateSearch, refresh } = useTableData({ endpoint: 'investments' });
  // ✅ Only mutations — useTableData handles the GET
  const createInvestmentMutation = useCreateInvestment();
  const updateInvestmentMutation = useUpdateInvestment();
  const deleteInvestmentMutation = useDeleteInvestment();

  // ✅ Modal pattern matching Products/Purchases
  const investmentModal = useModal<Investment>();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // ✅ Confirm Dialog Hook
  const { confirm, dialogProps } = useConfirm();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'Stocks',
    description: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    acquisitionCost: '',
    currentValue: '',
    quantity: '',
    unitCost: '',
    status: 'ACTIVE',
    maturityDate: '',
    interestRate: '',
    riskLevel: 'MEDIUM',
    broker: '',
    // Supplier fields — linked to Suppliers table for AP tracking
    supplierId: '',
    supplierRnc: '',
    // Payment fields
    paymentType: 'CREDIT',
    bankAccountId: '',
    cardId: '',
    chequeNumber: '',
    chequeDate: new Date().toISOString().split('T')[0],
    transferNumber: '',
    transferDate: new Date().toISOString().split('T')[0],
    paymentReference: '',
    voucherDate: new Date().toISOString().split('T')[0],
  });

  // ✅ Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, updateSearch]);

  // Filter by status (client-side for now, can be moved to backend)
  const filteredInvestments = filterStatus === 'All'
    ? investments
    : investments.filter(investment => investment.status === filterStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Manual validation — HTML5 required doesn't work inside overflow containers
    if (!formData.code?.trim()) { notify.error('Validation Error', 'Code is required'); return; }
    if (!formData.name?.trim()) { notify.error('Validation Error', 'Name is required'); return; }
    if (!formData.type) { notify.error('Validation Error', 'Type is required'); return; }
    if (!formData.acquisitionDate) { notify.error('Validation Error', 'Acquisition date is required'); return; }
    if (!formData.acquisitionCost || parseFloat(formData.acquisitionCost) <= 0) { notify.error('Validation Error', 'Acquisition cost must be greater than 0'); return; }
    if (!formData.currentValue || parseFloat(formData.currentValue) <= 0) { notify.error('Validation Error', 'Current value must be greater than 0'); return; }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) { notify.error('Validation Error', 'Quantity must be greater than 0'); return; }
    if (!formData.unitCost || parseFloat(formData.unitCost) <= 0) { notify.error('Validation Error', 'Unit cost must be greater than 0'); return; }
    if (!formData.description?.trim()) { notify.error('Validation Error', 'Description is required'); return; }

    try {
      // ✅ ROBUST: Clean data preparation with proper null handling
      const data = {
        ...formData,
        acquisitionCost: parseFloat(formData.acquisitionCost),
        currentValue: parseFloat(formData.currentValue),
        quantity: parseFloat(formData.quantity),
        unitCost: parseFloat(formData.unitCost),
        // ✅ Only send interestRate if it has a value
        interestRate: formData.interestRate && formData.interestRate.trim() !== ''
          ? parseFloat(formData.interestRate)
          : undefined,
        // ✅ Only send maturityDate if it has a value, otherwise send undefined
        maturityDate: formData.maturityDate && formData.maturityDate.trim() !== ''
          ? formData.maturityDate
          : undefined,
        // ✅ Convert ID fields — empty string → undefined to prevent type errors
        supplierId: formData.supplierId || undefined,
        bankAccountId: formData.bankAccountId || undefined,
        cardId: formData.cardId || undefined,
      };

      // ✅ Use React Query mutations instead of manual API calls
      if (investmentModal.data) {
        updateInvestmentMutation.mutate({ id: investmentModal.data.id, data }, {
          onSuccess: () => {
            notify.success('Investment Updated', 'Investment updated successfully');
            refresh(); // ✅ Refresh server-side paginated data
            investmentModal.close();
          },
          onError: (error: any) => {
            notify.error('Update Failed', extractErrorMessage(error));
          }
        });
      } else {
        createInvestmentMutation.mutate(data, {
          onSuccess: () => {
            notify.success('Investment Created', 'Investment created successfully');
            refresh(); // ✅ Refresh server-side paginated data
            investmentModal.close();
          },
          onError: (error: any) => {
            notify.error('Creation Failed', extractErrorMessage(error));
          }
        });
      }
    } catch (error: any) {
      console.error('Error saving investment:', error);
      notify.error('Error', extractErrorMessage(error));
    }
  };

  const handleDelete = useCallback(async (id: number) => {
    const confirmed = await confirm({
      title: 'Delete Investment',
      message: 'Are you sure you want to delete this investment?',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;

    deleteInvestmentMutation.mutate(id, {
      onSuccess: () => {
        notify.success('Investment Deleted', 'Investment deleted successfully');
        refresh(); // ✅ Refresh server-side paginated data
      },
      onError: (error: any) => {
        notify.error('Deletion Failed', extractErrorMessage(error));
      }
    });
  }, [confirm, deleteInvestmentMutation, refresh]);

  const handleEdit = useCallback((investment: Investment) => {
    setFormData({
      code: investment.code,
      name: investment.name,
      type: investment.type,
      description: investment.description,
      acquisitionDate: investment.acquisitionDate.split('T')[0],
      acquisitionCost: investment.acquisitionCost.toString(),
      currentValue: investment.currentValue.toString(),
      quantity: investment.quantity.toString(),
      unitCost: investment.unitCost.toString(),
      status: investment.status,
      maturityDate: investment.maturityDate ? investment.maturityDate.toString().split('T')[0] : '',
      interestRate: investment.interestRate ? investment.interestRate.toString() : '',
      riskLevel: (investment as any).riskLevel || 'MEDIUM',
      broker: (investment as any).broker || '',
      supplierId: (investment as any).supplierId?.toString() || '',
      supplierRnc: (investment as any).supplierRnc || '',
      paymentType: (investment as any).paymentType || 'CREDIT',
      bankAccountId: (investment as any).bankAccountId?.toString() || '',
      cardId: (investment as any).cardId?.toString() || '',
      chequeNumber: (investment as any).chequeNumber || '',
      chequeDate: (investment as any).chequeDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      transferNumber: (investment as any).transferNumber || '',
      transferDate: (investment as any).transferDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      paymentReference: (investment as any).paymentReference || '',
      voucherDate: (investment as any).voucherDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    });
    investmentModal.open(investment);
  }, [investmentModal]);

  const resetForm = useCallback(() => {
    setFormData({
      code: '',
      name: '',
      type: 'Stocks',
      description: '',
      acquisitionDate: new Date().toISOString().split('T')[0],
      acquisitionCost: '',
      currentValue: '',
      quantity: '',
      unitCost: '',
      status: 'ACTIVE',
      maturityDate: '',
      interestRate: '',
      riskLevel: 'MEDIUM',
      broker: '',
      supplierId: '',
      supplierRnc: '',
      paymentType: 'CREDIT',
      bankAccountId: '',
      cardId: '',
      chequeNumber: '',
      chequeDate: new Date().toISOString().split('T')[0],
      transferNumber: '',
      transferDate: new Date().toISOString().split('T')[0],
      paymentReference: '',
      voucherDate: new Date().toISOString().split('T')[0],
    });
    investmentModal.close();
  }, [investmentModal]);

  // Use calculated values from backend
  const totalAcquisitionCost = investments.reduce((sum, inv) => sum + parseFloat(inv.acquisitionCost.toString()), 0);
  const totalCurrentValue = investments.reduce((sum, inv) => {
    // Use calculatedCurrentValue if available (auto-calculated), otherwise use manual currentValue
    const value = inv.calculatedCurrentValue !== undefined ? inv.calculatedCurrentValue : inv.currentValue;
    return sum + parseFloat(value.toString());
  }, 0);
  const totalGainLoss = totalCurrentValue - totalAcquisitionCost;

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
            <h2 className="text-3xl font-bold text-gray-800">{t('investments')}</h2>
            <p className="text-gray-600 mt-1">{t('investmentsDesc')}</p>
          </div>
          <button
            onClick={() => { resetForm(); investmentModal.open(); }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <FaPlus /> {t('newInvestment')}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">{t('totalAcquisitionCost')}</p>
                <p className="text-2xl font-bold text-blue-700">
                  {totalAcquisitionCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <FaChartLine className="text-blue-400 text-3xl" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">{t('currentValue')}</p>
                <p className="text-2xl font-bold text-green-700">
                  {totalCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <FaChartLine className="text-green-400 text-3xl" />
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${totalGainLoss >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Gain/Loss
                </p>
                <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {totalGainLoss >= 0 ? '+' : ''}{Math.abs(totalGainLoss).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <FaChartLine className={`text-3xl ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('placeholders_searchInvestments')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="MATURED">Matured</option>
            <option value="SOLD">Sold</option>
          </select>


        </div>
      </div>

      {/* Investments Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">CODE</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">NAME</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">TYPE</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">RISK</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">QUANTITY</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-800 uppercase tracking-wider">UNIT COST</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-800 uppercase tracking-wider">ACQUISITION COST</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-800 uppercase tracking-wider">CURRENT VALUE</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-800 uppercase tracking-wider">GAIN/LOSS</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">INTEREST RATE</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-800 uppercase tracking-wider">MATURITY DATE</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">BROKER</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">PAYMENT</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">STATUS</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-800 uppercase tracking-wider sticky right-0 bg-gray-50">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvestments.map((investment) => {
                  // Use calculated values if available
                  const currentVal = investment.calculatedCurrentValue !== undefined
                    ? investment.calculatedCurrentValue
                    : investment.currentValue;
                  const gainLoss = investment.gainLoss !== undefined
                    ? investment.gainLoss
                    : parseFloat(currentVal.toString()) - parseFloat(investment.acquisitionCost.toString());

                  // Get risk level from investment or default to MEDIUM
                  const riskLevel = (investment as any).riskLevel || 'MEDIUM';

                  return (
                    <tr key={investment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{investment.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{investment.name}</div>
                        {investment.shouldAutoCalculate && (
                          <span className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                            🤖 Auto-calculated
                          </span>
                        )}
                        {(investment as any).broker && (
                          <span className="text-xs text-gray-500 mt-1 block">
                            📊 {(investment as any).broker}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          {investment.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${riskLevel === 'LOW' ? 'bg-green-100 text-green-800' :
                          riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                          {riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 font-medium">{investment.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                        {parseFloat(investment.unitCost.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {parseFloat(investment.acquisitionCost.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                        {parseFloat(currentVal.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        {investment.daysHeld !== undefined && (
                          <div className="text-xs text-gray-500 font-normal">
                            {investment.daysHeld} days held
                          </div>
                        )}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {gainLoss >= 0 ? '+' : ''}{gainLoss.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        {investment.gainLossPercentage !== undefined && (
                          <div className="text-xs font-normal">
                            ({investment.gainLossPercentage >= 0 ? '+' : ''}{investment.gainLossPercentage.toFixed(2)}%)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                        {investment.interestRate
                          ? <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">{parseFloat(investment.interestRate.toString()).toFixed(2)}%</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                        {investment.maturityDate
                          ? <div>
                            <div>{new Date(investment.maturityDate).toLocaleDateString('en-IN')}</div>
                            {investment.daysToMaturity !== undefined && investment.daysToMaturity !== null && investment.daysToMaturity > 0 && (
                              <div className="text-xs text-orange-500">{investment.daysToMaturity}d left</div>
                            )}
                          </div>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {(investment as any).broker || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {(investment as any).paymentType ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${(investment as any).paymentType === 'CASH' ? 'bg-green-100 text-green-800' :
                            (investment as any).paymentType === 'BANK_TRANSFER' ? 'bg-blue-100 text-blue-800' :
                              (investment as any).paymentType === 'CHEQUE' ? 'bg-yellow-100 text-yellow-800' :
                                (investment as any).paymentType === 'CREDIT' ? 'bg-orange-100 text-orange-800' :
                                  (investment as any).paymentType === 'CREDIT_CARD' ? 'bg-purple-100 text-purple-800' :
                                    (investment as any).paymentType === 'DEBIT_CARD' ? 'bg-indigo-100 text-indigo-800' :
                                      'bg-gray-100 text-gray-700'
                            }`}>
                            {(investment as any).paymentType.replace('_', ' ')}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${investment.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          investment.status === 'MATURED' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                          {investment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium sticky right-0 bg-white">
                        <button
                          onClick={() => handleEdit(investment)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(investment.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredInvestments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No investments found</p>
          </div>
        )}

      </div>

      {/* ✅ Pagination — outside table card, matching Products/Suppliers pattern */}
      <div className="mt-6">
        {pagination && pagination.total > 0 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            from={pagination.from}
            to={pagination.to}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
            onPageChange={goToPage}
            onLimitChange={changeLimit}
          />
        )}
      </div>

      {/* ✅ Modal — using shared Modal component matching Products/Purchases pattern */}
      <Modal
        isOpen={investmentModal.isOpen}
        onClose={resetForm}
        title={investmentModal.data ? 'Edit Investment' : 'New Investment'}
        size="lg"
        maxHeight="90vh"
      >
        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Stocks">Stocks</option>
                  <option value="Bonds">Bonds</option>
                  <option value="Mutual Funds">Mutual Funds</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Cryptocurrency">Cryptocurrency</option>
                  <option value="Fixed Deposit">Fixed Deposit</option>
                  <option value="Gold">Gold</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Level *
                  <span className="text-xs text-gray-500 ml-2">(Investment risk assessment)</span>
                </label>
                <select
                  value={formData.riskLevel}
                  onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="LOW">🟢 Low Risk (Safe, stable returns)</option>
                  <option value="MEDIUM">🟡 Medium Risk (Balanced)</option>
                  <option value="HIGH">🔴 High Risk (Volatile, high returns)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Date *</label>
                <input
                  type="date"
                  value={formData.acquisitionDate}
                  onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Cost *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.acquisitionCost}
                  onChange={(e) => setFormData({ ...formData, acquisitionCost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Value *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.currentValue}
                  onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maturity Date</label>
                <input
                  type="date"
                  value={formData.maturityDate}
                  onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                  min={formData.acquisitionDate || undefined}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional. Must be after acquisition date.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="MATURED">Matured</option>
                  <option value="SOLD">Sold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Broker/Platform
                  <span className="text-xs text-gray-500 ml-2">(Where is it held?)</span>
                </label>
                <input
                  type="text"
                  value={formData.broker}
                  onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Zerodha, Groww, HDFC, etc."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* ✅ Supplier Selection — linked to Suppliers table for AP tracking */}
            <div>
              <SupplierSelector
                value={formData.supplierId}
                onChange={(value, supplier) => setFormData({
                  ...formData,
                  supplierId: value,
                  supplierRnc: supplier?.rnc || '',
                })}
                label="Supplier (for Credit/AP tracking)"
                showRnc={true}
                filterActive={false}
              />
              <p className="text-xs text-gray-500 mt-1">
                Required when payment type is Credit or Credit Card — links to Accounts Payable
              </p>
            </div>

            {/* Payment Fields - Reusable Component */}
            <PaymentFields
              paymentType={formData.paymentType}
              onPaymentTypeChange={(value) => setFormData({ ...formData, paymentType: value })}
              bankAccountId={formData.bankAccountId}
              onBankAccountChange={(value) => setFormData({ ...formData, bankAccountId: value })}
              cardId={formData.cardId}
              onCardChange={(value) => setFormData({ ...formData, cardId: value })}
              chequeNumber={formData.chequeNumber}
              onChequeNumberChange={(value) => setFormData({ ...formData, chequeNumber: value })}
              chequeDate={formData.chequeDate}
              onChequeDateChange={(value) => setFormData({ ...formData, chequeDate: value })}
              transferNumber={formData.transferNumber}
              onTransferNumberChange={(value) => setFormData({ ...formData, transferNumber: value })}
              transferDate={formData.transferDate}
              onTransferDateChange={(value) => setFormData({ ...formData, transferDate: value })}
              paymentReference={formData.paymentReference}
              onPaymentReferenceChange={(value) => setFormData({ ...formData, paymentReference: value })}
              voucherDate={formData.voucherDate}
              onVoucherDateChange={(value) => setFormData({ ...formData, voucherDate: value })}
              showCreditOption={true}
              showCashOption={false}
            />

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createInvestmentMutation.isPending || updateInvestmentMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {(createInvestmentMutation.isPending || updateInvestmentMutation.isPending)
                  ? 'Saving...'
                  : investmentModal.data ? 'Update Investment' : 'Create Investment'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog {...dialogProps} />
    </motion.div>
  );
};

export default Investments;

