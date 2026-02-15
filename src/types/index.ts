export interface Product {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  amount: number;
  unitCost: number;
  salesPrice: number;
  subtotal: number;
  supplierId?: number;
  minimumStock: number;
  taxRate: number;
  barcode?: string;
  status: string;
  description?: string;
}

export interface Client {
  id: number;
  code: string;
  name: string;
  rncCedula: string;
  phone: string;
  email?: string;
  address: string;
  clientType: string;
  creditLimit: number;
  paymentTerms: string;
  currentBalance: number;
  status: string;
  contactPerson?: string;
  notes?: string;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  rnc: string;
  phone: string;
  email?: string;
  address: string;
  supplierType: string;
  paymentTerms: string;
  currentBalance: number;
  status: string;
  contactPerson?: string;
  notes?: string;
}

export interface Sale {
  id: number;
  registrationNumber: string;
  documentNumber: string;
  registrationDate: string;
  date: string;
  clientId: number;
  clientRnc?: string;
  ncf?: string;
  saleType: string;
  paymentType: string;
  paymentStatus: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  client?: Client;
  items?: SaleItem[];
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  productCode: string;
  productName: string;
  unitOfMeasurement: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tax: number;
  total: number;
  costOfGoodsSold: number;
  grossMargin: number;
}

export interface Purchase {
  id: number;
  registrationNumber: string;
  registrationDate: string;
  date: string;
  supplierId: number;
  supplierRnc?: string;
  ncf?: string;
  purchaseType: string;
  paymentType: string;
  paymentStatus: string;
  productTotal: number;
  additionalExpenses: number;
  total: number;
  paidAmount: number;
  balanceAmount: number;
  totalWithAssociated?: number;
  status: string;
  invoice?: string;
  supplier?: Supplier;
  items?: PurchaseItem[];
  associatedInvoices?: AssociatedInvoice[];
}

export interface PurchaseItem {
  id: number;
  purchaseId: number;
  productId: number;
  productCode: string;
  productName: string;
  unitOfMeasurement: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  tax: number;
  total: number;
  adjustedUnitCost?: number;
  adjustedTotal?: number;
}

export interface AssociatedInvoice {
  id?: number;
  purchaseId?: number;
  supplierRnc: string;
  supplierName: string;
  concept: string;
  ncf: string;
  date: string;
  taxAmount: number;
  tax: number;
  amount: number;
  purchaseType: string;
  paymentType?: string;
}

export interface FixedAsset {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  acquisitionDate: string;
  acquisitionCost: number;
  usefulLife: number;
  depreciationMethod: string;
  residualValue: number;
  accumulatedDepreciation: number;
  bookValue: number;
  status: string;
  location?: string;
  serialNumber?: string;
}

export interface Investment {
  id: number;
  code: string;
  name: string;
  type: string;
  description: string;
  acquisitionDate: string;
  acquisitionCost: number;
  currentValue: number;
  quantity: number;
  unitCost: number;
  status: string;
  maturityDate?: string;
  interestRate?: number;
}

export interface PrepaidExpense {
  id: number;
  code: string;
  name: string;
  type: string;
  description: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  amortizedAmount: number;
  remainingAmount: number;
  monthlyAmortization: number;
  status: string;
  supplierId?: number;
}

export interface Payment {
  id: number;
  registrationNumber: string;
  registrationDate: string;
  paymentMethod: string;
  paymentAmount: number;
  type: string;
  relatedEntityType: string;
  relatedEntityId: number;
  supplierRnc?: string;
  supplierName?: string;
  clientRnc?: string;
  clientName?: string;
  outstandingCreditInvoices?: string;
  outstandingCashInvoices?: string;
  invoiceApplications?: string;
  excessAmount?: number;
  notes?: string;
}

export interface InvoicePaymentApplication {
  invoiceNo: string;
  date: string;
  supplier: string;
  conditionPayment: string;
  amount: number;
  amountPending: number;
  amountToPay: number;
}

export interface CashTransaction {
  id: number;
  registrationNumber: string;
  registrationDate: string;
  transactionType: string;
  amount: number;
  paymentMethod: string;
  relatedDocumentType?: string;
  relatedDocumentNumber?: string;
  clientRnc?: string;
  clientName?: string;
  description: string;
  balance: number;
}

export interface Adjustment {
  id: number;
  registrationNumber: string;
  registrationDate: string;
  type: string;
  relatedDocumentType: string;
  relatedDocumentNumber: string;
  relatedEntityType: string;
  relatedEntityId: number;
  supplierRnc?: string;
  supplierName?: string;
  clientRnc?: string;
  clientName?: string;
  ncf?: string;
  date?: string;
  reason: string;
  adjustmentAmount: number;
  notes?: string;
}

export interface ProductPrice {
  id: number;
  productId: number;
  salesPrice: number;
  effectiveDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
