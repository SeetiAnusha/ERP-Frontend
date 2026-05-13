/**
 * Cash Register Source Transaction Types (Frontend)
 * 
 * Must match backend enum exactly for consistency
 */
export enum CashRegisterSourceType {
  SALE = 'SALE',
  AR_COLLECTION = 'AR_COLLECTION',
  CONTRIBUTION = 'CONTRIBUTION',
  LOAN = 'LOAN',
  BANK_DEPOSIT = 'BANK_DEPOSIT',
  CORRECTION = 'CORRECTION',
  MANUAL = 'MANUAL'
}

/**
 * Display labels for source types
 */
export const CashRegisterSourceTypeLabels: Record<CashRegisterSourceType, string> = {
  [CashRegisterSourceType.SALE]: 'Sale',
  [CashRegisterSourceType.AR_COLLECTION]: 'AR Collection',
  [CashRegisterSourceType.CONTRIBUTION]: 'Contribution',
  [CashRegisterSourceType.LOAN]: 'Loan',
  [CashRegisterSourceType.BANK_DEPOSIT]: 'Bank Deposit',
  [CashRegisterSourceType.CORRECTION]: 'Correction',
  [CashRegisterSourceType.MANUAL]: 'Manual Entry'
};

/**
 * Color coding for UI display (Tailwind CSS classes)
 */
export const CashRegisterSourceTypeColors: Record<CashRegisterSourceType, string> = {
  [CashRegisterSourceType.SALE]: 'bg-yellow-100 text-yellow-800',
  [CashRegisterSourceType.AR_COLLECTION]: 'bg-green-100 text-green-800',
  [CashRegisterSourceType.CONTRIBUTION]: 'bg-blue-100 text-blue-800',
  [CashRegisterSourceType.LOAN]: 'bg-purple-100 text-purple-800',
  [CashRegisterSourceType.BANK_DEPOSIT]: 'bg-red-100 text-red-800',
  [CashRegisterSourceType.CORRECTION]: 'bg-gray-100 text-gray-800',
  [CashRegisterSourceType.MANUAL]: 'bg-gray-100 text-gray-800'
};

/**
 * Get badge color for a source type
 * Provides fallback for unknown types
 */
export function getSourceBadgeColor(sourceType: string | null | undefined): string {
  if (!sourceType) {
    return CashRegisterSourceTypeColors[CashRegisterSourceType.MANUAL];
  }
  
  return CashRegisterSourceTypeColors[sourceType as CashRegisterSourceType] 
    || CashRegisterSourceTypeColors[CashRegisterSourceType.MANUAL];
}

/**
 * Get display label for a source type
 * Provides fallback for unknown types
 */
export function getSourceLabel(sourceType: string | null | undefined): string {
  if (!sourceType) {
    return CashRegisterSourceTypeLabels[CashRegisterSourceType.MANUAL];
  }
  
  return CashRegisterSourceTypeLabels[sourceType as CashRegisterSourceType] 
    || CashRegisterSourceTypeLabels[CashRegisterSourceType.MANUAL];
}

/**
 * Check if a value is a valid source type
 */
export function isValidSourceType(value: string): value is CashRegisterSourceType {
  return Object.values(CashRegisterSourceType).includes(value as CashRegisterSourceType);
}
