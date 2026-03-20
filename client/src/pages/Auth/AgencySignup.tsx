import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { authAPI } from '../../services/api';

const AgencySignup = () => {
    const [formData, setFormData] = useState({
        agencyName: '',
        licenseNumber: '',
        address: '',
        contactName: '',
        position: '',
        email: '',
        phone: '',
        plan: 'Basic'
    });
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();
    // Use t from context if available, otherwise mock or import
    // Assuming context is available
    const { t } = useLanguage();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            // Auto-generate subdomain from agency name (lowercase, alphanumeric + hyphens only)
            const generatedSubdomain = formData.agencyName
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');

            await authAPI.registerAgency({
                name: formData.agencyName,
                subdomain: generatedSubdomain,
                contactName: formData.contactName,
                ownerEmail: formData.email,
                phone: formData.phone,
                password: password,
                address: formData.address,
                plan: formData.plan
            });
            // Show success alert/screen
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex px-4 py-8 min-h-screen bg-background-light dark:bg-background-dark items-center justify-center">
            <div className="max-w-[700px] w-full bg-white dark:bg-[#1a2634] rounded-2xl shadow-xl p-8 md:p-12 border border-blue-100 dark:border-gray-700">
                {isSuccess ? (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Inscription Réussie ! 🎉</h2>
                        <p className="text-slate-600 dark:text-slate-300 mb-3 max-w-md mx-auto">
                            Votre agence a été enregistrée avec succès. Votre espace de travail est en cours de préparation.
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 text-left max-w-sm mx-auto">
                            <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">⏱️ Prêt dans 1-2 minutes</p>
                            <p className="text-sm text-blue-700 dark:text-blue-400">Vos identifiants de connexion :</p>
                            <p className="text-sm font-mono text-blue-800 dark:text-blue-200 mt-1">📧 {formData.email}</p>
                            <p className="text-sm font-mono text-blue-800 dark:text-blue-200">🔑 {password}</p>
                        </div>
                        <Link to="/login/agency" className="btn-primary inline-flex items-center justify-center h-12 px-8 text-base font-bold">
                            Se connecter au tableau de bord
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="mb-8">
                            <span className="text-xs font-bold tracking-wider text-primary uppercase mb-2 block">{t('auth.partner_program')}</span>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('auth.agency_title')}</h1>
                            <p className="text-slate-500 dark:text-slate-400">{t('auth.agency_subtitle')}</p>
                        </div>

                        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                    {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

                    {/* Agency Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-gray-200 border-b pb-2 border-gray-100 dark:border-gray-700">{t('auth.agency_info')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.agency_name')}</label>
                                <input name="agencyName" onChange={handleChange} required className="input-field h-11" placeholder="e.g. Al-Djazair Travels" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.license_number')}</label>
                                <input name="licenseNumber" onChange={handleChange} className="input-field h-11" placeholder="License / RC Number" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.address')}</label>
                            <input name="address" onChange={handleChange} className="input-field h-11" placeholder="Full address" />
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-gray-200 border-b pb-2 border-gray-100 dark:border-gray-700">{t('auth.contact_person')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.full_name')}</label>
                                <input name="contactName" onChange={handleChange} required className="input-field h-11" placeholder="Manager Name" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.position')}</label>
                                <input name="position" onChange={handleChange} className="input-field h-11" placeholder="e.g. General Manager" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.email')}</label>
                                <input type="email" name="email" onChange={handleChange} required className="input-field h-11" placeholder="This will be your login" dir="ltr" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.phone')}</label>
                                <input type="tel" name="phone" onChange={handleChange} required className="input-field h-11" placeholder="+213 ..." dir="ltr" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.password')}</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field h-11" placeholder="••••••••" dir="ltr" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.confirm_password')}</label>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="input-field h-11" placeholder="••••••••" dir="ltr" />
                            </div>
                        </div>
                    </div>

                    {/* Plan Selection */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-gray-200 border-b pb-2 border-gray-100 dark:border-gray-700">Subscription Plan</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {['Basic', 'Pro', 'Enterprise'].map((planOption) => (
                                <div 
                                    key={planOption}
                                    onClick={() => setFormData({ ...formData, plan: planOption })}
                                    className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${formData.plan === planOption ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}
                                >
                                    <div className={`font-bold text-lg mb-1 ${formData.plan === planOption ? 'text-primary' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {planOption}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {planOption === 'Basic' ? 'Start small, grow big.' : planOption === 'Pro' ? 'For growing businesses.' : 'Advanced features.'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button disabled={loading} className="btn-primary h-12 w-full text-base font-bold mt-4 disabled:opacity-50">
                        {loading ? 'Processing...' : t('auth.submit_application')}
                    </button>

                    <p className="text-center text-sm text-slate-500">
                        {t('auth.already_account')} <Link to="/login/agency" className="text-primary font-bold hover:underline">{t('auth.login_btn')}</Link>
                    </p>
                </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default AgencySignup;
