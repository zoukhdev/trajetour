import React, { useState } from 'react';
import { Lock, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authAPI from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export function ResetPassword() {
    const { t } = useLanguage();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (newPassword !== confirmPassword) {
            setError(t('auth.passwords_not_match'));
            return;
        }

        setIsLoading(true);
        try {
            await authAPI.post('/auth/reset-password', { token, newPassword });
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || t('auth.invalid_token_error'));
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl ring-1 ring-slate-900/5 relative z-10 p-8 text-center">
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <KeyRound className="text-red-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{t('auth.link_invalid')}</h2>
                    <p className="text-slate-500 mt-2 mb-6">{t('auth.link_invalid_desc')}</p>
                    <button onClick={() => navigate('/login')} className="w-full bg-slate-900 text-white font-medium py-2 rounded-xl transition hover:bg-slate-800">
                        {t('auth.back_to_login')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-64 bg-slate-900 origin-top-left -skew-y-2 transform -translate-y-12"></div>
            
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl ring-1 ring-slate-900/5 relative z-10 p-8">
                <div className="mb-8 items-center flex flex-col pt-4">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-5 ring-4 ring-blue-50/50 shadow-inner">
                        <Lock size={26} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">{t('auth.new_password')}</h2>
                    <p className="text-slate-500 mt-2 text-sm text-center">{t('auth.new_password_desc')}</p>
                </div>

                {success ? (
                    <div className="bg-emerald-50 text-emerald-800 p-5 rounded-xl text-center border border-emerald-100 flex flex-col items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Lock className="shrink-0 text-emerald-600" size={20} />
                        </div>
                        <div>
                            <p className="font-semibold text-lg">{t('auth.password_updated_success')}</p>
                            <p className="text-emerald-700/80 mt-1">{t('auth.password_updated_desc')}</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 font-medium">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.new_password')}</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <KeyRound size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    minLength={6}
                                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('auth.confirm_password')}</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    minLength={6}
                                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-slate-900 text-white font-semibold py-2.5 rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    {t('common.save')}
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
