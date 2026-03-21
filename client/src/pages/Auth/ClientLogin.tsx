import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const ClientLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const { t } = useLanguage();

    const [searchParams] = useSearchParams();
    const redirectIdx = searchParams.get('redirect');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const user = await login(email, password);
            if (!user) {
                setError('Login failed: Invalid credentials');
                return;
            }

            // Role-based redirection combined with Tenant Subdomain
            if (user.tenantId && user.tenantId !== 'default') {
                // If they logged in on an agency subdomain
                if (user.role === 'client') {
                    navigate(redirectIdx || '/client');
                } else {
                    // Agency Admin, Staff, or Agent goes to the Agency Dashboard
                    navigate(redirectIdx || '/agency');
                }
            } else {
                // Master Domain login
                if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'staff' || user.role === 'caisser') {
                    navigate(redirectIdx || '/dashboard');
                } else {
                    // Fallback to client if anything else
                    navigate(redirectIdx || '/client');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
        }
    };

    return (
        <div className="flex-1 flex flex-col justify-center py-10 px-4 md:px-0">
            <div className="max-w-[1200px] w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white dark:bg-[#1a2634] rounded-2xl shadow-sm overflow-hidden min-h-[600px] border border-gray-100 dark:border-gray-700">
                {/* Left Side: Image/Visual */}
                <div className="hidden lg:flex relative h-full w-full flex-col justify-end p-10 bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuDntQYPE9y4Lms4JeJblVvk712-oYvnEd1oOE8pFK_eltVFIU_thj_8qZlO8VIUIijCUz6e9C6aHXRaRp1LEhcrkFcW6UiN2lUw0DLJFAS5wFEC48A-mAXM6iSOKiO74ICUnIzy8AmueoWHd8miRy2VBwTxz3or4jJ0y4dD0lZ5zhc-cQyd9orA6knF-sTbonfo_9cyCBs980YdczHCE1TA2fYphzh-_NTz-wri2qYsXvxnIUXSvqoQq11BLck5g0UVhXDizenPuksO")' }}>
                    <div className="relative z-10 text-white">
                        <div className="mb-4">
                            <span className="material-symbols-outlined text-4xl mb-2">mosque</span>
                        </div>
                        <h1 className="text-4xl font-bold leading-tight mb-2">{t('public.hero.title')}</h1>
                        <p className="text-white/90 text-lg">{t('public.hero.subtitle')}</p>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="flex flex-col justify-center w-full max-w-[480px] mx-auto p-6 md:p-12 lg:p-16">
                    <div className="flex flex-col gap-2 mb-8">
                        <h1 className="text-[#111418] dark:text-white text-3xl font-bold leading-tight tracking-[-0.033em]">
                            {t('auth.welcome_back')}
                        </h1>
                        <p className="text-[#637588] dark:text-gray-400 text-sm font-normal leading-normal">
                            Veuillez vous connecter pour accéder à votre espace
                        </p>
                    </div>

                    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                        {error && <div className="text-red-500 text-sm">{error}</div>}

                        {/* Email Field */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-normal" htmlFor="email">
                                {t('auth.email')}
                            </label>
                            <div className="relative flex items-center">
                                <span className="material-symbols-outlined absolute left-4 rtl:left-auto rtl:right-4 text-[#637588] dark:text-gray-500">mail</span>
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex w-full rounded-lg border border-[#dce0e5] dark:border-[#344152] bg-white dark:bg-[#111921] focus:border-primary focus:ring-1 focus:ring-primary h-12 pl-12 pr-4 rtl:pr-12 rtl:pl-4 text-[#111418] dark:text-white text-base placeholder:text-[#637588] dark:placeholder:text-gray-600 transition-colors"
                                    id="email"
                                    placeholder="name@example.com"
                                    type="email"
                                    required
                                    dir="ltr" // Email is always LTR
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[#111418] dark:text-gray-200 text-sm font-medium leading-normal" htmlFor="password">
                                    {t('auth.password')}
                                </label>
                                <Link className="text-primary text-sm font-bold hover:underline" to="/forgot-password">{t('auth.forgot_password')}</Link>
                            </div>
                            <div className="relative flex items-center">
                                <span className="material-symbols-outlined absolute left-4 rtl:left-auto rtl:right-4 text-[#637588] dark:text-gray-500">lock</span>
                                <input
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="flex w-full rounded-lg border border-[#dce0e5] dark:border-[#344152] bg-white dark:bg-[#111921] focus:border-primary focus:ring-1 focus:ring-primary h-12 pl-12 pr-12 rtl:pr-12 rtl:pl-12 text-[#111418] dark:text-white text-base placeholder:text-[#637588] dark:placeholder:text-gray-600 transition-colors"
                                    id="password"
                                    placeholder="••••••••"
                                    type="password"
                                    required
                                    dir="ltr"
                                />
                                <button className="absolute right-4 rtl:right-auto rtl:left-4 text-[#637588] dark:text-gray-500 hover:text-[#111418] dark:hover:text-white transition-colors cursor-pointer" type="button">
                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary hover:bg-blue-700 text-white gap-2 text-base font-bold leading-normal tracking-[0.015em] transition-colors shadow-sm">
                            <span className="truncate">{t('auth.login_btn')}</span>
                            <span className="material-symbols-outlined text-[20px] rtl:rotate-180">arrow_forward</span>
                        </button>

                        {/* Footer Link */}
                        <div className="text-center mt-4">
                            <p className="text-[#637588] dark:text-gray-400 text-sm">
                                {t('auth.register_prompt')}
                                <Link className="text-primary font-bold hover:underline ml-1" to="/register">{t('auth.register_link')}</Link>
                            </p>
                            <p className="text-[#637588] dark:text-gray-400 text-sm mt-2">
                                {t('auth.agency_prompt')}
                                <Link className="text-primary font-bold hover:underline ml-1" to="/login/agency">{t('auth.agency_link')}</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ClientLogin;
