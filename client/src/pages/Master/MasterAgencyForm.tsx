import { useState } from 'react';
import { masterAPI } from '../../services/api';
import { ShieldCheck, Loader2, AlertCircle, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
    onSuccess: () => void;
    onCancel: () => void;
}

const MasterAgencyForm = ({ onSuccess, onCancel }: Props) => {
    const { t, isRTL } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        subdomain: '',
        dbUrl: '',
        ownerEmail: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await masterAPI.registerAgency({
                ...formData,
                subdomain: formData.subdomain.toLowerCase().trim()
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || t('master_dashboard.agencies.form.error_register'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {error && (
                <div className={`p-4 bg-red-50 border-${isRTL ? 'r' : 'l'}-4 border-red-500 rounded-${isRTL ? 'l' : 'r'}-lg flex items-start gap-3`}>
                    <AlertCircle className="text-red-500 shrink-0" size={20} />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        {t('master_dashboard.agencies.form.biz_name')}
                        <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none"
                        placeholder={t('master_dashboard.agencies.form.name_placeholder')}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        {t('master_dashboard.agencies.form.subdomain')}
                        <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            required
                            pattern="^[a-z0-0-]+$"
                            value={formData.subdomain}
                            onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                            className={`w-full ${isRTL ? 'pr-4 pl-24' : 'pl-4 pr-24'} py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none`}
                            placeholder={t('master_dashboard.agencies.form.subdomain_placeholder')}
                        />
                        <div className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none text-xs`}>
                            .trajetour.com
                        </div>
                    </div>
                </div>

                <div className="col-span-full space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        {t('master_dashboard.agencies.form.db_url')}
                        <span className="text-red-500">*</span>
                        <div className="group relative">
                            <HelpCircle size={14} className="text-gray-400 cursor-help" />
                            <div className={`absolute bottom-full ${isRTL ? 'right-1/2 translate-x-1/2' : 'left-1/2 -translate-x-1/2'} mb-2 w-64 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50`}>
                                {t('master_dashboard.agencies.form.db_url_help')}
                            </div>
                        </div>
                    </label>
                    <input
                        type="url"
                        required
                        value={formData.dbUrl}
                        onChange={(e) => setFormData({ ...formData, dbUrl: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none font-mono text-xs"
                        placeholder={t('master_dashboard.agencies.form.db_placeholder')}
                        dir="ltr"
                    />
                </div>

                <div className="col-span-full space-y-2">
                    <label className="text-sm font-bold text-gray-700">{t('master_dashboard.agencies.form.owner_email')}</label>
                    <input
                        type="email"
                        value={formData.ownerEmail}
                        onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none"
                        placeholder={t('master_dashboard.agencies.form.owner_placeholder')}
                        dir="ltr"
                    />
                </div>
            </div>

            <div className="flex gap-4 pt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                >
                    {t('master_dashboard.agencies.form.cancel')}
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                    <span>{loading ? t('master_dashboard.agencies.form.submitting') : t('master_dashboard.agencies.form.submit')}</span>
                </button>
            </div>
        </form>
    );
};

export default MasterAgencyForm;

