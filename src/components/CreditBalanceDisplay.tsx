import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, User, Calendar, DollarSign, Info } from 'lucide-react';
import api from '../api/axios';

interface CreditBalance {
  id: number;
  registrationNumber: string;
  registrationDate: string;
  type: 'CUSTOMER_CREDIT' | 'SUPPLIER_CREDIT';
  relatedEntityType: 'CLIENT' | 'SUPPLIER';
  relatedEntityId: number;
  relatedEntityName: string;
  originalTransactionType: 'AR' | 'AP';
  originalTransactionId: number;
  originalTransactionNumber: string;
  creditAmount: number;
  usedAmount: number;
  availableAmount: number;
  status: 'ACTIVE' | 'FULLY_USED' | 'EXPIRED';
  notes?: string;
}

interface CreditBalanceDisplayProps {
  entityType: 'CLIENT' | 'SUPPLIER';
  entityId: number;
  entityName: string;
  showTitle?: boolean;
  compact?: boolean;
}

const CreditBalanceDisplay: React.FC<CreditBalanceDisplayProps> = ({
  entityType,
  entityId,
  entityName,
  showTitle = true,
  compact = false
}) => {
  const [creditBalances, setCreditBalances] = useState<CreditBalance[]>([]);
  const [availableCredit, setAvailableCredit] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchCreditBalances();
    fetchAvailableCredit();
  }, [entityType, entityId]);

  const fetchCreditBalances = async () => {
    try {
      const response = await api.get(`/credit-balances/entity/${entityType}/${entityId}`);
      setCreditBalances(response.data);
    } catch (error) {
      console.error('Error fetching credit balances:', error);
    }
  };

  const fetchAvailableCredit = async () => {
    try {
      const response = await api.get(`/credit-balances/available/${entityType}/${entityId}`);
      setAvailableCredit(response.data.availableCreditBalance);
    } catch (error) {
      console.error('Error fetching available credit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const entityIcon = entityType === 'CLIENT' ? User : CreditCard;
  const entityColor = entityType === 'CLIENT' ? 'blue' : 'green';
  const entityLabel = entityType === 'CLIENT' ? 'Customer' : 'Supplier';

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (availableCredit === 0 && creditBalances.length === 0) {
    return null; // Don't show anything if no credits
  }

  if (compact) {
    return (
      <div className={`bg-${entityColor}-50 border border-${entityColor}-200 rounded-lg p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {React.createElement(entityIcon, { className: `text-${entityColor}-600`, size: 16 })}
            <span className={`text-sm font-medium text-${entityColor}-800`}>
              Available Credit
            </span>
          </div>
          <span className={`font-bold text-${entityColor}-900`}>
            ₹{availableCredit.toFixed(2)}
          </span>
        </div>
        {creditBalances.length > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`text-xs text-${entityColor}-600 hover:text-${entityColor}-800 mt-1`}
          >
            {showDetails ? 'Hide' : 'Show'} details ({creditBalances.length} credits)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center gap-2">
          {React.createElement(entityIcon, { className: `text-${entityColor}-600`, size: 20 })}
          <h4 className="font-semibold text-gray-900">
            {entityLabel} Credit Balance
          </h4>
        </div>
      )}

      {/* Available Credit Summary */}
      <div className={`bg-${entityColor}-50 border border-${entityColor}-200 rounded-lg p-4`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className={`text-sm font-medium text-${entityColor}-800`}>
              Available Credit for {entityName}
            </p>
            <p className={`text-2xl font-bold text-${entityColor}-900`}>
              ₹{availableCredit.toFixed(2)}
            </p>
          </div>
          <DollarSign className={`text-${entityColor}-600`} size={32} />
        </div>
        
        {creditBalances.length > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`text-sm text-${entityColor}-600 hover:text-${entityColor}-800 flex items-center gap-1`}
          >
            <Info size={14} />
            {showDetails ? 'Hide' : 'Show'} credit details ({creditBalances.length} credits)
          </button>
        )}
      </div>

      {/* Credit Details */}
      {showDetails && creditBalances.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3"
        >
          {creditBalances.map((credit) => (
            <div
              key={credit.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">
                    {credit.registrationNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    From {credit.originalTransactionType} {credit.originalTransactionNumber}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  credit.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800'
                    : credit.status === 'FULLY_USED'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {credit.status}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Credit</p>
                  <p className="font-semibold">₹{credit.creditAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Used</p>
                  <p className="font-semibold text-red-600">₹{credit.usedAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Available</p>
                  <p className="font-semibold text-green-600">₹{credit.availableAmount.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{new Date(credit.registrationDate).toLocaleDateString()}</span>
                </div>
                {credit.notes && (
                  <div className="flex-1">
                    <p className="truncate" title={credit.notes}>
                      {credit.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default CreditBalanceDisplay;