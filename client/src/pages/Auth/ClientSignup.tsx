import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { authAPI } from '../../services/api';

const ClientSignup = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true); // Set loading to true at the start of submission

        if (formData.password !== formData.confirmPassword) {
            setError(t('auth.passwords_not_match'));
            setLoading(false); // Reset loading if validation fails
            return;
        }

        try {
            await authAPI.register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            });
            // Registration successful (cookie set by backend) -> Redirect to dashboard or login
            // Since cookie is set, we can update auth context?
            // AuthContext might need a refresh. For now, redirect to login to force clean state or reload.
            // But better user experience is auto-login.
            // Let's redirect to login for simplicity to ensure context is updated properly via login flow, 
            // or we need to call login() in context.
            // Given AuthContext structure, just redirecting to login with a success method or auto-filling credentials is tricky.
            // But backend set the cookie. If we reload the page or go to dashboard, checkAuth should run properly?
            // Let's try redirecting to dashboard and reload window to ensure AuthContext picks up user.

            // Actually, best practice: Redirect to login.
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.error || t('auth.register_error') || 'Registration failed');
        } finally {
            setLoading(false); // Always reset loading state
        }
    };

    return (
        <div className="flex-1 flex flex-col justify-center py-10 px-4 md:px-0">
            <div className="max-w-[600px] w-full mx-auto bg-white dark:bg-[#1a2634] rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 p-8 md:p-12">
                <div className="text-center mb-8">
                    <div className="size-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                        <span className="material-symbols-outlined text-2xl">person_add</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#111418] dark:text-white">{t('auth.register_title')}</h1>
                    <p className="text-[#637588] dark:text-gray-400 mt-2">{t('public.hero.subtitle')}</p>
                </div>

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[#111418] dark:text-gray-200">{t('auth.first_name')}</label>
                            <input name="firstName" onChange={handleChange} className="input-field h-10" required />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[#111418] dark:text-gray-200">{t('auth.last_name')}</label>
                            <input name="lastName" onChange={handleChange} className="input-field h-10" required />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-[#111418] dark:text-gray-200">{t('auth.email')}</label>
                        <input type="email" name="email" onChange={handleChange} className="input-field h-10" required dir="ltr" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-[#111418] dark:text-gray-200">{t('auth.phone')}</label>
                        <input type="tel" name="phone" onChange={handleChange} className="input-field h-10" required dir="ltr" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-[#111418] dark:text-gray-200">{t('auth.password')}</label>
                        <input type="password" name="password" onChange={handleChange} className="input-field h-10" required dir="ltr" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-[#111418] dark:text-gray-200">{t('auth.confirm_password')}</label>
                        <input type="password" name="confirmPassword" onChange={handleChange} className="input-field h-10" required dir="ltr" />
                    </div>

                    <div className="flex items-start gap-2 mt-2">
                        <input type="checkbox" required className="mt-1 rounded border-gray-300 text-primary focus:ring-primary" />
                        <span className="text-xs text-[#637588] dark:text-gray-400">
                            {t('auth.agree_terms')} <Link to="#" className="text-primary hover:underline">{t('common.terms')}</Link> {t('common.and')} <Link to="#" className="text-primary hover:underline">{t('common.privacy')}</Link>.
                        </span>
                    </div>

                    <button disabled={loading} className="btn-primary w-full h-11 mt-4 font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? '...' : t('auth.create_account')}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <p className="text-sm text-[#637588] dark:text-gray-400">
                        {t('auth.already_account')}
                        <Link to="/login" className="text-primary font-bold hover:underline ml-1">{t('auth.login_btn')}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ClientSignup;
