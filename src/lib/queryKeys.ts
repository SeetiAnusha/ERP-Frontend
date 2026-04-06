// Hierarchical query key structure for React Query
export const QUERY_KEYS = {
  // Products
  products: ['products'] as const,
  product: (id: number) => ['products', id] as const,
  
  // Sales
  sales: ['sales'] as const,
  sale: (id: number) => ['sales', id] as const,
  saleDetails: (id: number) => ['sales', id, 'details'] as const,
  
  // Purchases
  purchases: ['purchases'] as const,
  purchase: (id: number) => ['purchases', id] as const,
  purchaseDetails: (id: number) => ['purchases', id, 'details'] as const,
  
  // Accounts Payable
  accountsPayable: ['accounts-payable'] as const,
  payable: (id: number) => ['accounts-payable', id] as const,
  payableDetails: (id: number) => ['accounts-payable', id, 'details'] as const,
  payableHistory: (id: number) => ['accounts-payable', id, 'history'] as const,
  
  // Accounts Receivable
  accountsReceivable: ['accounts-receivable'] as const,
  receivable: (id: number) => ['accounts-receivable', id] as const,
  receivableDetails: (id: number) => ['accounts-receivable', id, 'details'] as const,
  receivableHistory: (id: number) => ['accounts-receivable', id, 'history'] as const,
  
  // Bank Transactions
  bankTransactions: ['bank-transactions'] as const,
  bankTransaction: (id: number) => ['bank-transactions', id] as const,
  
  // Cash Register
  cashTransactions: ['cash-transactions'] as const,
  cashTransaction: (id: number) => ['cash-transactions', id] as const,
  
  // Payments
  payments: ['payments'] as const,
  payment: (id: number) => ['payments', id] as const,
  
  // Recent Activity
  recentActivity: (limit?: number) => ['recent-activity', limit ?? 100] as const,
  recentActivityStatistics: ['recent-activity', 'statistics'] as const,
  recentActivityByDateRange: (startDate: string, endDate: string) => ['recent-activity', 'date-range', startDate, endDate] as const,
  
  // ✅ NEW: Business Expenses
  businessExpenses: ['business-expenses'] as const,
  businessExpense: (id: number) => ['business-expenses', id] as const,
  
  // Master Data
  clients: ['clients'] as const,
  suppliers: ['suppliers'] as const,
  cards: ['cards'] as const,
  cashRegisters: ['cash-registers'] as const,
  bankAccounts: ['bank-accounts'] as const,
  paymentNetworks: ['payment-networks'] as const,
  
  // ✅ NEW: Credit & Financial Data
  creditBalances: ['credit-balances'] as const,
  creditCardTransactions: ['credit-card-transactions'] as const,
  
  // ✅ NEW: Expense Management
  expenseCategories: ['expense-categories'] as const,
  expenseTypes: (categoryId: number) => ['expense-types', categoryId] as const,
  
  // ✅ NEW: Financers
  financers: ['financers'] as const,
  
  // ✅ NEW: Investment Management
  investmentAgreements: ['investment-agreements'] as const,
  investmentAgreement: (id: number) => ['investment-agreements', id] as const,
  investmentSummary: ['investment-agreements', 'summary'] as const,
  investmentReport: (type?: string) => ['investment-report', type ?? 'all'] as const,
  investors: ['investors'] as const,
  investorsSummary: ['investors', 'summary'] as const,
  
  // ✅ NEW: Adjustments & Corrections
  adjustments: ['adjustments'] as const,
  adjustment: (id: number) => ['adjustments', id] as const,
  
  // ✅ NEW: Investments (standalone)
  investments: ['investments'] as const,
  investment: (id: number) => ['investments', id] as const,
} as const;

// Type for query keys
export type QueryKey = typeof QUERY_KEYS[keyof typeof QUERY_KEYS];