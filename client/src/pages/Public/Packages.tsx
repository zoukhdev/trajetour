import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useState, useEffect } from 'react';
import { packagesAPI } from '../../services/api';

const Packages = () => {
    const { type } = useParams(); // 'hajj' or 'omrah'
    const [searchParams] = useSearchParams();
    const dateFilter = searchParams.get('date');
    const { t } = useLanguage();
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                setLoading(true);
                // Fetch all and filter client side to handle 'Haj'/'Hajj' mismatch easily
                const data = await packagesAPI.getAll();
                setPackages(data);
            } catch (err) {
                console.error("Failed to load packages", err);
                setError('Failed to load packages.');
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);

    const filteredPackages = packages.filter(p => {
        // 1. Filter by Type
        const apiType = p.type?.toLowerCase();
        let typeMatch = true;

        if (type) {
            const paramType = type.toLowerCase();
            if (paramType === 'hajj' && (apiType === 'haj' || apiType === 'hajj')) typeMatch = true;
            else if ((paramType === 'omrah' || paramType === 'omra') && (apiType === 'omrah' || apiType === 'omra')) typeMatch = true;
            else typeMatch = apiType === paramType;
        }

        if (!typeMatch) return false;

        // 2. Filter by Date (if present)
        if (dateFilter) {
            const pkgDate = new Date(p.startDate);
            const searchDate = new Date(dateFilter);
            // Ignore time components, compare dates only OR allow future dates
            if (pkgDate < searchDate) return false;
        }

        return true;
    });

    const pageTitle = type === 'hajj' ? t('public.nav.hajj') : type === 'omrah' ? t('public.nav.omrah') : t('public.packages.title');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="text-red-500 text-xl font-bold">{error}</div>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark py-16 px-4 md:px-10">
            <div className="max-w-[1440px] mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-[#0e141b] dark:text-white mb-4 tracking-tight drop-shadow-sm">{pageTitle}</h1>
                    <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">{t('public.packages.subtitle')}</p>
                </div>

                {filteredPackages.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-xl text-gray-500">No packages found for {type || 'this category'}.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPackages.map((pkg) => (
                            <div key={pkg.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all hover:-translate-y-1 group">
                                <div className="relative h-64 overflow-hidden">
                                    {/* Handle missing image by showing placeholder or random if not in DB */}
                                    <img
                                        src={pkg.image || `https://source.unsplash.com/800x600/?${pkg.type === 'Omra' ? 'mecca' : 'hajj'}`}
                                        alt={pkg.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1565552684305-7e8ce702e7b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'; // Fallback
                                        }}
                                    />
                                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-primary shadow-sm">
                                        {pkg.type}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-[#0e141b] dark:text-white line-clamp-2 leading-tight">{pkg.title}</h3>
                                        <div className="flex flex-col items-end">
                                            <span className="text-primary font-black text-lg">{pkg.price?.toLocaleString()} DA</span>
                                            <span className="text-xs text-gray-500">{t('public.packages.per_person')}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6 border-y border-gray-100 dark:border-gray-700 py-3">
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-lg">calendar_today</span>
                                            <span>
                                                {/* Calculate duration if present, or show dates */}
                                                {pkg.duration ? `${pkg.duration} ${t('public.packages.duration')}` :
                                                    (new Date(pkg.endDate).getTime() - new Date(pkg.startDate).getTime()) / (1000 * 60 * 60 * 24) + ` ${t('public.packages.duration')}`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-lg">location_on</span>
                                            <span className="truncate max-w-[100px]" title={pkg.destination || t('public.packages.makkah')}>{pkg.destination || t('public.packages.makkah')}</span>
                                        </div>
                                    </div>

                                    <ul className="mb-6 space-y-2">
                                        {/* Handle inclusions object to list */}
                                        {pkg.inclusions && Object.entries(pkg.inclusions).map(([key, val]) => (
                                            val && (
                                                <li key={key} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 capitalize">
                                                    <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                                    {key}
                                                </li>
                                            )
                                        ))}
                                        {!pkg.inclusions && pkg.features?.map((feature: string, i: number) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link to={`/book/${pkg.id}`} className="w-full h-12 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                                        <span>{t('public.packages.view_details')}</span>
                                        <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Packages;
