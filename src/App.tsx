import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LanguageProvider } from './contexts/LanguageContext';
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
import Payments from './pages/Payments';
import CashRegister from './pages/CashRegister';
import Adjustments from './pages/Adjustments';
import Reports from './pages/Reports';
import PPEReport from './pages/PPEReport';
import InvestmentReport from './pages/InvestmentReport';

function App() {
  return (
    <LanguageProvider>
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
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/fixed-assets" element={<FixedAssets />} />
            <Route path="/investments" element={<Investments />} /> 
            <Route path="/prepaid-expenses" element={<PrepaidExpenses />} /> 
            <Route path="/payments" element={<Payments />} />
            <Route path="/cash-register" element={<CashRegister />} />
            <Route path="/adjustments" element={<Adjustments />} /> 
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/ppe" element={<PPEReport />} />
            <Route path="/reports/investments" element={<InvestmentReport />} />
          </Routes>
        </Layout>
      </Router>
    </LanguageProvider>
  );
}

export default App;
