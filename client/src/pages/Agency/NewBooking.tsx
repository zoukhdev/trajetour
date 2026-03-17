import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { offersAPI } from '../../services/api';
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react';

const NewBooking = () => {
    const { t } = useLanguage();
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                setLoading(true);
                const data = await offersAPI.getAll();
                setPackages(data);
            } catch (err) {
                console.error("Failed to load packages", err);
                setError('Failed to load available packages.');
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Loading packages...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 p-8">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                    <span className="material-symbols-outlined">error</span>
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-[#0f172a]">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {t('agency_dashboard.new_booking')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Select a package to start a new booking for your client.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map((pkg) => (
                        <div key={pkg.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group">
                            <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-700">
                                {pkg.image ? (
                                    <img
                                        src={pkg.image}
                                        alt={pkg.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <span className="material-symbols-outlined text-4xl">image</span>
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm border border-primary/10">
                                    {pkg.type}
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">{pkg.title}</h3>
                                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                        <MapPin size={14} />
                                        <span>{pkg.destination || 'Makkah & Madinah'}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <Calendar size={16} className="text-primary" />
                                            <span>Duration</span>
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-white">{pkg.duration || 15} Days</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <Users size={16} className="text-primary" />
                                            <span>Availability</span>
                                        </div>
                                        <span className={`font-medium ${(pkg.disponibilite || 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {pkg.disponibilite || 0} seats left
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500 uppercase tracking-wide">Start from</span>
                                        <span className="text-xl font-black text-primary">
                                            {pkg.price?.toLocaleString()} <span className="text-sm font-normal">DZD</span>
                                        </span>
                                    </div>

                                    <Link
                                        to={`/book/${pkg.id}`}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
                                    >
                                        Book Now
                                        <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NewBooking;
