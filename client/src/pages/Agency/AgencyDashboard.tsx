import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { agenciesAPI, ordersAPI } from '../../services/api';
import type { Agency, Order } from '../../types';
import SubscriptionStatus from '../../components/SubscriptionStatus';

const AgencyDashboard = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [agency, setAgency] = useState<Agency | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // 1. Fetch Agency Details if agencyId is available
                let agencyData: Agency | null = null;
                if (user?.agencyId) {
                    agencyData = await agenciesAPI.getById(user.agencyId);
                    setAgency(agencyData);
                }

                // 2. Fetch Agency Orders
                const ordersResponse = await ordersAPI.getAll(1, 100);
                const ordersData = ordersResponse.data || ordersResponse || [];
                setOrders(ordersData);

            } catch (err) {
                console.error('Failed to fetch agency dashboard data:', err);
                setError('Failed to load dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
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
                        className="mt-6 px-6 py-2 bg-primary text-white font-bold rounded-lg transition hover:bg-blue-600"
                    >
                        {t('common.retry') || 'Retry'}
                    </button>
                </div>
            </div>
        );
    }

    // Calculate Stats
    const activeBookings = orders.filter(o => o.status !== 'Payé').length;
    const totalCommission = orders.reduce((sum, o) => sum + (o.totalCommissionDZD || 0), 0);
    const recentOrders = orders.slice(0, 5);

    return (
        <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                            {t('agency_dashboard.welcome')}, {agency?.name || user?.username || user?.email?.split('@')[0]}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Trajetour Partner Portal • {agency?.type || 'Partenaire'}</p>
                    </div>
                    <Link
                        to="/agency/new-booking"
                        className="bg-primary hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-blue-500/20 transition flex items-center gap-2 w-fit"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        {t('agency_dashboard.new_booking')}
                    </Link>
                </div>

                {/* Subscription Status Banner */}
                <SubscriptionStatus />

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-slate-500 dark:text-slate-400 font-medium">{t('agency_dashboard.balance')}</div>
                            <div className="size-10 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">account_balance_wallet</span>
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{(agency?.currentCredit || 0).toLocaleString()} DA</div>
                        <div className="mt-2 text-sm text-slate-500 font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">info</span>
                            {agency?.subscription || 'Standard'} Plan
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-slate-500 dark:text-slate-400 font-medium">{t('agency_dashboard.active_bookings')}</div>
                            <div className="size-10 rounded-full bg-orange-50 dark:bg-slate-800 flex items-center justify-center text-orange-500">
                                <span className="material-symbols-outlined">airplane_ticket</span>
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{activeBookings}</div>
                        <div className="mt-2 text-sm text-slate-500 font-medium">Total bookings: {orders.length}</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-slate-500 dark:text-slate-400 font-medium">{t('agency_dashboard.commission')}</div>
                            <div className="size-10 rounded-full bg-green-50 dark:bg-slate-800 flex items-center justify-center text-green-500">
                                <span className="material-symbols-outlined">payments</span>
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{totalCommission.toLocaleString()} DA</div>
                        <div className="mt-2 text-sm text-green-500 font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">trending_up</span>
                            Lifetime earnings
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: 'agency_dashboard.quick_actions.book_slot', icon: 'flight', color: 'bg-blue-500', link: '/agency/slots' },
                        { title: 'agency_dashboard.quick_actions.manage_clients', icon: 'groups', color: 'bg-purple-500', link: '/agency/clients' },
                        { title: 'agency_dashboard.quick_actions.reports', icon: 'bar_chart', color: 'bg-indigo-500', link: '/agency/reports' }
                    ].map((action, i) => (
                        <Link
                            key={i}
                            to={action.link}
                            className="flex items-center gap-4 p-5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition group text-left"
                        >
                            <div className={`size-12 rounded-lg ${action.color} text-white flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform`}>
                                <span className="material-symbols-outlined">{action.icon}</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">{t(action.title)}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Click to access</p>
                            </div>
                            <span className="material-symbols-outlined text-slate-300 ml-auto group-hover:text-primary transition-colors rtl:rotate-180">arrow_forward</span>
                        </Link>
                    ))}
                </div>

                {/* Recent Bookings Table */}
                <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Agency Bookings</h3>
                        <Link to="/agency/bookings" className="text-sm font-bold text-primary hover:text-blue-700">{t('client_dashboard.view_all')}</Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('agency_dashboard.bookings.ref')}</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('agency_dashboard.bookings.client')}</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('agency_dashboard.bookings.package')}</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('agency_dashboard.bookings.status')}</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('agency_dashboard.bookings.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                                        <td className="p-4">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">#{order.reference || order.id.slice(0, 8)}</span>
                                            <p className="text-[10px] text-slate-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{order.clientName || 'N/A'}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{order.items[0]?.description || 'Package'}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-bold uppercase rounded px-2 py-1 inline-block ${order.status === 'Payé' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                order.status === 'Non payé' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <Link
                                                to={`/agency/bookings/${order.id}`}
                                                className="text-primary hover:text-blue-700"
                                            >
                                                <span className="material-symbols-outlined text-xl">visibility</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {recentOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-500 dark:text-slate-400 italic">
                                            {t('client_dashboard.no_activity')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgencyDashboard;
