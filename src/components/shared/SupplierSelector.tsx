import React, { useMemo } from 'react';
import { Building } from 'lucide-react';
import { useSuppliers } from '../../hooks/queries/useSharedData';

interface SupplierSelectorProps {
  value: string | number;
  onChange: (value: string, supplier?: any) => void;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  showRnc?: boolean;
  filterActive?: boolean;
  className?: string;
  error?: string;
  onSupplierSelect?: (supplier: any) => void;
}

const SupplierSelector: React.FC<SupplierSelectorProps> = ({
  value,
  onChange,
  required = false,
  disabled = false,
  label = 'Supplier',
  showRnc = false,
  filterActive = true,
  className = '',
  error,
  onSupplierSelect
}) => {
  const { data: allSuppliers = [], isLoading } = useSuppliers();

  const suppliers = useMemo(() => {
    if (!filterActive) return allSuppliers;
    return allSuppliers.filter((supplier: any) => supplier.status === 'ACTIVE');
  }, [allSuppliers, filterActive]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const supplierId = e.target.value;
    const supplier = suppliers.find((s: any) => s.id === parseInt(supplierId));
    
    onChange(supplierId, supplier);
    
    if (onSupplierSelect && supplier) {
      onSupplierSelect(supplier);
    }
  };

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
            <span className="text-gray-500 text-sm">Loading suppliers...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Building size={16} className="inline mr-1" />
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        <option value="">Select supplier...</option>
        {suppliers.map((supplier: any) => (
          <option key={supplier.id} value={supplier.id}>
            {supplier.name}
            {showRnc && supplier.rnc && ` (RNC: ${supplier.rnc})`}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {suppliers.length === 0 && !isLoading && (
        <p className="mt-1 text-sm text-yellow-600">
          ⚠️ No suppliers found. Please add a supplier first.
        </p>
      )}
    </div>
  );
};

export default SupplierSelector;
