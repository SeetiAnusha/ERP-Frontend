import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { queryClient } from './lib/queryClient';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ModuleDashboard from './pages/ModuleDashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import InventoryAssistant from './pages/InventoryAssistant';
// Module Pages
import MasterDataModule from './pages/modules/MasterDataModule';
import TransactionsModule from './pages/modules/TransactionsModule';
import ExpensesModule from './pages/modules/ExpensesModule';
import AccountingModule from './pages/modules/AccountingModule';
import AdministrationModule from './pages/modules/AdministrationModule';
import AssetsModule from './pages/modules/AssetsModule';
import ReportsModule from './pages/modules/ReportsModule';
import Sales from './pages/Sales';
import Clients from './pages/Clients';
import Purchases from './pages/Purchases';
import Suppliers from './pages/Suppliers';
import FixedAssets from './pages/FixedAssets';
import Investments from './pages/Investments';
import PrepaidExpenses from './pages/PrepaidExpenses';
// import Payments from './pages/Payments';
import CashRegister from './pages/CashRegister';
import BankRegister from './pages/BankRegister';
import CreditCardRegister from './pages/CreditCardRegister';
import Adjustments from './pages/Adjustments';
import Reports from './pages/Reports';
import PPEReport from './pages/PPEReport';
import InvestmentReport from './pages/InvestmentReport';
import AccountsReceivable from './pages/AccountsReceivable';
import AccountsPayable from './pages/AccountsPayable';
import BankAccounts from './pages/BankAccounts';
import CashRegisterMasters from './pages/CashRegisterMasters';
import Cards from './pages/Cards';
import Financers from './pages/Financers';
import Investors from './pages/Investors';
import Banks from './pages/Banks';
import RecentActivity from './pages/RecentActivity';
import InvestmentAgreements from './pages/InvestmentAgreements';
import CardPaymentNetworks from './pages/CardPaymentNetworks';
import ExpenseDebug from './pages/ExpenseDebug';
import CreditBalances from './pages/CreditBalances';
// Expense Management
import BusinessExpenses from './pages/BusinessExpenses';
import ExpenseCategories from './pages/ExpenseCategories';
// Data Classification
import DataClassification from './pages/DataClassification';
// Transaction Deletion
import TransactionDeletion from './pages/TransactionDeletion';
// Authentication
import Authentication from './pages/Authentication';
// User Role Management
import UserRoleManagement from './pages/UserRoleManagement';
// Accounting & Financial Reporting
import ChartOfAccounts from './pages/ChartOfAccounts';
import GeneralLedger from './pages/GeneralLedger';
import TrialBalance from './pages/TrialBalance';
import FinancialReports from './pages/FinancialReports';
import OpeningBalance from './pages/OpeningBalance';
import CreditCardFees from './pages/CreditCardFees';
import CreditCardFeesDashboard from './pages/CreditCardFeesDashboard';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
        <Toaster 
          position="top-center" 
          closeButton 
          toastOptions={{
            style: {
              marginTop: '0px',
            },
            classNames: {
              success: 'toast-success-blue',
            },
          }}
        />
        <Router>
          <Routes>
            {/* Public Authentication Route - redirects to dashboard if already logged in */}
            <Route 
              path="/auth" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Authentication />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Application Routes - requires authentication */}
            <Route 
              path="/*" 
              element={
                <ProtectedRoute requireAuth={true}>
                  <Routes>
                    {/* Module Dashboard - No Layout */}
                    <Route path="/" element={<ModuleDashboard />} />
                    
                    {/* Master Data Module Routes - No Layout */}
                    <Route path="/master-data" element={<MasterDataModule />}>
                      <Route index element={<div />} />
                      <Route path="products" element={<Products />} />
                      <Route path="inventory" element={<Inventory />} />
                      <Route path="inventory-assistant" element={<InventoryAssistant />} />
                      <Route path="suppliers" element={<Suppliers />} />
                      <Route path="clients" element={<Clients />} />
                      <Route path="bank-accounts" element={<BankAccounts />} />
                      <Route path="cards" element={<Cards />} />
                      <Route path="cash-registers" element={<CashRegisterMasters />} />
                      <Route path="financers" element={<Financers />} />
                      <Route path="card-networks" element={<CardPaymentNetworks />} />
                    </Route>

                    {/* Transactions Module Routes - No Layout */}
                    <Route path="/transactions" element={<TransactionsModule />}>
                      <Route index element={<div />} />
                      <Route path="sales" element={<Sales />} />
                      <Route path="purchases" element={<Purchases />} />
                      <Route path="accounts-receivable" element={<AccountsReceivable />} />
                      <Route path="accounts-payable" element={<AccountsPayable />} />
                      <Route path="cash-register" element={<CashRegister />} />
                      <Route path="bank-register" element={<BankRegister />} />
                      <Route path="credit-card-register" element={<CreditCardRegister />} />
                      <Route path="adjustments" element={<Adjustments />} />
                    </Route>

                    {/* Expenses Module Routes - No Layout */}
                    <Route path="/expenses" element={<ExpensesModule />}>
                      <Route index element={<div />} />
                      <Route path="business-expenses" element={<BusinessExpenses />} />
                      <Route path="credit-card-fees" element={<CreditCardFees />} />
                      <Route path="expense-categories" element={<ExpenseCategories />} />
                      <Route path="credit-balances" element={<CreditBalances />} />
                    </Route>

                    {/* Accounting Module Routes - No Layout */}
                    <Route path="/accounting" element={<AccountingModule />}>
                      <Route index element={<div />} />
                      <Route path="chart-of-accounts" element={<ChartOfAccounts />} />
                      <Route path="general-ledger" element={<GeneralLedger />} />
                      <Route path="trial-balance" element={<TrialBalance />} />
                      <Route path="opening-balance" element={<OpeningBalance />} />
                      <Route path="financial-reports" element={<FinancialReports />} />
                    </Route>

                    {/* Administration Module Routes - No Layout (Admin/Manager only) */}
                    <Route path="/administration" element={<AdministrationModule />}>
                      <Route index element={<div />} />
                      <Route path="user-roles" element={<UserRoleManagement />} />
                      <Route path="data-classification" element={<DataClassification />} />
                      <Route path="transaction-deletion" element={<TransactionDeletion />} />
                    </Route>

                    {/* Assets & Financing Module Routes - No Layout */}
                    <Route path="/assets" element={<AssetsModule />}>
                      <Route index element={<div />} />
                      <Route path="fixed-assets" element={<FixedAssets />} />
                      <Route path="investments" element={<Investments />} />
                      <Route path="prepaid-expenses" element={<PrepaidExpenses />} />
                      <Route path="investors" element={<Investors />} />
                      <Route path="loans" element={<Banks />} />
                      <Route path="investment-agreements" element={<InvestmentAgreements />} />
                      <Route path="activity" element={<RecentActivity />} />
                      <Route path="reports" element={<Reports />} />
                    </Route>

                    {/* Reports Module Routes - No Layout */}
                    <Route path="/reports" element={<ReportsModule />}>
                      <Route index element={<div />} />
                      <Route path="general" element={<Reports />} />
                      <Route path="ppe" element={<PPEReport />} />
                      <Route path="investments" element={<InvestmentReport />} />
                    </Route>

                    {/* Legacy Routes with Layout (for debugging only) */}
                    <Route path="/legacy/*" element={
                      <Layout>
                        <Routes>
                          <Route path="expense-debug" element={<ExpenseDebug />} />
                          <Route path="credit-card-fees/dashboard" element={<CreditCardFeesDashboard />} />
                        </Routes>
                      </Layout>
                    } />
                  </Routes>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
    <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;