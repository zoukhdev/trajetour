import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { LanguageProvider } from './context/LanguageContext';
import MainLayout from './layouts/MainLayout';
import PublicLayout from './layouts/PublicLayout';
// import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientList from './pages/Clients/ClientList';
import AgencyList from './pages/Agencies/AgencyList';
import OrderList from './pages/Orders/OrderList';
import OrderForm from './pages/Orders/OrderForm';
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
import PaymentReports from './pages/Reports/PaymentReports';
import SupplierContracts from './pages/Suppliers/SupplierContracts';
import LogsPage from './pages/Logs/LogsPage';
import { OfflineProvider } from './context/OfflineContext';
import AgencyRegistrations from './pages/Master/AgencyRegistrations';

// Public Pages
import Home from './pages/Public/Home';
import About from './pages/Public/About';
import Packages from './pages/Public/Packages';
import Reviews from './pages/Public/Reviews';
import Contact from './pages/Public/Contact';
import ClientLogin from './pages/Auth/ClientLogin';
import { ForgotPassword } from './pages/Auth/ForgotPassword';
import { ResetPassword } from './pages/Auth/ResetPassword';
import ClientSignup from './pages/Auth/ClientSignup';
import AgencySignup from './pages/Auth/AgencySignup';
import ClientDashboard from './pages/Client/ClientDashboard';
import AgencyDashboard from './pages/Agency/AgencyDashboard';
import AgencyHome from './pages/Public/AgencyHome';
import AgencyBookings from './pages/Agency/AgencyBookings';
import AgencyPayments from './pages/Agency/AgencyPayments';
import SlotBooking from './pages/Agency/SlotBooking';
import Notifications from './pages/Agency/Notifications';
import DocumentReminders from './pages/Agency/DocumentReminders';
import NewBooking from './pages/Agency/NewBooking';
import MyBookings from './pages/Client/MyBookings';
import FAQ from './pages/Public/FAQ';
import BookingWizard from './pages/Public/Booking/BookingWizard';
import AgencyLayout from './layouts/AgencyLayout';
import ClientLayout from './layouts/ClientLayout';
import DemoAgencyDashboard from './pages/Agency/DemoAgencyDashboard';

// Detect if we are on an agency subdomain
const hostname = window.location.hostname;
const parts = hostname.split('.');
let isAgencyDomain = false;
if (hostname.includes('.trajetour.com') && parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'api') {
  isAgencyDomain = true;
} else if (hostname.includes('localhost') && parts.length > 1 && parts[0] !== 'www') {
  isAgencyDomain = true;
}

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <DataProvider>
            <ExchangeRateProvider>
              <OfflineProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={isAgencyDomain ? <AgencyHome /> : <Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/packages" element={<Packages />} />
                    <Route path="/packages/:type" element={<Packages />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/reviews" element={<Reviews />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/book/:id" element={<BookingWizard />} />

                    {/* Unified Auth Routes */}
                    <Route path="/login" element={<ClientLogin />} />
                    <Route path="/login/agency" element={<ClientLogin />} />
                    <Route path="/register" element={<ClientSignup />} />
                    <Route path="/register/agency" element={<AgencySignup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/agency-signup" element={<AgencySignup />} />
                  </Route>

                  {/* Demo route - standalone, no public nav */}
                  <Route path="/demo" element={<DemoAgencyDashboard />} />

                  {/* Admin/Staff Dashboard Routes */}
                  <Route path="/dashboard" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                    <Route index element={<Dashboard />} />

                    {/* Business Modules - Admin/Staff Only */}
                    <Route element={<ProtectedRoute permission="manage_business" />}>
                      <Route path="clients" element={<ClientList />} />
                      <Route path="orders" element={<OrderList />} />
                      <Route path="orders/:id" element={<OrderDetails />} />
                      <Route path="orders/new" element={<OrderForm />} />
                      <Route path="agencies" element={<AgencyList />} />
                      <Route path="agencies/:id" element={<AgencyDetails />} />
                      <Route path="suppliers" element={<SupplierList />} />
                      <Route path="suppliers/:id/contracts" element={<SupplierContracts />} />
                      <Route path="offers" element={<OfferList />} />
                    </Route>

                    {/* Financial Modules - Admin Only */}
                    <Route element={<ProtectedRoute permission="manage_financials" />}>
                      <Route path="reports" element={<ReportsPage />} />
                      <Route path="reports/commissions" element={<CommissionReport />} />
                      <Route path="reports/revenue" element={<RevenueReport />} />
                      <Route path="expenses" element={<ExpenseList />} />
                      <Route path="guide-expenses" element={<GuideExpenseList />} />
                    </Route>

                    {/* Agency Management - Admin Only */}
                    <Route element={<ProtectedRoute permission="manage_business" />}>
                      <Route path="annexes" element={<div className="text-gray-500">Annexes</div>} />
                      <Route path="agency-details" element={<AgencyList />} />
                      <Route path="discounts" element={<DiscountList />} />
                      <Route path="tax" element={<TaxList />} />
                    </Route>

                    {/* Users & Logs - Admin Only */}
                    <Route element={<ProtectedRoute permission="manage_users" />}>
                      <Route path="users" element={<UserList />} />
                      <Route path="logs" element={<LogsPage />} />
                      <Route path="master-agencies" element={<AgencyRegistrations />} />
                    </Route>

                    {/* Other Admin Tools */}
                    <Route element={<ProtectedRoute permission="manage_business" />}>
                      <Route path="support" element={<div className="text-gray-500">Support & Videos</div>} />
                      <Route path="payments" element={<PaymentList />} />
                      <Route path="payments/reports" element={<PaymentReports />} />
                      <Route path="stats" element={<div className="text-gray-500">Statistiques</div>} />
                      <Route path="rooming-list" element={<RoomingList />} />
                      <Route path="cash-register" element={<CaissePage />} />
                    </Route>
                  </Route>

                  {/* Agency Dashboard Routes */}
                  <Route path="/agency" element={<ProtectedRoute><AgencyLayout /></ProtectedRoute>}>
                    <Route index element={<AgencyDashboard />} />
                    <Route path="bookings" element={<ProtectedRoute permission="access_orders"><AgencyBookings /></ProtectedRoute>} />
                    <Route path="payments" element={<ProtectedRoute permission="access_cash_register"><AgencyPayments /></ProtectedRoute>} />
                    <Route path="slots" element={<ProtectedRoute permission="access_orders"><SlotBooking /></ProtectedRoute>} />
                    <Route path="bookmarks" element={<div className="text-gray-500">Bookmarks</div>} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="documents" element={<DocumentReminders />} />
                    <Route path="new-booking" element={<NewBooking />} />
                    <Route path="bookings/:id" element={<OrderDetails />} />
                    <Route path="landing" element={<AgencyHome />} />

                    {/* Operational Modules Migrated to Agency */}
                    <Route path="clients" element={<ProtectedRoute permission="access_clients"><ClientList /></ProtectedRoute>} />
                    <Route path="offers" element={<ProtectedRoute permission="access_offers"><OfferList /></ProtectedRoute>} />
                    <Route path="suppliers" element={<ProtectedRoute permission="access_suppliers"><SupplierList /></ProtectedRoute>} />
                    <Route path="suppliers/:id/contracts" element={<ProtectedRoute permission="access_suppliers"><SupplierContracts /></ProtectedRoute>} />
                    <Route path="cash-register" element={<ProtectedRoute permission="access_cash_register"><CaissePage /></ProtectedRoute>} />
                    <Route path="expenses" element={<ProtectedRoute permission="access_expenses"><ExpenseList /></ProtectedRoute>} />
                    <Route path="guide-expenses" element={<ProtectedRoute permission="access_expenses"><GuideExpenseList /></ProtectedRoute>} />
                    <Route path="reports" element={<ProtectedRoute permission="access_reports"><ReportsPage /></ProtectedRoute>} />
                    <Route path="reports/commissions" element={<ProtectedRoute permission="access_reports"><CommissionReport /></ProtectedRoute>} />
                    <Route path="reports/revenue" element={<ProtectedRoute permission="access_reports"><RevenueReport /></ProtectedRoute>} />
                    <Route path="discounts" element={<ProtectedRoute permission="access_discounts"><DiscountList /></ProtectedRoute>} />
                    <Route path="tax" element={<ProtectedRoute permission="access_discounts"><TaxList /></ProtectedRoute>} />
                    <Route path="rooming-list" element={<ProtectedRoute permission="access_rooming_list"><RoomingList /></ProtectedRoute>} />
                    <Route path="users" element={<ProtectedRoute permission="access_users"><UserList /></ProtectedRoute>} />
                  </Route>

                  {/* Client Dashboard Routes */}
                  <Route path="/client" element={<ProtectedRoute role="client"><ClientLayout /></ProtectedRoute>}>
                    <Route index element={<ClientDashboard />} />
                    <Route path="bookings" element={<MyBookings />} />
                  </Route>

                  {/* Redirect Legacy Root to Dashboard if Logged In? Or Public? 
                      Decided: Root is Public. Login redirects to Dashboard. 
                  */}

                </Routes>
              </OfflineProvider>
            </ExchangeRateProvider>
          </DataProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
