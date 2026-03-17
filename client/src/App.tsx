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
import MasterAgencyList from './pages/Master/MasterAgencyList';

// Public Pages
import Home from './pages/Public/Home';
import About from './pages/Public/About';
import Packages from './pages/Public/Packages';
import Reviews from './pages/Public/Reviews';
import Contact from './pages/Public/Contact';
import ClientLogin from './pages/Auth/ClientLogin';
import AgencyLogin from './pages/Auth/AgencyLogin';
import ClientSignup from './pages/Auth/ClientSignup';
import AgencySignup from './pages/Auth/AgencySignup';
import ClientDashboard from './pages/Client/ClientDashboard';
import AgencyDashboard from './pages/Agency/AgencyDashboard';
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
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/packages" element={<Packages />} />
                    <Route path="/packages/:type" element={<Packages />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/reviews" element={<Reviews />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/book/:id" element={<BookingWizard />} />

                    {/* Auth Routes */}
                    <Route path="/login" element={<ClientLogin />} />
                    <Route path="/login/agency" element={<AgencyLogin />} />
                    <Route path="/register" element={<ClientSignup />} />
                    <Route path="/register/agency" element={<AgencySignup />} />
                    <Route path="/agency-signup" element={<AgencySignup />} />
                  </Route>

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
                      <Route path="master-agencies" element={<MasterAgencyList />} />
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
                  <Route path="/agency" element={<ProtectedRoute role="agent"><AgencyLayout /></ProtectedRoute>}>
                    <Route index element={<AgencyDashboard />} />
                    <Route path="bookings" element={<AgencyBookings />} />
                    <Route path="payments" element={<AgencyPayments />} />
                    <Route path="slots" element={<SlotBooking />} />
                    <Route path="bookmarks" element={<div className="text-gray-500">Bookmarks</div>} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="documents" element={<DocumentReminders />} />
                    <Route path="new-booking" element={<NewBooking />} />
                    <Route path="bookings/:id" element={<OrderDetails />} />
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
