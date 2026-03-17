import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { authAPI } from '../../services/api';

const AgencySignup = () => {
    const [formData, setFormData] = useState({
        agencyName: '',
        licenseNumber: '', // Not used in API yet but kept for UI
        address: '',
        contactName: '',
        position: '', // Not used
        email: '',
        phone: ''
    });
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
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
            await authAPI.registerAgency({
                agencyName: formData.agencyName,
                contactName: formData.contactName,
                email: formData.email,
                phone: formData.phone,
                password: password,
                address: formData.address
            });
            // Redirect to login or success page
            navigate('/login/agency');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex px-4 py-8 min-h-screen bg-background-light dark:bg-background-dark items-center justify-center">
            <div className="max-w-[700px] w-full bg-white dark:bg-[#1a2634] rounded-2xl shadow-xl p-8 md:p-12 border border-blue-100 dark:border-gray-700">
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

                    <button disabled={loading} className="btn-primary h-12 w-full text-base font-bold mt-4 disabled:opacity-50">
                        {loading ? 'Processing...' : t('auth.submit_application')}
                    </button>

                    <p className="text-center text-sm text-slate-500">
                        {t('auth.already_account')} <Link to="/login/agency" className="text-primary font-bold hover:underline">{t('auth.login_btn')}</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default AgencySignup;
