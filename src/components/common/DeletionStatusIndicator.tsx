import React from 'react';
import { Clock, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';

interface DeletionStatusIndicatorProps {
  deletionStatus?: string;
  isReversal?: boolean;
  deletedAt?: string;
  deletedBy?: number;
  deletionReason?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

const DeletionStatusIndicator: React.FC<DeletionStatusIndicatorProps> = ({
  deletionStatus,
  isReversal = false,
  deletedAt,
  deletedBy: _deletedBy,
  deletionReason,
  size = 'md',
  showDetails = false
}) => {
  // If no deletion status or status is NONE, don't show anything
  if (!deletionStatus || deletionStatus === 'NONE') {
    return null;
  }

  // Handle reversal entries
  if (isReversal) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
          ↩️ REVERSAL
        </span>
        {showDetails && deletedAt && (
          <span className="text-xs text-orange-600">
            Created: {new Date(deletedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  }

  const getStatusConfig = () => {
    const configs = {
      'REQUESTED': {
        icon: <Clock size={14} />,
        label: 'Deletion Requested',
        bgClass: 'bg-yellow-50 border-yellow-200',
        textClass: 'text-yellow-800',
        badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300'
      },
      'APPROVED': {
        icon: <CheckCircle size={14} />,
        label: 'Deletion Approved',
        bgClass: 'bg-orange-50 border-orange-200',
        textClass: 'text-orange-800',
        badgeClass: 'bg-orange-100 text-orange-800 border-orange-300'
      },
      'EXECUTED': {
        icon: <Trash2 size={14} />,
        label: 'DELETED',
        bgClass: 'bg-red-50 border-red-200',
        textClass: 'text-red-800',
        badgeClass: 'bg-red-100 text-red-800 border-red-300'
      },
      'REJECTED': {
        icon: <AlertTriangle size={14} />,
        label: 'Deletion Rejected',
        bgClass: 'bg-gray-50 border-gray-200',
        textClass: 'text-gray-800',
        badgeClass: 'bg-gray-100 text-gray-800 border-gray-300'
      }
    };

    return configs[deletionStatus as keyof typeof configs] || null;
  };

  const config = getStatusConfig();
  if (!config) return null;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`
        inline-flex items-center gap-1 rounded-full font-medium border
        ${config.badgeClass} ${sizeClasses[size]}
      `}>
        {config.icon}
        <span>{config.label}</span>
      </span>
      
      {showDetails && deletedAt && (
        <div className="text-xs text-gray-600 text-center">
          <div>{new Date(deletedAt).toLocaleDateString()}</div>
          {deletionReason && (
            <div className="text-xs text-gray-500 max-w-xs truncate" title={deletionReason}>
              {deletionReason}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeletionStatusIndicator;