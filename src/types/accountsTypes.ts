export interface AccountsReceivable {
  id: number;
  registrationNumber: string;
  registrationDate: string;
  type: string;
  relatedDocumentType: string;
  relatedDocumentId: number;
  relatedDocumentNumber: string;
  clientId?: number;
  clientName?: string;
  clientRnc?: string;
  ncf?: string;
  saleOf?: string;
  cardNetwork?: string;
  amount: number;
  receivedAmount: number;
  balanceAmount: number;
  expectedBankDeposit?: number; // New field for expected bank deposit
  actualBankDeposit?: number; // New field for actual amount deposited to bank
  bankAccountId?: number; // Which bank account received the deposit
  status: string;
  dueDate?: string;
  receivedDate?: string;
  notes?: string;
  // ✅ NEW: Collection tracking fields
  collectionDate?: string;
  transferReference?: string;
  collectionNotes?: string;
  collection_method?: string; // How payment was collected (CASH, CREDIT_CARD, DEBIT_CARD, etc.)
  createdAt?: string;
  updatedAt?: string;
  // New fields for expense data
  relatedExpenses?: ExpenseRecord[];
  totalExpenseAmount?: number;
  // ✅ NEW: Deletion tracking fields
  deletion_status?: 'NONE' | 'REQUESTED' | 'APPROVED' | 'EXECUTED';
  deleted_at?: string;
  deleted_by?: number;
  deletion_reason_code?: string;
  deletion_memo?: string;
  is_reversal?: boolean;
  original_transaction_id?: number;
}

export interface ExpenseRecord {
  id: number;
  registrationNumber: string;
  amount: number;
  expenseType: string;
  status: string;
  description?: string;
}

export interface AccountsPayable {
  id: number;
  registrationNumber: string;
  registrationDate: string;
  type: string;
  relatedDocumentType: string;
  relatedDocumentId: number;
  relatedDocumentNumber: string;
  supplierId?: number;
  supplierName?: string;
  supplierRnc?: string;
  // ✅ NEW: Financer/Lender fields (for FINANCIER, SHAREHOLDER_LENDER, RELATED_PARTY_LENDER)
  financerId?: number;
  financerName?: string;
  loanAmount?: number;
  interestRate?: number;
  cardId?: number;
  cardIssuer?: string;
  ncf?: string;
  purchaseDate?: string;
  purchaseType?: string;
  paymentType?: string;
  amount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  dueDate?: string;
  paidDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  // 🔥 NEW: Deletion tracking fields
  deletion_status?: 'NONE' | 'REQUESTED' | 'APPROVED' | 'EXECUTED';
  deleted_at?: string;
  deleted_by?: number;
  deletion_reason_code?: string;
  deletion_memo?: string;
}

// ✅ NEW: Shareholder interface for Cash Register
export interface Shareholder {
  id: number;
  code: string;
  name: string;
  equity_percentage?: number;
  total_contributed: number;
  displayName: string;
}

// ✅ NEW: Lender interface for Cash Register (FINANCIER, SHAREHOLDER_LENDER, RELATED_PARTY_LENDER)
export interface Lender {
  id: number;
  code: string;
  name: string;
  financer_type: 'FINANCIER' | 'SHAREHOLDER_LENDER' | 'RELATED_PARTY_LENDER';
  interest_rate?: number;
  total_contributed: number;
  outstanding_balance: number;
  relationship_description?: string;
  displayName: string;
}

// ✅ NEW: Cash Register interface with shareholder fields
export interface CashRegister {
  id: number;
  registrationNumber: string;
  registrationDate: string;
  transactionType: 'INFLOW' | 'OUTFLOW';
  amount: number;
  paymentMethod: string;
  relatedDocumentType: string;
  relatedDocumentNumber?: string;
  description: string;
  customerId?: number;
  customerName?: string;
  cashRegisterId?: number;
  bankAccountId?: number;
  balance: number;
  // ✅ NEW: Shareholder contribution fields
  shareholderId?: number;
  shareholderAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}
