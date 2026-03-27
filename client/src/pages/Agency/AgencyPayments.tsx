import { useState, useEffect } from 'react';
import { Search, Filter, Eye, Calendar } from 'lucide-react';
import Modal from '../../components/Modal';
import { paymentsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const AgencyPayments = () => {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [filters, setFilters] = useState({ status: '', clientName: '' });
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [viewingPayment, setViewingPayment] = useState<any | undefined>(undefined);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await paymentsAPI.getAll({
                page: pagination.page,
                limit: pagination.limit,
                status: filters.status === 'all' ? undefined : (filters.status || undefined),
                clientName: filters.clientName || undefined,
                agencyId: user?.agencyId || undefined
            });
            const data = Array.isArray(res.data) ? res.data : [];
            const filtered = user?.agencyId ? data.filter((p: any) => (p.agencyId || p.agency_id) === user.agencyId) : data;
            
            setPayments(filtered);
            setPagination(prev => ({ ...prev, ...res.pagination }));
        } catch (error) {
            console.error("Failed to fetch payments", error);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(prev => ({ ...prev, clientName: debouncedSearch }));
        }, 500);
        return () => clearTimeout(timer);
    }, [debouncedSearch]);

    // Fetch on changes
    useEffect(() => {
        fetchPayments();
    }, [pagination.page, filters.status, filters.clientName]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 font-display">{t('agency_dashboard.payments_title')}</h1>
                <button onClick={() => fetchPayments()} className="p-2 bg-gray-100 rounded hover:bg-gray-200">
                    {t('agency_dashboard.refresh')}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex gap-4 flex-wrap">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder={t('agency_dashboard.search_client')}
                            value={debouncedSearch}
                            onChange={(e) => setDebouncedSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                    <select
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none"
                        value={filters.status}
                        onChange={(e) => {
                            setFilters(prev => ({ ...prev, status: e.target.value }));
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                    >
                        <option value="">{t('agency_dashboard.all_statuses')}</option>
                        <option value="pending">{t('agency_dashboard.status_waiting_validation')}</option>
                        <option value="validated">{t('agency_dashboard.status_validated')}</option>
                        <option value="rejected">{t('agency_dashboard.status_rejected')}</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="px-6 py-4">{t('agency_dashboard.bookings.ref')}</th>
                                <th className="px-6 py-4">{t('agency_dashboard.bookings.date')}</th>
                                <th className="px-6 py-4">{t('agency_dashboard.client')}</th>
                                <th className="px-6 py-4">{t('common.amount')} (DZD)</th>
                                <th className="px-6 py-4">{t('agency_dashboard.mode')}</th>
                                <th className="px-6 py-4">{t('agency_dashboard.proof')}</th>
                                <th className="px-6 py-4">{t('agency_dashboard.bookings.status')}</th>
                                <th className="px-6 py-4 text-right">{t('agency_dashboard.bookings.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={8} className="p-8 text-center">{t('common.loading')}...</td></tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                                <Filter size={24} />
                                            </div>
                                            <p className="font-medium">{t('agency_dashboard.no_bookings_found')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm text-gray-600">
                                            #{payment.id.substr(0, 8)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                {new Date(payment.paymentDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-gray-900">{payment.clientName}</span>
                                            <span className="block text-xs text-gray-400">{payment.clientType}</span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-green-600">
                                            {Number(payment.amountDZD).toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                {payment.method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {payment.receiptUrl ? (
                                                <button onClick={() => setViewingPayment(payment)} className="text-blue-600 hover:underline flex items-center gap-1 text-xs">
                                                    <Eye size={12} /> {t('agency_dashboard.view')}
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic">{t('agency_dashboard.none')}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${(payment.isValidated === null || payment.isValidated === undefined)
                                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                                : payment.isValidated
                                                    ? 'bg-green-50 text-green-700 border-green-100'
                                                    : 'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                {(payment.isValidated === null || payment.isValidated === undefined) ? t('agency_dashboard.waiting') : payment.isValidated ? t('agency_dashboard.validated') : t('agency_dashboard.rejected')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setViewingPayment(payment)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Voir détails"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="flex justify-between items-center p-4 border-t border-gray-100">
                        <button
                            disabled={pagination.page <= 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >{t('agency_dashboard.previous')}</button>
                        <span className="text-sm text-gray-600">{t('agency_dashboard.page_info', { page: pagination.page, total: pagination.totalPages })}</span>
                        <button
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >{t('agency_dashboard.next')}</button>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={!!viewingPayment}
                onClose={() => setViewingPayment(undefined)}
                title={t('agency_dashboard.payment_details')}
            >
                {viewingPayment && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{t('agency_dashboard.payment_id')} #{viewingPayment.id.substr(0, 8)}</h3>
                                <p className="text-sm text-gray-500">{new Date(viewingPayment.paymentDate).toLocaleDateString()} {new Date(viewingPayment.paymentDate).toLocaleTimeString()}</p>
                            </div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                {Number(viewingPayment.amountDZD).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ', { style: 'currency', currency: 'DZD' })}
                            </span>
                        </div>

                        {/* Receipt Image */}
                        {viewingPayment.receiptUrl && (
                            <div className="bg-gray-100 p-2 rounded-lg border border-gray-200">
                                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">{t('agency_dashboard.proof_of_payment')}</p>
                                <a href={viewingPayment.receiptUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={viewingPayment.receiptUrl}
                                        alt="Reçu"
                                        className="w-full max-h-64 object-contain rounded bg-white"
                                    />
                                </a>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="block text-gray-500 mb-1">{t('agency_dashboard.client')}</span>
                                <span className="font-semibold text-gray-900">{viewingPayment.clientName}</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="block text-gray-500 mb-1">{t('agency_dashboard.order')}</span>
                                <span className="font-semibold text-gray-900">CMD-{viewingPayment.orderId ? viewingPayment.orderId.substr(0, 6) : 'N/A'}</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="block text-gray-500 mb-1">{t('agency_dashboard.payment_method')}</span>
                                <span className="font-semibold text-gray-900">{viewingPayment.method}</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="block text-gray-500 mb-1">{t('agency_dashboard.validation_status')}</span>
                                <span className={`font-semibold ${(viewingPayment.isValidated === null || viewingPayment.isValidated === undefined) ? 'text-orange-600' : viewingPayment.isValidated ? 'text-green-600' : 'text-red-600'}`}>
                                    {(viewingPayment.isValidated === null || viewingPayment.isValidated === undefined) ? t('agency_dashboard.validation_waiting') : viewingPayment.isValidated ? t('agency_dashboard.validated_by_admin') : t('agency_dashboard.rejected')}
                                </span>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                {t('agency_dashboard.payment_note')}
                            </p>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setViewingPayment(undefined)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                {t('agency_dashboard.close')}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AgencyPayments;
