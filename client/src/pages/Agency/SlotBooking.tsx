import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { packagesAPI } from '../../services/api';
import type { Offer } from '../../types';
import { Calendar, Users, Clock, Package, TrendingUp } from 'lucide-react';

const SlotBooking = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [packages, setPackages] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        fetchPackages();
    }, [filter]);

    const fetchPackages = async () => {
        try {
            setLoading(true);
            const params: any = {};

            if (filter !== 'all') {
                params.type = filter;
            }

            const response = await packagesAPI.getAll(params);
            setPackages(response || []);
        } catch (error) {
            console.error('Error fetching packages:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateAvailableSlots = (pkg: Offer) => {
        const capacity = pkg.capacity || 0;
        const booked = pkg.bookedCount || 0;
        return Math.max(0, capacity - booked);
    };

    const getAvailabilityColor = (available: number) => {
        if (available === 0) return 'text-red-600 dark:text-red-400';
        if (available < 10) return 'text-orange-600 dark:text-orange-400';
        return 'text-green-600 dark:text-green-400';
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatPrice = (price: number) => {
        return price?.toLocaleString('fr-FR') + ' DA' || 'N/A';
    };

    const handleBooking = (packageId: string) => {
        navigate(`/book/${packageId}`);
    };

    return (
        <div className="flex-1 bg-background-light dark:bg-background-dark p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {t('agency_dashboard.slots.title')}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Créneaux disponibles pour vos clients
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-6 flex gap-3">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                            ? 'bg-primary text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        Tous
                    </button>
                    <button
                        onClick={() => setFilter('hajj')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'hajj'
                            ? 'bg-primary text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        Hajj
                    </button>
                    <button
                        onClick={() => setFilter('omrah')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'omrah'
                            ? 'bg-primary text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        Omrah
                    </button>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-pulse">
                                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                ) : packages.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                            <Package size={48} className="mb-4" />
                            <p className="text-lg font-medium">Aucun forfait disponible</p>
                            <p className="text-sm mt-2">Il n'y a actuellement aucun forfait pour cette catégorie</p>
                        </div>
                    </div>
                ) : (
                    /* Package Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {packages.map((pkg) => {
                            const availableSlots = calculateAvailableSlots(pkg);
                            const isSoldOut = availableSlots === 0;

                            return (
                                <div
                                    key={pkg.id}
                                    className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border ${isSoldOut
                                        ? 'border-gray-300 dark:border-gray-700 opacity-75'
                                        : 'border-slate-200 dark:border-slate-800'
                                        } p-6 flex flex-col transition-all hover:shadow-md`}
                                >
                                    {/* Package Type Badge */}
                                    <div className="mb-3">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full uppercase">
                                            <Package size={12} />
                                            {pkg.type || 'N/A'}
                                        </span>
                                    </div>

                                    {/* Package Name */}
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                        {pkg.title || 'Sans titre'}
                                    </h3>

                                    {/* Dates */}
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-4">
                                        <Calendar size={16} />
                                        <span>
                                            {formatDate(pkg.start_date)} - {formatDate(pkg.end_date)}
                                        </span>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                                                <Users size={14} />
                                                <span>Capacité</span>
                                            </div>
                                            <p className="text-lg font-bold text-slate-900 dark:text-white">
                                                {pkg.capacity || 0}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                                                <TrendingUp size={14} />
                                                <span>Disponible</span>
                                            </div>
                                            <p className={`text-lg font-bold ${getAvailabilityColor(availableSlots)}`}>
                                                {availableSlots}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Duration */}
                                    {pkg.duration && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm mb-4">
                                            <Clock size={16} />
                                            <span>{pkg.duration} jours</span>
                                        </div>
                                    )}

                                    {/* Price & Booking */}
                                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Prix</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-white">
                                                {formatPrice(pkg.price_per_person)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Book Button */}
                                    <button
                                        onClick={() => handleBooking(pkg.id)}
                                        disabled={isSoldOut}
                                        className={`w-full mt-4 h-10 font-bold rounded-lg transition ${isSoldOut
                                            ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                            : 'bg-primary hover:bg-blue-600 text-white'
                                            }`}
                                    >
                                        {isSoldOut ? 'Complet' : t('agency_dashboard.slots.book')}
                                    </button>

                                    {/* Low Stock Warning */}
                                    {!isSoldOut && availableSlots < 10 && (
                                        <p className="text-xs text-orange-600 dark:text-orange-400 text-center mt-2 font-medium">
                                            ⚠️ Seulement {availableSlots} places restantes!
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SlotBooking;
