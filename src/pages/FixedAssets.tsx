import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Wrench, Shield } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import { FixedAsset } from '../types';
import { extractErrorMessage } from '../utils/errorHandler';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { PaymentFields } from '../components/shared';
import { SupplierSelector } from '../components/shared';
import { useLanguage } from '../contexts/LanguageContext';
// ✅ Server-Side Pagination
import { useTableData } from '../hooks/useTableData';
import { Pagination } from '../components/common/Pagination';
// ✅ Modal pattern matching Products/Purchases
import Modal from '../components/common/Modal';
import { useModal } from '../hooks/useModal';
// ✅ Only mutations — no useQuery (useTableData handles data fetching)
import { useCreateFixedAsset, useUpdateFixedAsset, useDeleteFixedAsset } from '../hooks/queries/useFixedAssets';
import { notify } from '../utils/notifications';

// Category defaults interface
interface CategoryDefaults {
  category: string;
  defaultUsefulLife: number;
  defaultResidualValuePercent: number;
  depreciationMethod: string;
  maintenanceSchedule: string;
  description: string;
}

const FixedAssets = () => {
  const { t } = useLanguage();
  // ✅ Server-Side Pagination — single source of truth for data
  const { data: assets = [], pagination, goToPage, changeLimit, updateSearch, refresh } = useTableData({ endpoint: 'fixed-assets' });
  // ✅ Only mutations — useTableData handles the GET
  const createAssetMutation = useCreateFixedAsset();
  const updateAssetMutation = useUpdateFixedAsset();
  const deleteAssetMutation = useDeleteFixedAsset();

  // ✅ Modal pattern matching Products/Purchases
  const assetModal = useModal<FixedAsset>();

  const [categories, setCategories] = useState<CategoryDefaults[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // ✅ Confirm Dialog Hook
  const { confirm, dialogProps } = useConfirm();
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    acquisitionCost: '',
    usefulLife: '',
    depreciationMethod: 'STRAIGHT_LINE',
    residualValue: '',
    accumulatedDepreciation: '0',
    status: 'ACTIVE',
    location: '',
    serialNumber: '',
    supplier: '',
    invoiceNumber: '',
    purchaseOrderNumber: '',
    warrantyExpiryDate: '',
    insurancePolicyNumber: '',
    insuranceExpiryDate: '',
    maintenanceSchedule: 'NONE',
    lastMaintenanceDate: '',
    assignedTo: '',
    depreciationStartDate: '', // Added depreciation start date
    tags: '',
    notes: '',
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

  useEffect(() => {
    // ✅ Only fetch categories (assets are fetched by React Query)
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/fixed-assets/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({ ...prev, category }));
    
    const categoryDefaults = categories.find(c => c.category === category);
    if (categoryDefaults && !assetModal.data) {
      // Only auto-fill if creating new asset
      setFormData(prev => ({
        ...prev,
        category,
        usefulLife: categoryDefaults.defaultUsefulLife.toString(),
        depreciationMethod: categoryDefaults.depreciationMethod,
        maintenanceSchedule: categoryDefaults.maintenanceSchedule,
        residualValue: prev.acquisitionCost 
          ? ((parseFloat(prev.acquisitionCost) * categoryDefaults.defaultResidualValuePercent) / 100).toFixed(2)
          : ''
      }));
      toast.success(`Auto-filled defaults for ${category}`);
    }
  };

  // Handle acquisition cost change - recalculate residual value
  const handleAcquisitionCostChange = (cost: string) => {
    setFormData(prev => ({ ...prev, acquisitionCost: cost }));
    
    if (cost && formData.category && !assetModal.data) {
      const categoryDefaults = categories.find(c => c.category === formData.category);
      if (categoryDefaults) {
        const residual = ((parseFloat(cost) * categoryDefaults.defaultResidualValuePercent) / 100).toFixed(2);
        setFormData(prev => ({ ...prev, residualValue: residual }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Manual validation — HTML5 required doesn't work inside overflow containers
    if (!formData.code?.trim()) {
      notify.error('Validation Error', 'Code is required');
      return;
    }
    if (!formData.name?.trim()) {
      notify.error('Validation Error', 'Name is required');
      return;
    }
    if (!formData.category) {
      notify.error('Validation Error', 'Category is required');
      return;
    }
    if (!formData.acquisitionCost || parseFloat(formData.acquisitionCost) <= 0) {
      notify.error('Validation Error', 'Acquisition cost must be greater than 0');
      return;
    }
    if (!formData.acquisitionDate) {
      notify.error('Validation Error', 'Acquisition date is required');
      return;
    }
    if (!formData.usefulLife || parseInt(formData.usefulLife) < 0) {
      notify.error('Validation Error', 'Useful life is required');
      return;
    }

    try {
      const data = {
        ...formData,
        acquisitionCost: parseFloat(formData.acquisitionCost),
        usefulLife: parseInt(formData.usefulLife) || 0,
        residualValue: parseFloat(formData.residualValue) || 0,
        accumulatedDepreciation: parseFloat(formData.accumulatedDepreciation) || 0,
        // ✅ Convert all integer fields — empty string → null to prevent "invalid input syntax for type integer"
        supplierId: formData.supplierId && formData.supplierId !== '' ? parseInt(formData.supplierId) : null,
        bankAccountId: formData.bankAccountId && formData.bankAccountId !== '' ? parseInt(formData.bankAccountId) : null,
        cardId: formData.cardId && formData.cardId !== '' ? parseInt(formData.cardId) : null,
        warrantyExpiryDate: formData.warrantyExpiryDate || null,
        insuranceExpiryDate: formData.insuranceExpiryDate || null,
        lastMaintenanceDate: formData.lastMaintenanceDate || null,
        depreciationStartDate: formData.depreciationStartDate || null,
      };

      if (assetModal.data) {
        updateAssetMutation.mutate({ id: assetModal.data.id, data }, {
          onSuccess: () => {
            notify.success('Fixed Asset Updated', 'Fixed asset updated successfully');
            refresh(); // ✅ Refresh server-side paginated data
            assetModal.close();
          },
          onError: (error: any) => {
            notify.error('Update Failed', extractErrorMessage(error));
          }
        });
      } else {
        createAssetMutation.mutate(data, {
          onSuccess: () => {
            notify.success('Fixed Asset Created', 'Fixed asset created successfully');
            refresh(); // ✅ Refresh server-side paginated data
            assetModal.close();
          },
          onError: (error: any) => {
            notify.error('Creation Failed', extractErrorMessage(error));
          }
        });
      }
    } catch (error: any) {
      console.error('Error saving fixed asset:', error);
      notify.error('Error', extractErrorMessage(error));
    }
  };

  const handleDelete = useCallback(async (id: number) => {
    const confirmed = await confirm({
      title: 'Delete Fixed Asset',
      message: 'Are you sure you want to delete this fixed asset? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;

    deleteAssetMutation.mutate(id, {
      onSuccess: () => {
        notify.success('Fixed Asset Deleted', 'Fixed asset deleted successfully');
        refresh(); // ✅ Refresh server-side paginated data
      },
      onError: (error: any) => {
        notify.error('Deletion Failed', extractErrorMessage(error));
      }
    });
  }, [confirm, deleteAssetMutation, refresh]);

  const handleOpenModal = useCallback((asset?: FixedAsset) => {
    if (asset) {
      setFormData({
        code: asset.code || '',
        name: asset.name || '',
        description: asset.description || '',
        category: asset.category || '',
        acquisitionDate: asset.acquisitionDate?.split('T')[0] || '',
        acquisitionCost: asset.acquisitionCost?.toString() || '',
        usefulLife: asset.usefulLife?.toString() || '',
        depreciationMethod: asset.depreciationMethod || 'STRAIGHT_LINE',
        residualValue: asset.residualValue?.toString() || '',
        accumulatedDepreciation: asset.accumulatedDepreciation?.toString() || '0',
        status: asset.status || 'ACTIVE',
        location: asset.location || '',
        serialNumber: asset.serialNumber || '',
        supplier: (asset as any).supplier || '',
        invoiceNumber: (asset as any).invoiceNumber || '',
        purchaseOrderNumber: (asset as any).purchaseOrderNumber || '',
        warrantyExpiryDate: (asset as any).warrantyExpiryDate?.split('T')[0] || '',
        insurancePolicyNumber: (asset as any).insurancePolicyNumber || '',
        insuranceExpiryDate: (asset as any).insuranceExpiryDate?.split('T')[0] || '',
        maintenanceSchedule: (asset as any).maintenanceSchedule || 'NONE',
        lastMaintenanceDate: (asset as any).lastMaintenanceDate?.split('T')[0] || '',
        assignedTo: (asset as any).assignedTo || '',
        depreciationStartDate: (asset as any).depreciationStartDate?.split('T')[0] || '',
        tags: (asset as any).tags || '',
        notes: (asset as any).notes || '',
        supplierId: (asset as any).supplierId?.toString() || '',
        supplierRnc: (asset as any).supplierRnc || '',
        paymentType: (asset as any).paymentType || 'CREDIT',
        bankAccountId: (asset as any).bankAccountId?.toString() || '',
        cardId: (asset as any).cardId?.toString() || '',
        chequeNumber: (asset as any).chequeNumber || '',
        chequeDate: (asset as any).chequeDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        transferNumber: (asset as any).transferNumber || '',
        transferDate: (asset as any).transferDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        paymentReference: (asset as any).paymentReference || '',
        voucherDate: (asset as any).voucherDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        category: '',
        acquisitionDate: new Date().toISOString().split('T')[0],
        acquisitionCost: '',
        usefulLife: '',
        depreciationMethod: 'STRAIGHT_LINE',
        residualValue: '',
        accumulatedDepreciation: '0',
        status: 'ACTIVE',
        location: '',
        serialNumber: '',
        supplier: '',
        invoiceNumber: '',
        purchaseOrderNumber: '',
        warrantyExpiryDate: '',
        insurancePolicyNumber: '',
        insuranceExpiryDate: '',
        maintenanceSchedule: 'NONE',
        lastMaintenanceDate: '',
        assignedTo: '',
        depreciationStartDate: '',
        tags: '',
        notes: '',
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
    }
    assetModal.open(asset);
  }, [assetModal]);

  // ✅ Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, updateSearch]);

  // Filter by status (client-side for now, can be moved to backend)
  const filteredAssets = filterStatus === 'All' 
    ? assets 
    : assets.filter(asset => asset.status === filterStatus);

  // Calculate totals - ensure numbers are parsed correctly
  const totalAcquisitionCost = assets.reduce((sum, asset) => {
    const cost = typeof asset.acquisitionCost === 'string' 
      ? parseFloat(asset.acquisitionCost) 
      : (asset.acquisitionCost || 0);
    return sum + cost;
  }, 0);
  
  const totalBookValue = assets.reduce((sum, asset) => {
    const bookValue = typeof asset.bookValue === 'string' 
      ? parseFloat(asset.bookValue) 
      : (asset.bookValue || 0);
    return sum + bookValue;
  }, 0);
  
  const totalDepreciation = assets.reduce((sum, asset) => {
    const depreciation = typeof asset.accumulatedDepreciation === 'string' 
      ? parseFloat(asset.accumulatedDepreciation) 
      : (asset.accumulatedDepreciation || 0);
    return sum + depreciation;
  }, 0);

  return (
    <div>
      {/* Header with Summary Cards */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{t('fixedAssets')}</h2>
            <p className="text-gray-600 mt-1">{t('managePropertyPlantEquipment')}</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            {t('newFixedAsset')}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Acquisition Cost</p>
                <p className="text-2xl font-bold text-blue-700">
                  {totalAcquisitionCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Current Book Value</p>
                <p className="text-2xl font-bold text-green-700">
                  {totalBookValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Total Depreciation</p>
                <p className="text-2xl font-bold text-orange-700">
                  {totalDepreciation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by code, name, category, location..."
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
            <option value="INACTIVE">Inactive</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="DISPOSED">Disposed</option>
            <option value="SOLD">Sold</option>
          </select>


        </div>
      </div>

      {/* Assets Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-100 border-b-2 border-gray-400 sticky top-0 z-30 shadow-md">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-900 uppercase tracking-wider bg-gray-100">CODE</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-900 uppercase tracking-wider bg-gray-100">NAME</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-900 uppercase tracking-wider bg-gray-100">CATEGORY</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-900 uppercase tracking-wider bg-gray-100">LOCATION</th>
                  <th className="px-6 py-4 text-center text-xs font-extrabold text-gray-900 uppercase tracking-wider bg-gray-100">ACQUISITION DATE</th>
                  <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-900 uppercase tracking-wider bg-gray-100">ACQUISITION COST</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-900 uppercase tracking-wider bg-gray-100">DEP. METHOD</th>
                  <th className="px-6 py-4 text-center text-xs font-extrabold text-gray-900 uppercase tracking-wider bg-gray-100">USEFUL LIFE</th>
                  <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-900 uppercase tracking-wider bg-gray-100">RESIDUAL VALUE</th>
                  <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-900 uppercase tracking-wider bg-gray-100">
                    <div>DEPRECIATION</div>
                    <div className="text-xs font-normal text-gray-600 normal-case">(Accumulated)</div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-900 uppercase tracking-wider bg-gray-100">
                    <div>BOOK VALUE</div>
                    <div className="text-xs font-normal text-gray-600 normal-case">(Current)</div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-900 uppercase tracking-wider bg-gray-100">ASSIGNED TO</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-900 uppercase tracking-wider bg-gray-100">PAYMENT</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-900 uppercase tracking-wider bg-gray-100">STATUS</th>
                  <th className="px-6 py-4 text-center text-xs font-extrabold text-gray-900 uppercase tracking-wider sticky right-0 bg-gray-100 shadow-md">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
            <AnimatePresence>
              {filteredAssets.map((asset, index) => {
                // Parse values to ensure they're numbers
                const acquisitionCost = typeof asset.acquisitionCost === 'string' 
                  ? parseFloat(asset.acquisitionCost) 
                  : (asset.acquisitionCost || 0);
                const accumulatedDepreciation = typeof asset.accumulatedDepreciation === 'string' 
                  ? parseFloat(asset.accumulatedDepreciation) 
                  : (asset.accumulatedDepreciation || 0);
                const bookValue = typeof asset.bookValue === 'string' 
                  ? parseFloat(asset.bookValue) 
                  : (asset.bookValue || 0);
                
                const depreciationPercent = acquisitionCost > 0 
                  ? ((accumulatedDepreciation / acquisitionCost) * 100).toFixed(1)
                  : '0.0';
                
                return (
                  <motion.tr
                    key={asset.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium">{asset.code}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                      {asset.location && (
                        <div className="text-xs text-gray-500">📍 {asset.location}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">{asset.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {asset.location || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {asset.acquisitionDate ? new Date(asset.acquisitionDate).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {acquisitionCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium whitespace-nowrap">
                        {asset.depreciationMethod?.replace('_', ' ') || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className="text-blue-700 text-sm font-medium">
                        {asset.usefulLife || 0} yrs
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">
                      {(typeof asset.residualValue === 'string' ? parseFloat(asset.residualValue) : (asset.residualValue || 0))
                        .toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="text-orange-600 font-medium">
                        {accumulatedDepreciation.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-500">{depreciationPercent}%</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">
                      {bookValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {(asset as any).assignedTo || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {(asset as any).paymentType ? (
                        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                          (asset as any).paymentType === 'CASH' ? 'bg-green-100 text-green-800' :
                          (asset as any).paymentType === 'BANK_TRANSFER' ? 'bg-blue-100 text-blue-800' :
                          (asset as any).paymentType === 'CHEQUE' ? 'bg-yellow-100 text-yellow-800' :
                          (asset as any).paymentType === 'CREDIT' ? 'bg-orange-100 text-orange-800' :
                          (asset as any).paymentType === 'CREDIT_CARD' ? 'bg-purple-100 text-purple-800' :
                          (asset as any).paymentType === 'DEBIT_CARD' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {(asset as any).paymentType.replace('_', ' ')}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        asset.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        asset.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                        asset.status === 'UNDER_MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
                        asset.status === 'DISPOSED' ? 'bg-red-100 text-red-800' :
                        asset.status === 'SOLD' ? 'bg-blue-100 text-blue-800' :
                        asset.status === 'SCRAPPED' ? 'bg-red-100 text-red-800' :
                        asset.status === 'LOST' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {asset.status === 'UNDER_MAINTENANCE' ? 'MAINTENANCE' : asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center sticky right-0 bg-white">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleOpenModal(asset)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit size={18} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(asset.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredAssets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No fixed assets found</p>
          </div>
        )}

      </motion.div>

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
        isOpen={assetModal.isOpen}
        onClose={assetModal.close}
        title={assetModal.data ? 'Edit Fixed Asset' : 'New Fixed Asset'}
        size="xl"
        maxHeight="90vh"
      >
        <div className="overflow-y-auto px-6 py-4 space-y-6" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="FA-001"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Dell Laptop XPS 15"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Detailed description of the asset"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category * {!assetModal.data && <span className="text-blue-600 text-xs">(Auto-fills defaults)</span>}
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.category} value={cat.category}>
                            {cat.category}
                          </option>
                        ))}
                      </select>
                      {formData.category && categories.find(c => c.category === formData.category) && (
                        <p className="text-xs text-gray-500 mt-1">
                          {categories.find(c => c.category === formData.category)?.description}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                        <option value="DISPOSED">Disposed</option>
                        <option value="SOLD">Sold</option>
                        <option value="SCRAPPED">Scrapped</option>
                        <option value="LOST">Lost/Stolen</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Date *</label>
                      <input
                        type="date"
                        value={formData.acquisitionDate}
                        onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">Financial Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Cost *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.acquisitionCost}
                        onChange={(e) => handleAcquisitionCostChange(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="100000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Useful Life (years) *</label>
                      <input
                        type="number"
                        value={formData.usefulLife}
                        onChange={(e) => setFormData({ ...formData, usefulLife: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Residual Value</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.residualValue}
                        onChange={(e) => setFormData({ ...formData, residualValue: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="10000"
                      />
                      <p className="text-xs text-gray-500 mt-1">Salvage value at end of life</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Accumulated Depreciation</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.accumulatedDepreciation}
                        onChange={(e) => setFormData({ ...formData, accumulatedDepreciation: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Total depreciation to date</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Depreciation Method *</label>
                      <select
                        value={formData.depreciationMethod}
                        onChange={(e) => setFormData({ ...formData, depreciationMethod: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="STRAIGHT_LINE">Straight-Line (Equal each year)</option>
                        <option value="DECLINING_BALANCE">Declining Balance (Higher early years)</option>
                        <option value="DOUBLE_DECLINING">Double Declining Balance (Accelerated)</option>
                        <option value="UNITS_OF_PRODUCTION">Units of Production (Usage-based)</option>
                        <option value="SUM_OF_YEARS_DIGITS">Sum of Years Digits (Accelerated)</option>
                        <option value="NONE">No Depreciation (Land)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Depreciation Start Date
                        <span className="text-xs text-gray-500 ml-2">(When asset is ready for use)</span>
                      </label>
                      <input
                        type="date"
                        value={formData.depreciationStartDate}
                        onChange={(e) => setFormData({ ...formData, depreciationStartDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty to use acquisition date. Set different date if asset needs installation/setup.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Purchase Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">Purchase Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      {/* ✅ SupplierSelector — linked to Suppliers table for AP tracking */}
                      <SupplierSelector
                        value={formData.supplierId}
                        onChange={(value, supplier) => setFormData({
                          ...formData,
                          supplierId: value,
                          supplierRnc: supplier?.rnc || '',
                          supplier: supplier?.name || '',
                        })}
                        label="Supplier"
                        showRnc={true}
                        filterActive={false}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                      <input
                        type="text"
                        value={formData.invoiceNumber}
                        onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="INV-2024-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order Number</label>
                      <input
                        type="text"
                        value={formData.purchaseOrderNumber}
                        onChange={(e) => setFormData({ ...formData, purchaseOrderNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="PO-2024-050"
                      />
                    </div>
                  </div>
                </div>

                {/* Location & Assignment */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">Location & Assignment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Office Floor 2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                      <input
                        type="text"
                        value={formData.serialNumber}
                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="SN123456789"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                      <input
                        type="text"
                        value={formData.assignedTo}
                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="IT Department / John Doe"
                      />
                    </div>
                  </div>
                </div>

                {/* Warranty & Insurance */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2 flex items-center gap-2">
                    <Shield size={18} />
                    Warranty & Insurance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry Date</label>
                      <input
                        type="date"
                        value={formData.warrantyExpiryDate}
                        onChange={(e) => setFormData({ ...formData, warrantyExpiryDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Policy Number</label>
                      <input
                        type="text"
                        value={formData.insurancePolicyNumber}
                        onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="POL-2024-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expiry Date</label>
                      <input
                        type="date"
                        value={formData.insuranceExpiryDate}
                        onChange={(e) => setFormData({ ...formData, insuranceExpiryDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Maintenance */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2 flex items-center gap-2">
                    <Wrench size={18} />
                    Maintenance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Schedule</label>
                      <select
                        value={formData.maintenanceSchedule}
                        onChange={(e) => setFormData({ ...formData, maintenanceSchedule: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="NONE">No Maintenance Required</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly (Every 3 months)</option>
                        <option value="SEMI_ANNUALLY">Semi-Annually (Every 6 months)</option>
                        <option value="ANNUALLY">Annually (Once a year)</option>
                        <option value="BIANNUALLY">Bi-Annually (Every 2 years)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Maintenance Date</label>
                      <input
                        type="date"
                        value={formData.lastMaintenanceDate}
                        onChange={(e) => setFormData({ ...formData, lastMaintenanceDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">Additional Information</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="critical, insured, high-value (comma-separated)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Additional notes and comments..."
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Information - Reusable Component */}
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

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={assetModal.close}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createAssetMutation.isPending || updateAssetMutation.isPending}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {(createAssetMutation.isPending || updateAssetMutation.isPending)
                      ? 'Saving...'
                      : assetModal.data ? 'Update Asset' : 'Create Asset'}
                  </button>
                </div>
              </form>
        </div>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default FixedAssets;
