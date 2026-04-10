import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { queryClient } from './lib/queryClient';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
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
// import ChartOfAccounts from './pages/ChartOfAccounts';
// import GeneralLedger from './pages/GeneralLedger';
// import TrialBalance from './pages/TrialBalance';
// import FinancialReports from './pages/FinancialReports';
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
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/inventory" element={<Inventory />} />
                      <Route path="/sales" element={<Sales />} />
                      <Route path="/clients" element={<Clients />} />
                      <Route path="/purchases" element={<Purchases />} />
                      <Route path="/suppliers" element={<Suppliers />} />
                      {/* Expense Management Routes */}
                      <Route path="/business-expenses" element={<BusinessExpenses />} />
                      <Route path="/expense-categories" element={<ExpenseCategories />} />
                      <Route path="/fixed-assets" element={<FixedAssets />} />
                      <Route path="/investments" element={<Investments />} /> 
                      <Route path="/prepaid-expenses" element={<PrepaidExpenses />} /> 
                      {/* <Route path="/payments" element={<Payments />} /> */}
                      <Route path="/cash-register" element={<CashRegister />} />
                      <Route path="/bank-register" element={<BankRegister />} />
                      <Route path="/credit-card-register" element={<CreditCardRegister />} />
                      <Route path="/adjustments" element={<Adjustments />} /> 
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/reports/ppe" element={<PPEReport />} />
                      <Route path="/reports/investments" element={<InvestmentReport />} />
                      <Route path="/accounts-receivable" element={<AccountsReceivable />} />
                      <Route path="/accounts-payable" element={<AccountsPayable />} />
                      <Route path="/bank-accounts" element={<BankAccounts />} />
                      <Route path="/cash-register-masters" element={<CashRegisterMasters />} />
                      <Route path="/cards" element={<Cards />} />
                      <Route path="/financers" element={<Financers />} />
                      <Route path="/investors" element={<Investors />} />
                      <Route path="/banks" element={<Banks />} />
                      <Route path="/recent-activity" element={<RecentActivity />} />
                      <Route path="/investment-agreements" element={<InvestmentAgreements />} />
                      <Route path="/card-payment-networks" element={<CardPaymentNetworks />} />
                      <Route path="/credit-balances" element={<CreditBalances />} />
                      <Route path="/data-classification" element={<DataClassification />} />
                      <Route path="/transaction-deletion" element={<TransactionDeletion />} />
                      <Route path="/user-roles" element={<UserRoleManagement />} />
                      <Route path="/expense-debug" element={<ExpenseDebug />} />
                      {/* Accounting & Financial Reporting Routes */}
                      {/* <Route path="/accounting/chart-of-accounts" element={<ChartOfAccounts />} />
                      <Route path="/accounting/general-ledger" element={<GeneralLedger />} />
                      <Route path="/accounting/trial-balance" element={<TrialBalance />} />
                      <Route path="/accounting/financial-reports" element={<FinancialReports />} /> */}
                      {/* Credit Card Fees Routes */}
                      <Route path="/credit-card-fees" element={<CreditCardFees />} />
                      <Route path="/credit-card-fees/dashboard" element={<CreditCardFeesDashboard />} />
                    </Routes>
                  </Layout>
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