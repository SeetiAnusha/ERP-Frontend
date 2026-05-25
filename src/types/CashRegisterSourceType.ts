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
  MANUAL = 'MANUAL',
  // ✅ NEW: Credit Card Sale Collection
  CREDIT_CARD_SALE_COLLECTION = 'CREDIT_CARD_SALE_COLLECTION',
  // ✅ NEW: Financer types
  SHAREHOLDER_CONTRIBUTOR = 'SHAREHOLDER_CONTRIBUTOR',
  FINANCIER = 'FINANCIER',
  SHAREHOLDER_LENDER = 'SHAREHOLDER_LENDER',
  RELATED_PARTY_LENDER = 'RELATED_PARTY_LENDER'
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
  [CashRegisterSourceType.MANUAL]: 'Manual Entry',
  [CashRegisterSourceType.CREDIT_CARD_SALE_COLLECTION]: 'Credit Card Sale Collection',
  [CashRegisterSourceType.SHAREHOLDER_CONTRIBUTOR]: 'Shareholder Contributor',
  [CashRegisterSourceType.FINANCIER]: 'Financier',
  [CashRegisterSourceType.SHAREHOLDER_LENDER]: 'Shareholder Lender',
  [CashRegisterSourceType.RELATED_PARTY_LENDER]: 'Related Party Lender'
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
  [CashRegisterSourceType.MANUAL]: 'bg-gray-100 text-gray-800',
  [CashRegisterSourceType.CREDIT_CARD_SALE_COLLECTION]: 'bg-purple-100 text-purple-800',
  [CashRegisterSourceType.SHAREHOLDER_CONTRIBUTOR]: 'bg-green-100 text-green-800',
  [CashRegisterSourceType.FINANCIER]: 'bg-blue-100 text-blue-800',
  [CashRegisterSourceType.SHAREHOLDER_LENDER]: 'bg-indigo-100 text-indigo-800',
  [CashRegisterSourceType.RELATED_PARTY_LENDER]: 'bg-pink-100 text-pink-800'
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
