import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { useClients } from '../../hooks/queries/useSharedData';

interface ClientSelectorProps {
  value: string | number;
  onChange: (value: string, client?: any) => void;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  showRnc?: boolean;
  filterActive?: boolean;
  className?: string;
  error?: string;
  onClientSelect?: (client: any) => void;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({
  value,
  onChange,
  required = false,
  disabled = false,
  label = 'Client',
  showRnc = false,
  filterActive = true,
  className = '',
  error,
  onClientSelect
}) => {
  const { data: allClients = [], isLoading } = useClients();

  const clients = useMemo(() => {
    if (!filterActive) return allClients;
    return allClients.filter((client: any) => client.status === 'ACTIVE');
  }, [allClients, filterActive]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    const client = clients.find((c: any) => c.id === parseInt(clientId));
    
    onChange(clientId, client);
    
    if (onClientSelect && client) {
      onClientSelect(client);
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
            <span className="text-gray-500 text-sm">Loading clients...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Users size={16} className="inline mr-1" />
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
        <option value="">Select client...</option>
        {clients.map((client: any) => (
          <option key={client.id} value={client.id}>
            {client.name}
            {showRnc && client.rncCedula && ` (RNC: ${client.rncCedula})`}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {clients.length === 0 && !isLoading && (
        <p className="mt-1 text-sm text-yellow-600">
          ⚠️ No clients found. Please add a client first.
        </p>
      )}
    </div>
  );
};

export default ClientSelector;
