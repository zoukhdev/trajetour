import React from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import {
    Clock, CheckCircle2, XCircle, AlertTriangle, CreditCard,
    Shield, Zap, Crown, LogOut, RefreshCw, Phone, Mail, Globe
} from 'lucide-react';

const PLAN_CONFIG: Record<string, {
    label: string;
    price: string;
    priceYear: string;
    gradient: string;
    icon: React.ReactElement;
    color: string;
    features: string[];
}> = {
    Basic: {
        label: 'Basic',
        price: '2 900',
        priceYear: '29 000',
        gradient: 'from-slate-600 to-slate-800',
        icon: <Shield className="w-6 h-6" />,
        color: 'slate',
        features: [
            '3 utilisateurs maximum',
            'Gestion des dossiers voyageurs',
            'Rapports de base',
            'Support par email',
            'Dashboard partenaire',
            'Backup quotidien',
        ],
    },
    Pro: {
        label: 'Pro',
        price: '5 900',
        priceYear: '59 000',
        gradient: 'from-blue-600 to-indigo-700',
        icon: <Zap className="w-6 h-6" />,
        color: 'blue',
        features: [
            '10 utilisateurs maximum',
            'Toutes les fonctionnalités Basic',
            'Rapports avancés & analytics',
            'Gestion caisse & comptabilité',
            'Support prioritaire',
            'Intégrations avancées',
        ],
    },
    Enterprise: {
        label: 'Enterprise',
        price: '12 900',
        priceYear: '129 000',
        gradient: 'from-purple-600 to-violet-800',
        icon: <Crown className="w-6 h-6" />,
        color: 'purple',
        features: [
            'Utilisateurs illimités',
            'Toutes les fonctionnalités Pro',
            'API personnalisée & webhooks',
            'Marque blanche disponible',
            'Manager dédié 24/7',
            'SLA garanti 99.9%',
        ],
    },
};

const StatusBanner = ({ status, rejectionReason }: { status: string; rejectionReason?: string | null }) => {
    const configs = {
        PENDING: {
            bg: 'bg-amber-50 border-amber-200',
            icon: <Clock className="w-5 h-5 text-amber-600 shrink-0" />,
            title: 'Votre dossier est en cours d\'examen',
            desc: 'Notre équipe examine votre demande d\'inscription. Vous serez notifié par email dès qu\'une décision sera prise, généralement sous 24 heures ouvrables.',
            textColor: 'text-amber-800',
        },
        REJECTED: {
            bg: 'bg-red-50 border-red-200',
            icon: <XCircle className="w-5 h-5 text-red-600 shrink-0" />,
            title: 'Votre demande a été rejetée',
            desc: rejectionReason || 'Pour plus d\'informations, veuillez contacter notre équipe de support.',
            textColor: 'text-red-800',
        },
        SUSPENDED: {
            bg: 'bg-orange-50 border-orange-200',
            icon: <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />,
            title: 'Compte temporairement suspendu',
            desc: 'Votre accès a été suspendu. Contactez le support pour régulariser votre situation.',
            textColor: 'text-orange-800',
        },
    };

    const cfg = configs[status as keyof typeof configs] || configs.PENDING;

    return (
        <div className={`flex items-start gap-4 p-5 rounded-2xl border-2 ${cfg.bg}`}>
            <div className="mt-0.5">{cfg.icon}</div>
            <div>
                <p className={`font-bold text-base ${cfg.textColor}`}>{cfg.title}</p>
                <p className={`text-sm mt-1 ${cfg.textColor} opacity-80`}>{cfg.desc}</p>
            </div>
        </div>
    );
};

const PendingApprovalGate = ({ children }: { children: React.ReactNode }) => {
    const { subscription, loading, isLocked, refetch } = useSubscription();
    const { logout, user } = useAuth();

    // Not locked — render normally
    if (!isLocked) return <>{children}</>;

    // Loading state
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 font-medium">Chargement de votre espace...</p>
                </div>
            </div>
        );
    }

    const plan = PLAN_CONFIG[subscription?.plan || 'Basic'] || PLAN_CONFIG.Basic;
    const status = subscription?.status || 'PENDING';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex flex-col">
            {/* Top Banner */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <span className="text-lg">✈️</span>
                    </div>
                    <div>
                        <span className="font-black text-gray-900 text-lg">Trajetour</span>
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                            {status === 'PENDING' ? '⏳ En attente' : status === 'REJECTED' ? '❌ Rejetée' : '⚠️ Suspendue'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={refetch}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
                    >
                        <RefreshCw size={14} />
                        Actualiser
                    </button>
                    <button
                        onClick={logout}
                        className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition font-medium"
                    >
                        <LogOut size={14} />
                        Déconnexion
                    </button>
                </div>
            </div>

            <div className="flex-1 flex items-start justify-center px-4 py-10">
                <div className="w-full max-w-3xl space-y-6">

                    {/* Welcome Header */}
                    <div className="text-center mb-2">
                        <h1 className="text-3xl font-black text-gray-900">
                            Bienvenue, {subscription?.name || user?.username} 👋
                        </h1>
                        <p className="text-gray-500 mt-1">Votre espace partenaire Trajetour est prêt — il attend juste votre approbation.</p>
                    </div>

                    {/* Status Banner */}
                    <StatusBanner status={status} rejectionReason={subscription?.rejection_reason} />

                    {/* Plan Card — Beautiful gradient */}
                    <div className={`rounded-3xl bg-gradient-to-br ${plan.gradient} text-white shadow-xl shadow-blue-900/20 overflow-hidden`}>
                        {/* Plan Header */}
                        <div className="p-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-2">Votre abonnement</p>
                                    <h2 className="text-4xl font-black">Plan {plan.label}</h2>
                                    <p className="text-white/70 mt-1 text-sm">
                                        {subscription?.subdomain}.trajetour.com
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 inline-block">
                                        {plan.icon}
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="mt-8 flex items-end gap-6 flex-wrap">
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
                                    <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">Mensuel</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black">{plan.price}</span>
                                        <span className="text-lg font-medium text-white/70">DA</span>
                                    </div>
                                    <p className="text-white/50 text-xs mt-1">par mois / HT</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Annuel</p>
                                        <span className="bg-green-400/20 text-green-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-green-400/30">-17%</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black">{plan.priceYear}</span>
                                        <span className="text-lg font-medium text-white/70">DA</span>
                                    </div>
                                    <p className="text-white/50 text-xs mt-1">par an / HT</p>
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="bg-black/20 backdrop-blur-sm px-8 py-6">
                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Ce qui est inclus dans votre plan</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {plan.features.map((feat, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm text-white/90">{feat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* What Happens Next */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <h3 className="font-black text-gray-900 text-xl mb-6 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                            Comment activer votre tableau de bord ?
                        </h3>
                        <div className="space-y-5">
                            {[
                                {
                                    step: '1',
                                    title: 'Examen de votre dossier',
                                    desc: 'Notre équipe vérifie les informations de votre agence. Ce processus dure généralement moins de 24h.',
                                    done: status !== 'PENDING',
                                    active: status === 'PENDING',
                                },
                                {
                                    step: '2',
                                    title: `Règlement de l'abonnement — ${plan.price} DA/mois`,
                                    desc: 'À réception de votre approbation, effectuez le paiement de votre premier mois d\'abonnement par virement ou en agence.',
                                    done: status === 'ACTIVE',
                                    active: status === 'REJECTED',
                                },
                                {
                                    step: '3',
                                    title: 'Activation complète',
                                    desc: 'Votre tableau de bord complet est déverrouillé. Commencez à gérer vos dossiers, clients et finances.',
                                    done: false,
                                    active: false,
                                },
                            ].map(({ step, title, desc, done, active }) => (
                                <div key={step} className={`flex items-start gap-4 p-4 rounded-2xl transition-all ${
                                    done ? 'bg-emerald-50 border border-emerald-100' :
                                    active ? 'bg-blue-50 border-2 border-blue-200' :
                                    'bg-gray-50 border border-gray-100'
                                }`}>
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                                        done ? 'bg-emerald-500 text-white' :
                                        active ? 'bg-blue-600 text-white' :
                                        'bg-gray-200 text-gray-500'
                                    }`}>
                                        {done ? '✓' : step}
                                    </div>
                                    <div>
                                        <p className={`font-bold text-sm ${done ? 'text-emerald-800' : active ? 'text-blue-900' : 'text-gray-500'}`}>
                                            {title}
                                        </p>
                                        <p className={`text-xs mt-0.5 ${done ? 'text-emerald-700' : active ? 'text-blue-700' : 'text-gray-400'}`}>
                                            {desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Support */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-900/20">
                        <h3 className="font-black text-xl mb-2">Besoin d'aide ?</h3>
                        <p className="text-blue-100 text-sm mb-6">Notre équipe est disponible pour répondre à toutes vos questions concernant votre inscription.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <a href="tel:+213XXXXXXXXX" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 transition border border-white/20 group">
                                <Phone className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="text-xs text-blue-200 font-medium">Téléphone</p>
                                    <p className="text-sm font-bold">Support</p>
                                </div>
                            </a>
                            <a href="mailto:support@trajetour.com" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 transition border border-white/20 group">
                                <Mail className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="text-xs text-blue-200 font-medium">Email</p>
                                    <p className="text-sm font-bold">support@trajetour.com</p>
                                </div>
                            </a>
                            <a href="https://trajetour.com" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 transition border border-white/20 group">
                                <Globe className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="text-xs text-blue-200 font-medium">Site web</p>
                                    <p className="text-sm font-bold">trajetour.com</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-400 pb-6">
                        Inscrit le {subscription?.created_at ? new Date(subscription.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                        {' · '}
                        {subscription?.subdomain}.trajetour.com
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PendingApprovalGate;
