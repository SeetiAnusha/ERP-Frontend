import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DeletionButtonProps {
  entityType: 'Payment' | 'Sale' | 'Purchase' | 'AccountsPayable' | 'AccountsReceivable' | 'BankRegister' | 'CashRegister' | 'BusinessExpense' | 'Client' | 'Supplier' | 'Product' | 'BankAccount' | 'Card' | 'FixedAsset';
  entityId: number;
  entityName?: string;
  amount?: number;
  registrationNumber?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  onDeleteSuccess?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button' | 'text';
  className?: string;
  disabled?: boolean;
}

const DeletionButton: React.FC<DeletionButtonProps> = ({
  entityType,
  entityId,
  entityName,
  amount,
  registrationNumber,
  isDeleted = false,
  deletedAt,
  onDeleteSuccess: _onDeleteSuccess,
  size = 'md',
  variant = 'icon',
  className = '',
  disabled = false
}) => {
  const navigate = useNavigate();
  const [isLoading] = useState(false);

  // If already deleted, show deleted status
  if (isDeleted) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium border border-red-200">
          🗑️ DELETED
        </span>
        {deletedAt && (
          <span className="text-xs text-red-600">
            {new Date(deletedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  }

  const handleDelete = () => {
    if (disabled || isLoading) return;

    // Navigate to the centralized transaction deletion page
    navigate('/transaction-deletion', {
      state: {
        entityType,
        entityId,
        entityName,
        amount,
        registrationNumber,
        // Auto-select the transaction type and entity
        preselectedEntity: {
          id: entityId,
          registration_number: registrationNumber || `${entityType}-${entityId}`,
          entity_name: entityName || `${entityType} ${entityId}`,
          description: `${entityType} transaction`,
          amount: amount || 0,
          date: new Date().toISOString(),
          status: 'ACTIVE'
        }
      }
    });
  };

  const sizeClasses = {
    sm: 'p-1',
    md: 'p-2', 
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleDelete}
        disabled={disabled || isLoading}
        className={`
          ${sizeClasses[size]}
          text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg
          transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        title={`Delete ${entityType}`}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full border-2 border-red-600 border-t-transparent" 
               style={{ width: iconSizes[size], height: iconSizes[size] }} />
        ) : (
          <Trash2 size={iconSizes[size]} />
        )}
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleDelete}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center gap-2 px-3 py-2
          text-red-600 hover:text-red-800 hover:bg-red-50
          border border-red-300 hover:border-red-400
          rounded-lg transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
        ) : (
          <Trash2 size={16} />
        )}
        <span>Delete</span>
      </button>
    );
  }

  if (variant === 'text') {
    return (
      <button
        onClick={handleDelete}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center gap-1
          text-red-600 hover:text-red-800 hover:underline
          transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-600 border-t-transparent" />
        ) : (
          <Trash2 size={14} />
        )}
        <span>Delete</span>
      </button>
    );
  }

  return null;
};

export default DeletionButton;