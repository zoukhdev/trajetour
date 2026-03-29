import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, KeyRound, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import authAPI from '../../services/api';

/**
 * SetPassword — Shown on first login when an admin-created account has a temporary password.
 * The user MUST set a new password before accessing the dashboard.
 */
export default function SetPassword() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Password strength indicator
    const strength = (() => {
        if (!newPassword) return 0;
        let s = 0;
        if (newPassword.length >= 8) s++;
        if (/[A-Z]/.test(newPassword)) s++;
        if (/[0-9]/.test(newPassword)) s++;
        if (/[^A-Za-z0-9]/.test(newPassword)) s++;
        return s;
    })();

    const strengthLabel = ['', 'Faible', 'Moyen', 'Fort', 'Très fort'][strength];
    const strengthColor = ['', 'bg-red-500', 'bg-amber-400', 'bg-blue-500', 'bg-emerald-500'][strength];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setIsLoading(true);
        try {
            await authAPI.post('/auth/change-password', { newPassword });
            setSuccess(true);

            // After 2.5 s, redirect: the next visit to /login will no longer trigger this page
            // We use window.location to force a full re-auth cycle so the new cookie is confirmed
            setTimeout(() => {
                window.location.href = '/login';
            }, 2500);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>

            {/* Decorative blobs */}
            <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
            <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 rounded-full opacity-15"
                style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />

            <div className="w-full max-w-md relative z-10">
                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header Banner */}
                    <div className="px-8 pt-8 pb-6 text-center"
                        style={{ background: 'linear-gradient(180deg, rgba(59,130,246,0.15) 0%, transparent 100%)' }}>
                        <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                            <ShieldCheck size={30} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Créez votre mot de passe</h1>
                        <p className="text-blue-200/70 text-sm mt-2 leading-relaxed">
                            Votre compte a été créé par un administrateur.<br />
                            Choisissez un mot de passe personnel pour sécuriser votre accès.
                        </p>
                    </div>

                    <div className="px-8 pb-8">
                        {success ? (
                            /* Success State */
                            <div className="flex flex-col items-center gap-4 py-6 text-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                                    <ShieldCheck size={32} className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-white">Mot de passe défini !</p>
                                    <p className="text-blue-200/70 text-sm mt-1">
                                        Vous allez être redirigé vers la page de connexion…
                                    </p>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-1 mt-2">
                                    <div className="bg-emerald-400 h-1 rounded-full animate-[width_2.5s_linear]" style={{ width: '100%', animation: 'progress 2.5s linear forwards' }} />
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="bg-red-500/10 border border-red-400/20 text-red-300 rounded-xl p-3 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* New Password */}
                                <div>
                                    <label className="block text-sm font-medium text-blue-100/80 mb-2">
                                        Nouveau mot de passe
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-300/50">
                                            <KeyRound size={18} />
                                        </div>
                                        <input
                                            type={showNew ? 'text' : 'password'}
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            minLength={6}
                                            className="block w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                                            placeholder="Minimum 6 caractères"
                                            dir="ltr"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew(!showNew)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-300/50 hover:text-white transition"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
                                                {showNew ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>

                                    {/* Strength meter */}
                                    {newPassword && (
                                        <div className="mt-2">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4].map((i) => (
                                                    <div
                                                        key={i}
                                                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-white/10'}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs mt-1 text-blue-200/50">{strengthLabel}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-blue-100/80 mb-2">
                                        Confirmer le mot de passe
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-300/50">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="block w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                                            placeholder="Répétez le mot de passe"
                                            dir="ltr"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-300/50 hover:text-white transition"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
                                                {showConfirm ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                    {/* Match indicator */}
                                    {confirmPassword && (
                                        <p className={`text-xs mt-1 ${newPassword === confirmPassword ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {newPassword === confirmPassword ? '✓ Les mots de passe correspondent' : '✗ Ne correspondent pas'}
                                        </p>
                                    )}
                                </div>

                                {/* Tips */}
                                <div className="bg-blue-500/5 border border-blue-400/10 rounded-xl p-3 text-xs text-blue-200/50 space-y-1">
                                    <p className="font-medium text-blue-200/70 mb-1">Conseils pour un mot de passe fort :</p>
                                    <p className={newPassword.length >= 8 ? 'text-emerald-400' : ''}>• Au moins 8 caractères</p>
                                    <p className={/[A-Z]/.test(newPassword) ? 'text-emerald-400' : ''}>• Au moins une lettre majuscule</p>
                                    <p className={/[0-9]/.test(newPassword) ? 'text-emerald-400' : ''}>• Au moins un chiffre</p>
                                    <p className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-400' : ''}>• Un caractère spécial (!, @, #…)</p>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 px-6 rounded-xl font-semibold text-white flex items-center justify-center gap-2 group transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
                                    style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            Définir mon mot de passe
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <p className="text-center text-blue-300/30 text-xs mt-4">
                    Cette étape est obligatoire pour protéger votre compte.
                </p>
            </div>

            <style>{`
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}</style>
        </div>
    );
}
