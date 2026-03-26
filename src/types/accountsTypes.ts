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
