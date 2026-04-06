import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface DeletionEntity {
  id: number;
  registrationNumber?: string;
  entityName?: string;
  amount?: number;
  date?: string;
  status?: string;
}

interface UseDeletionProps {
  entityType: 'Payment' | 'Sale' | 'Purchase' | 'AccountsPayable' | 'AccountsReceivable' | 'BankRegister' | 'CashRegister' | 'BusinessExpense';
  onDeleteSuccess?: () => void;
}

export const useDeletion = ({ entityType, onDeleteSuccess: _onDeleteSuccess }: UseDeletionProps) => {
  const navigate = useNavigate();

  const navigateToDeletePage = useCallback((entity: DeletionEntity) => {
    navigate('/transaction-deletion', {
      state: {
        entityType,
        entityId: entity.id,
        entityName: entity.entityName,
        amount: entity.amount,
        registrationNumber: entity.registrationNumber,
        // Auto-select the transaction for deletion
        preselectedEntity: {
          id: entity.id,
          registration_number: entity.registrationNumber || `${entityType}-${entity.id}`,
          entity_name: entity.entityName || `${entityType} ${entity.id}`,
          description: `${entityType} transaction`,
          amount: entity.amount || 0,
          date: entity.date || new Date().toISOString(),
          status: entity.status || 'ACTIVE'
        }
      }
    });
  }, [navigate, entityType]);

  const isDeleted = useCallback((entity: any) => {
    return entity.deletion_status === 'EXECUTED';
  }, []);

  const isReversal = useCallback((entity: any) => {
    return entity.is_reversal === true;
  }, []);

  const getDeletionStatus = useCallback((entity: any) => {
    return {
      isDeleted: isDeleted(entity),
      isReversal: isReversal(entity),
      deletionStatus: entity.deletion_status,
      deletedAt: entity.deleted_at,
      deletedBy: entity.deleted_by,
      deletionReason: entity.deletion_reason_code || entity.deletion_memo
    };
  }, [isDeleted, isReversal]);

  const getRowClassName = useCallback((entity: any) => {
    const status = getDeletionStatus(entity);
    
    if (status.isDeleted) {
      return 'bg-red-50 opacity-75';
    }
    
    if (status.isReversal) {
      return 'bg-orange-50';
    }
    
    if (status.deletionStatus === 'REQUESTED') {
      return 'bg-yellow-50';
    }
    
    if (status.deletionStatus === 'APPROVED') {
      return 'bg-orange-50';
    }
    
    return '';
  }, [getDeletionStatus]);

  const getTextClassName = useCallback((entity: any, baseClass: string = '') => {
    const status = getDeletionStatus(entity);
    
    if (status.isDeleted) {
      return `${baseClass} line-through text-gray-500`;
    }
    
    return baseClass;
  }, [getDeletionStatus]);

  return {
    navigateToDeletePage,
    isDeleted,
    isReversal,
    getDeletionStatus,
    getRowClassName,
    getTextClassName
  };
};