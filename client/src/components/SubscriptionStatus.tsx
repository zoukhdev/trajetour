import { useState, useEffect } from 'react';
import { masterAPI } from '../../services/api';
import { CreditCard, Shield, Clock, AlertTriangle, CheckCircle2, XCircle, Building2, Globe, ExternalLink } from 'lucide-react';

interface Subscription {
    id: string;
    name: string;
    subdomain: string;
    plan: string;
    status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
    owner_email: string;
    created_at: string;
    db_provisioned_at: string | null;
    status_updated_at: string | null;
    rejection_reason: string | null;
}

const PLAN_FEATURES: Record<string, { features: string[]; price: string; color: string }> = {
    Basic: {
        price: '2 900 DA/mois',
        color: 'from-slate-500 to-slate-700',
        features: ['Jusqu\'à 3 utilisateurs', 'Gestion des dossiers', 'Rapports de base', 'Support email'],
    },
    Pro: {
        price: '5 900 DA/mois',
        color: 'from-blue-500 to-indigo-700',
        features: ['Jusqu\'à 10 utilisateurs', 'Toutes les fonctionnalités', 'Rapports avancés', 'Support prioritaire'],
    },
    Enterprise: {
        price: '12 900 DA/mois',
        color: 'from-purple-500 to-violet-800',
        features: ['Utilisateurs illimités', 'Fonctionnalités exclusives', 'API personnalisée', 'Support dédié 24/7'],
    },
};

const STATUS_CONFIG: Record<string, { icon: JSX.Element; bg: string; border: string; text: string; title: string; description: string }> = {
    PENDING: {
        icon: <Clock size={20} className="text-amber-600" />,
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        title: 'Demande en cours d\'examen',
        description: 'Votre demande d\'inscription est en cours d\'examen par notre équipe. Vous serez notifié par email une fois la vérification terminée (généralement sous 24h ouvrables).',
    },
    ACTIVE: {
        icon: <CheckCircle2 size={20} className="text-emerald-600" />,
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-800',
        title: 'Abonnement actif',
        description: 'Votre agence est approuvée et votre abonnement est actif. Profitez de toutes les fonctionnalités de votre plan.',
    },
    REJECTED: {
        icon: <XCircle size={20} className="text-red-600" />,
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        title: 'Demande rejetée',
        description: 'Votre demande a été rejetée. Consultez le motif ci-dessous et contactez notre support pour plus d\'informations.',
    },
    SUSPENDED: {
        icon: <AlertTriangle size={20} className="text-orange-600" />,
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        title: 'Compte suspendu',
        description: 'Votre compte a été temporairement suspendu. Contactez notre support pour régulariser votre situation.',
    },
};

const SubscriptionStatus = () => {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        masterAPI.getMySubscription()
            .then(data => setSubscription(data))
            .catch(err => setError(err?.response?.data?.error || 'Impossible de charger les informations d\'abonnement.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-48 mb-4" />
                <div className="h-24 bg-gray-50 rounded-xl" />
            </div>
        );
    }

    if (error || !subscription) {
        return null; // Silently fail — don't block the dashboard
    }

    const plan = PLAN_FEATURES[subscription.plan] || PLAN_FEATURES.Basic;
    const statusCfg = STATUS_CONFIG[subscription.status] || STATUS_CONFIG.PENDING;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Gradient Header */}
            <div className={`bg-gradient-to-r ${plan.color} p-5 text-white`}>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <CreditCard size={16} className="opacity-80" />
                            <span className="text-sm font-medium opacity-80">Mon Abonnement</span>
                        </div>
                        <h2 className="text-2xl font-black">{subscription.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Globe size={13} className="opacity-70" />
                            <a
                                href={`https://${subscription.subdomain}.trajetour.com`}
                                className="text-sm opacity-80 hover:opacity-100 underline"
                                target="_blank" rel="noreferrer"
                            >
                                {subscription.subdomain}.trajetour.com
                            </a>
                            <ExternalLink size={11} className="opacity-60" />
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                            <Shield size={13} />
                            <span className="text-sm font-bold">Plan {subscription.plan}</span>
                        </div>
                        <p className="text-xs mt-2 opacity-70">{plan.price}</p>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* Status Banner */}
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${statusCfg.bg} ${statusCfg.border}`}>
                    <div className="mt-0.5">{statusCfg.icon}</div>
                    <div>
                        <p className={`font-bold text-sm ${statusCfg.text}`}>{statusCfg.title}</p>
                        <p className={`text-xs mt-0.5 ${statusCfg.text} opacity-80`}>{statusCfg.description}</p>
                        {subscription.status === 'REJECTED' && subscription.rejection_reason && (
                            <p className="text-xs mt-2 bg-red-100 text-red-700 rounded-lg px-3 py-2 font-medium">
                                💬 Motif : {subscription.rejection_reason}
                            </p>
                        )}
                    </div>
                </div>

                {/* DB Provisioning Status */}
                <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                    subscription.db_provisioned_at ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${subscription.db_provisioned_at ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                    {subscription.db_provisioned_at
                        ? `✅ Base de données opérationnelle depuis le ${new Date(subscription.db_provisioned_at).toLocaleDateString('fr-FR')}`
                        : '⏳ Provisionnement de la base de données en cours...'}
                </div>

                {/* Plan Features */}
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Fonctionnalités incluses</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {plan.features.map((feat, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                {feat}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Dates */}
                <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-xs text-gray-400">
                    <span>Inscrit le {new Date(subscription.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    {subscription.status_updated_at && (
                        <span>Mis à jour le {new Date(subscription.status_updated_at).toLocaleDateString('fr-FR')}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubscriptionStatus;
