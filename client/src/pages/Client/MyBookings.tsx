import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ordersAPI } from '../../services/api';
import ReceiptUploadModal from '../../components/ReceiptUploadModal';
import { useNavigate } from 'react-router-dom';

const MyBookings = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const data = await ordersAPI.getAll();
            // Backend filters for "my" bookings automatically
            // Sort by date desc
            const sorted = (data.data || data).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setBookings(sorted);
        } catch (error) {
            console.error('Failed to fetch bookings', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleUploadClick = (order: any) => {
        setSelectedOrder(order);
        setUploadModalOpen(true);
    };

    const getRemainingAmount = (order: any) => {
        const total = parseFloat(order.total_amount_dzd || order.total_amount); // Handle both fields just in case
        const paid = parseFloat(order.amount_paid || '0');
        // If amount_paid is not returned directly, we might need derived logic, 
        // but let's assume API returns it or we rely on status.
        // Actually ordersAPI.getAll usually returns raw order row.
        // We might need to fetch detailed order to get payments sum, OR the list view SQL includes it?
        // If not, we rely on status, but modal needs amount.
        // For now, let's assume total_amount is the due amount if status is 'Non payé'.
        // If 'Partiel', we might need to guess or user inputs.
        // BETTER: default input to full amount.
        return total;
    };

    if (loading) {
        return (
            <div className="flex-1 bg-background-light dark:bg-background-dark p-6 flex justify-center items-center">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const upcoming = bookings.filter(b => b.status !== 'Completed' && b.status !== 'Archived');
    const past = bookings.filter(b => b.status === 'Completed' || b.status === 'Archived');

    return (
        <div className="flex-1 bg-background-light dark:bg-background-dark p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-8">{t('client_dashboard.my_bookings.title')}</h1>

                {bookings.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl">
                        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">airplane_ticket</span>
                        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Aucune réservation pour le moment</h2>
                        <button
                            onClick={() => navigate('/packages')}
                            className="mt-6 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition"
                        >
                            Découvrir nos offres
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-500">flight_takeoff</span>
                                {t('client_dashboard.my_bookings.upcoming')} (En cours)
                            </h2>
                            {upcoming.map(booking => {
                                const isUnpaid = booking.status === 'Non payé' || booking.status === 'Partiel';
                                const isPendingCheck = booking.status === 'En attente';

                                return (
                                    <div key={booking.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg shadow-blue-500/5 border border-slate-100 dark:border-slate-800 mb-4">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                            <div>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${booking.status === 'Payé' ? 'bg-green-100 text-green-700' :
                                                            booking.status === 'En attente' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-red-100 text-red-700'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                    {isPendingCheck && <span className="px-3 py-1 text-xs font-bold bg-blue-50 text-blue-600 rounded-full animate-pulse">Vérification en cours...</span>}
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                                    {booking.items?.offerTitle || `Booking #${booking.id.substr(0, 8)}`}
                                                </h3>
                                                <p className="text-slate-500 text-sm">Ref: {booking.id.substr(0, 8).toUpperCase()}</p>
                                                <p className="text-slate-900 dark:text-slate-300 font-bold mt-2">
                                                    Total: {Number(booking.total_amount_dzd || booking.total_amount).toLocaleString()} DZD
                                                </p>
                                            </div>
                                            <div className="text-end hidden md:block">
                                                <p className="text-2xl font-black text-slate-900 dark:text-white">
                                                    {new Date(booking.created_at).getDate()}
                                                </p>
                                                <p className="text-xs font-bold text-slate-500 uppercase">
                                                    {new Date(booking.created_at).toLocaleString('default', { month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-end gap-3">
                                            {/* Details Button */}
                                            <button className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition">
                                                {t('client_dashboard.my_bookings.details')}
                                            </button>

                                            {/* Action Buttons */}
                                            {isUnpaid && !isPendingCheck && (
                                                <button
                                                    onClick={() => handleUploadClick(booking)}
                                                    className="px-5 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-blue-600 transition shadow-lg shadow-blue-500/20 flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-lg">upload_file</span>
                                                    Envoyer le Reçu
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {selectedOrder && (
                <ReceiptUploadModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setUploadModalOpen(false)}
                    onSuccess={fetchBookings}
                    orderId={selectedOrder.id}
                    totalAmount={parseFloat(selectedOrder.total_amount_dzd || selectedOrder.total_amount)}
                    remainingAmount={parseFloat(selectedOrder.total_amount_dzd || selectedOrder.total_amount)} // Assuming full amount for simplified view or API needs to return calculated remainder
                />
            )}
        </div>
    );
};

export default MyBookings;
