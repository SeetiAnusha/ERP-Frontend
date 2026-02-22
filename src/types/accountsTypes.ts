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
  cardNetwork?: string;
  amount: number;
  receivedAmount: number;
  balanceAmount: number;
  status: string;
  dueDate?: string;
  receivedDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
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
  cardIssuer?: string;
  amount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  dueDate?: string;
  paidDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
