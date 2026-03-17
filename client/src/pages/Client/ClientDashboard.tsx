import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI } from '../../services/api';
import type { Order } from '../../types';

const ClientDashboard = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await ordersAPI.getAll();
                // If the response is paginated { data: [], pagination: {} }
                setOrders(response.data || response || []);
            } catch (err) {
                console.error('Failed to fetch orders:', err);
                setError('Failed to load your bookings. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchOrders();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">{t('common.loading') || 'Loading...'}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark p-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-red-100 dark:border-red-900/30 text-center max-w-md">
                    <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{error}</h2>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-blue-600 transition"
                    >
                        {t('common.retry') || 'Retry'}
                    </button>
                </div>
            </div>
        );
    }

    // Get most recent/active order
    const activeOrder = orders.find(o => o.status !== 'Payé') || orders[0];
    const recentOrders = orders.slice(0, 5);

    // Calculate Payment Stats for Active Order
    const totalPaid = activeOrder?.payments?.reduce((sum, p) => sum + (p.amountDZD || p.amount), 0) || 0;
    const totalCost = activeOrder?.totalAmountDZD || activeOrder?.totalAmount || 0;
    const paymentPercentage = totalCost > 0 ? Math.min(Math.round((totalPaid / totalCost) * 100), 100) : 0;
    const remainingBalance = totalCost - totalPaid;

    return (
        <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-8">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                {/* Welcome Section */}
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black tracking-tight">
                            {t('client_dashboard.welcome')}, {user?.username || user?.email?.split('@')[0]}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400">
                            <span className="material-symbols-outlined text-primary">calendar_month</span>
                            <p className="text-base font-medium">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">{t('client_dashboard.journey_status')}</p>
                    </div>
                    <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-bold text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                        <span className="material-symbols-outlined text-[20px] rtl:ml-2">support_agent</span>
                        {t('client_dashboard.contact_guide')}
                    </button>
                </div>

                {!activeOrder ? (
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
                        <div className="size-20 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl">travel_explore</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('client_dashboard.no_bookings_title') || 'No Bookings Yet'}</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">{t('client_dashboard.no_bookings_desc') || "You haven't booked any packages yet. Start your spiritual journey today!"}</p>
                        <Link
                            to="/packages"
                            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
                        >
                            {t('public.nav.book_now')}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 flex flex-col gap-6">
                            {/* Hero / Active Booking Card */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="relative h-48 w-full">
                                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=1000")' }}></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                    <div className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4 text-white">
                                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-green-500/90 backdrop-blur-sm text-xs font-bold mb-2">
                                            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                                            {activeOrder.status}
                                        </div>
                                        <h3 className="text-2xl font-bold">{activeOrder.items[0]?.description || 'Hajj/Omrah Package'}</h3>
                                        <p className="text-white/80 text-sm">{t('client_dashboard.ref')} #{activeOrder.reference || activeOrder.id.slice(0, 8)}</p>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {/* Progress Stepper */}
                                    <div className="flex items-center justify-between mb-8 relative">
                                        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -z-10 -translate-y-1/2 rounded-full"></div>
                                        <div className="absolute top-1/2 left-0 dir-ltr:w-3/4 rtl:w-3/4 rtl:right-0 h-1 bg-primary -z-10 -translate-y-1/2 rounded-full"></div>

                                        {[t('client_dashboard.booked'), t('client_dashboard.visa'), t('client_dashboard.flights'), t('client_dashboard.hotels')].map((step, i) => (
                                            <div key={step} className="flex flex-col items-center gap-2">
                                                <div className={`size-8 rounded-full ${i < 3 ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 border-2 border-primary text-primary'} flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-slate-900`}>
                                                    <span className="material-symbols-outlined text-sm">{i < 3 ? 'check' : i === 2 ? 'flight' : 'hotel'}</span>
                                                </div>
                                                <span className={`text-xs font-bold ${i < 3 ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{step}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-md shadow-sm text-slate-700 dark:text-slate-200">
                                                <span className="material-symbols-outlined text-xl">flight_takeoff</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('client_dashboard.outbound')}</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">SV-123 • Saudia</p>
                                                <p className="text-xs text-slate-500 mt-1">Confirmed</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-md shadow-sm text-slate-700 dark:text-slate-200">
                                                <span className="material-symbols-outlined text-xl">hotel</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('client_dashboard.accommodation')}</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{activeOrder.hotels[0]?.name || 'Premium Hotel'}</p>
                                                <p className="text-xs text-slate-500 mt-1">5 Star • Makkah</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex gap-3">
                                        <button className="flex-1 bg-primary text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-600 transition text-sm">{t('client_dashboard.view_itinerary')}</button>
                                        <button className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm">{t('client_dashboard.download_tickets')}</button>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity List */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('client_dashboard.recent_activity')}</h3>
                                    <Link to="/client/bookings" className="text-sm font-bold text-primary hover:text-blue-700">{t('client_dashboard.view_all')}</Link>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {recentOrders.map((order) => (
                                        <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-blue-50 dark:bg-slate-800 rounded-lg text-primary">
                                                    <span className="material-symbols-outlined">shopping_bag</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{order.items[0]?.description || 'Package Booking'}</p>
                                                    <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{(order.totalAmountDZD || order.totalAmount).toLocaleString()} DA</p>
                                                <p className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 inline-block mt-1 ${order.status === 'Payé' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    order.status === 'Non payé' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                    }`}>
                                                    {order.status}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {recentOrders.length === 0 && (
                                        <div className="p-12 text-center text-slate-500 dark:text-slate-400 italic">
                                            {t('client_dashboard.no_activity')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar / Widgets */}
                        <div className="flex flex-col gap-6">
                            {/* Payment Widget */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('client_dashboard.payment_status')}</h3>
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm text-slate-500">{t('client_dashboard.total_cost')}</span>
                                        <span className="text-base font-bold text-slate-900 dark:text-white">{totalCost.toLocaleString()} DA</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-primary h-2.5 rounded-full transition-all duration-1000"
                                            style={{ width: `${paymentPercentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">{t('client_dashboard.paid')}: <span className="text-slate-900 dark:text-white font-medium">{totalPaid.toLocaleString()} DA</span></span>
                                        <span className={remainingBalance > 0 ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>
                                            {remainingBalance > 0 ? `${t('client_dashboard.due')}: ${remainingBalance.toLocaleString()} DA` : t('common.paid')}
                                        </span>
                                    </div>
                                    {remainingBalance > 0 && (
                                        <button className="w-full mt-2 bg-slate-900 dark:bg-slate-700 text-white font-bold py-3 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition shadow-sm flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined text-lg rtl:ml-2">credit_card</span>
                                            {t('client_dashboard.pay_balance')}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { k: 'visa', i: 'description' },
                                    { k: 'guide_pdf', i: 'menu_book' },
                                    { k: 'voucher', i: 'confirmation_number' },
                                    { k: 'profile', i: 'person' }
                                ].map(item => (
                                    <button key={item.k} className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-md hover:border-primary/50 transition group">
                                        <div className="p-2 bg-blue-50 dark:bg-slate-800 rounded-full text-primary group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined">{item.i}</span>
                                        </div>
                                        <span className="text-xs font-bold text-center text-slate-700 dark:text-slate-200">{t(`client_dashboard.quick_actions.${item.k}`)}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Event Timeline Widget */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{t('client_dashboard.upcoming_events')}</h3>
                                <div className="flex flex-col gap-6">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="size-3 rounded-full bg-primary ring-4 ring-blue-50 dark:ring-blue-900/30"></div>
                                            <div className="w-0.5 flex-1 bg-slate-100 dark:bg-slate-800 my-1"></div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-primary uppercase">{t('client_dashboard.visa_deadline') || 'Visa Deadline'}</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">Submit Passport Photos</p>
                                            <p className="text-[10px] text-slate-500 mt-1">Due in 3 days</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="size-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">{t('client_dashboard.orientation') || 'Orientation'}</p>
                                            <p className="text-sm font-bold text-slate-500 mt-1">Pre-departure Briefing</p>
                                            <p className="text-[10px] text-slate-400 mt-1">Group Meeting</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientDashboard;
