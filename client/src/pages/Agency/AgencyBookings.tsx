import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI } from '../../services/api';
import type { Order } from '../../types';
import { Search, Filter, Calendar } from 'lucide-react';

const AgencyBookings = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchBookings();
    }, [page, statusFilter]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const params: any = {
                page,
                limit: 20
            };

            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }

            const response = await ordersAPI.getAll(params);
            setOrders(response.data || []);
            setTotalPages(response.pagination?.totalPages || 1);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const orderAgencyId = order.agencyId || (order as any).agency_id;
        if (user?.agencyId && orderAgencyId !== user.agencyId) return false;
        
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            order.reference?.toLowerCase().includes(search) ||
            order.clientName?.toLowerCase().includes(search) ||
            order.offerTitle?.toLowerCase().includes(search)
        );
    });

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'pending':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'completed':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'cancelled':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    return (
        <div className="flex-1 bg-background-light dark:bg-background-dark p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                        {t('agency_dashboard.bookings.title')}
                    </h1>

                    {/* Filters and Search */}
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder={t('common.search') + ' (référence, client, forfait...)'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="h-11 pl-10 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary"
                            >
                                <option value="all">{t('agency_dashboard.all_statuses')}</option>
                                <option value="pending">{t('agency_dashboard.status_pending')}</option>
                                <option value="confirmed">{t('agency_dashboard.status_confirmed')}</option>
                                <option value="completed">{t('agency_dashboard.status_completed')}</option>
                                <option value="cancelled">{t('agency_dashboard.status_cancelled')}</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Summary */}
                <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                    {filteredOrders.length} {t('agency_dashboard.results_found')}
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                            <p>Chargement des réservations...</p>
                        </div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                            <Calendar size={48} className="mb-4" />
                            <p className="text-lg font-medium">{t('agency_dashboard.no_bookings_found')}</p>
                            <p className="text-sm mt-2">
                                {searchTerm ? t('agency_dashboard.search_no_results') : t('agency_dashboard.no_bookings_desc')}
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Table */
                    <>
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-medium">
                                        <tr>
                                            <th className="p-4">{t('agency_dashboard.bookings.ref')}</th>
                                            <th className="p-4">{t('agency_dashboard.bookings.client')}</th>
                                            <th className="p-4">{t('agency_dashboard.bookings.package')}</th>
                                            <th className="p-4">{t('agency_dashboard.total_price')}</th>
                                            <th className="p-4">{t('agency_dashboard.bookings.status')}</th>
                                            <th className="p-4">{t('agency_dashboard.bookings.date')}</th>
                                            <th className="p-4 text-end">{t('agency_dashboard.bookings.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="p-4 font-bold text-slate-900 dark:text-white">
                                                    #{order.reference || 'N/A'}
                                                </td>
                                                <td className="p-4 text-slate-700 dark:text-slate-300">
                                                    {order.clientName || 'N/A'}
                                                </td>
                                                <td className="p-4 text-slate-700 dark:text-slate-300">
                                                    {order.offerTitle || 'N/A'}
                                                </td>
                                                <td className="p-4 font-semibold text-slate-900 dark:text-white">
                                                    {order.totalPrice?.toLocaleString('fr-FR')} DA
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                                        {order.status === 'Payé' ? t('common.status_paid') :
                                                         order.status === 'Non payé' ? t('common.status_unpaid') :
                                                         order.status === 'Paiement partiel' ? t('common.status_partial') :
                                                         order.status === 'Remboursé' ? t('common.status_refunded') :
                                                         order.status === 'Annulé' ? t('common.status_cancelled') :
                                                         order.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-500">
                                                    {formatDate(order.createdAt)}
                                                </td>
                                                <td className="p-4 text-end">
                                                    <button
                                                        onClick={() => navigate(`/agency/bookings/${order.id}`)}
                                                        className="text-primary hover:text-blue-700 font-medium text-sm transition-colors"
                                                    >
                                                        {t('agency_dashboard.bookings.view')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex justify-center items-center gap-4">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    {t('agency_dashboard.previous')}
                                </button>
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    {t('agency_dashboard.page_info', { page, total: totalPages })}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    {t('agency_dashboard.next')}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AgencyBookings;
