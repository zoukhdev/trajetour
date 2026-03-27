import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import ExchangeRateManager from '../components/ExchangeRateManager';
import { TrendingUp, Calendar } from 'lucide-react';

const Dashboard = () => {
    const { t } = useLanguage();
    const { user } = useAuth();

    return (
        <div className="space-y-6 overflow-x-hidden w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-display">{t('master_dashboard.backoffice_title')}</h1>
                    <p className="text-gray-500 text-sm mt-1">{t('master_dashboard.backoffice_subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                    <Calendar size={16} className="text-primary" />
                    <span className="font-medium">
                        {new Date().toLocaleDateString(t('common.lang') === 'ar' ? 'ar-SA' : 'fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                    <TrendingUp size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('master_dashboard.control_center_title')}</h2>
                <p className="text-gray-500 max-w-md">
                    {t('master_dashboard.control_center_desc')}
                </p>
            </div>

            {/* Exchange Rate Management - Admin Only */}
            {user?.role === 'admin' && (
                <ExchangeRateManager />
            )}
        </div>
    );
};

export default Dashboard;
