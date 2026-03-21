import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import authAPI from '../../services/api';

export function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await authAPI.post('/auth/forgot-password', { email });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.error || "Une erreur est survenue.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 inset-x-0 h-64 bg-slate-900 origin-top-left -skew-y-2 transform -translate-y-12"></div>
            
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl ring-1 ring-slate-900/5 relative z-10 p-8">
                <div className="mb-8">
                    <Link to="/login" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6">
                        <ArrowLeft size={16} /> Retour à la connexion
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-900">Mot de passe oublié ?</h2>
                    <p className="text-slate-500 mt-2 text-sm">Entrez l'adresse e-mail associée à votre compte pour recevoir un lien de réinitialisation.</p>
                </div>

                {success ? (
                    <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-sm border border-emerald-100 flex items-start gap-3">
                        <Mail className="shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="font-semibold">Email envoyé avec succès !</p>
                            <p className="text-emerald-700/80 mt-1">Si un compte est associé à cette adresse, vous recevrez un lien de réinitialisation sous peu.</p>
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
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Adresse E-mail</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition outline-none"
                                    placeholder="vous@exemple.com"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    Envoyer le lien
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
