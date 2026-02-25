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
  supplierRnc?: string;
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
}
