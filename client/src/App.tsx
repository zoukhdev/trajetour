import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { LanguageProvider } from './context/LanguageContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientList from './pages/Clients/ClientList';
import AgencyList from './pages/Agencies/AgencyList';
import OrderListV2 from './pages/Orders/OrderListV2';
import OrderFormV2 from './pages/Orders/OrderFormV2';
import OrderDetails from './pages/Orders/OrderDetails';
import OfferList from './pages/Offers/OfferList';
import AgencyDetails from './pages/Agencies/AgencyDetails';
import GuideExpenseList from './pages/Expenses/GuideExpenseList';
import ExpenseList from './pages/Expenses/ExpenseList';
import CaissePage from './pages/Caisse/CaissePage';
import UserList from './pages/Users/UserList';
import RoomingList from './pages/Rooms/RoomingList';
import ReportsPage from './pages/Reports/ReportsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { ExchangeRateProvider } from './context/ExchangeRateContext';
import SupplierList from './pages/Suppliers/SupplierList';
import DiscountList from './pages/Discounts/DiscountList';
import TaxList from './pages/Taxes/TaxList';
import PaymentList from './pages/Payments/PaymentList';
import CommissionReport from './pages/Reports/CommissionReport';
import RevenueReport from './pages/Reports/RevenueReport';
import SupplierContracts from './pages/Suppliers/SupplierContracts';
import LogsPage from './pages/Logs/LogsPage';

import DataMigration from './components/DataMigration';

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <DataProvider>
            <ExchangeRateProvider>
              <Routes>
                <Route path="/login" element={<Login />} />

                <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="migration" element={<DataMigration />} />

                  {/* Business Modules */}
                  <Route element={<ProtectedRoute permission="manage_business" />}>
                    <Route path="clients" element={<ClientList />} />
                    <Route path="orders" element={<OrderListV2 />} />
                    <Route path="orders/:id" element={<OrderDetails />} />
                    <Route path="orders/new" element={<OrderFormV2 />} />
                    <Route path="agencies" element={<AgencyList />} />
                    <Route path="agencies/:id" element={<AgencyDetails />} />
                    <Route path="suppliers" element={<SupplierList />} />
                    <Route path="suppliers/:id/contracts" element={<SupplierContracts />} />
                    <Route path="offers" element={<OfferList />} />
                  </Route>

                  {/* Financial Modules */}
                  <Route element={<ProtectedRoute permission="manage_financials" />}>
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="reports/commissions" element={<CommissionReport />} />
                    <Route path="reports/revenue" element={<RevenueReport />} />
                    <Route path="expenses" element={<ExpenseList />} />
                    <Route path="guide-expenses" element={<GuideExpenseList />} />
                  </Route>

                  {/* Agency Management */}
                  <Route element={<ProtectedRoute permission="manage_business" />}>
                    <Route path="annexes" element={<div className="text-gray-500">Annexes</div>} />
                    <Route path="agency-details" element={<AgencyList />} />
                    <Route path="discounts" element={<DiscountList />} />
                    <Route path="tax" element={<TaxList />} />
                    <Route path="users" element={<UserList />} />
                    <Route path="logs" element={<LogsPage />} />
                    <Route path="support" element={<div className="text-gray-500">Support & Videos</div>} />
                    <Route path="payments" element={<PaymentList />} />
                    <Route path="stats" element={<div className="text-gray-500">Statistiques</div>} />
                    <Route path="rooming-list" element={<RoomingList />} />
                    <Route path="cash-register" element={<CaissePage />} />
                  </Route>
                </Route>
              </Routes>
            </ExchangeRateProvider>
          </DataProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
