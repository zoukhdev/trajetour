import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const AgencyLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const { t } = useLanguage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password);
            // Redirect to agency portal
            navigate('/agency');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        }
    };

    return (
        <div className="flex px-4 py-8 min-h-screen bg-background-light dark:bg-background-dark items-center justify-center">
            <div className="max-w-[1200px] w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white dark:bg-[#1a2634] rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Visual Side */}
                <div className="hidden md:flex flex-col justify-between p-10 h-full min-h-[600px] bg-cover bg-center text-white relative" style={{ backgroundImage: 'linear-gradient(rgba(23, 115, 207, 0.9), rgba(17, 25, 33, 0.8)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuDkZj8wqy7rwPMkA1q1-sFSa2Ma8tP0S8AGHBqgAq2Om4KN-Z7QcMOBe7yarTJ6G4mi2IyhMwLWmOb7KgASuDDNODCOaU7jFeBQoOpKmNhs97iMyqAirG0aUqxAQdL8UC3pI5QG3YFi0VaVJaYt_1eiUr6-orN-lGsx9izKe4gCN8pf0NidIdzr6EwSdc2XUIWRbi-hoDgIbddzcWYJzoLGSwLmysivl61fdbFhXbjRqOtIMGAcXaNMg2ydgWUVZeCNh_Rl8VC-Pamo")' }}>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="size-10 flex items-center justify-center text-white bg-white/20 rounded-lg backdrop-blur-sm">
                                <span className="material-symbols-outlined text-2xl">mosque</span>
                            </div>
                            <h2 className="text-xl font-bold">Trajetour Partner</h2>
                        </div>
                        <h1 className="text-4xl font-bold mb-4">{t('auth.agency_app_title')}</h1>
                        <p className="text-blue-100 text-lg">{t('public.hero.subtitle')}</p>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 text-sm font-medium">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined">verified</span>
                                Verified Partner
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined">support_agent</span>
                                24/7 Support
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="p-8 md:p-16 w-full max-w-lg mx-auto">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('auth.agency_login')}</h2>
                        <p className="text-slate-500 dark:text-slate-400">{t('auth.enter_details')}</p>
                    </div>

                    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                        {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.email')}</label>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="agency@example.com"
                                type="email"
                                required
                                dir="ltr"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.password')}</label>
                                <a href="#" className="text-sm text-primary font-bold hover:underline">{t('auth.forgot_password')}</a>
                            </div>
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-12 px-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                type="password"
                                required
                                dir="ltr"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="remember" className="rounded border-gray-300 text-primary focus:ring-primary" />
                            <label htmlFor="remember" className="text-sm text-slate-600 dark:text-slate-400">Remember this device</label>
                        </div>

                        <button className="w-full h-12 bg-primary hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[20px] rtl:rotate-180">login</span>
                            {t('auth.login_btn')}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-gray-100 dark:border-gray-700 pt-6">
                        <p className="text-slate-500 text-sm">{t('auth.register_prompt')}</p>
                        <Link to="/register/agency" className="text-primary font-bold hover:underline">{t('auth.submit_app')}</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgencyLogin;
