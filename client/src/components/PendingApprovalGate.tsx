import React, { useState, useRef } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { masterAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
    Clock, CheckCircle2, XCircle, AlertTriangle, CreditCard,
    Shield, Zap, Crown, LogOut, RefreshCw, Phone, Mail, Globe, UploadCloud, FileImage
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
        label: 'auth.plans.basic',
        price: '2 900',
        priceYear: '29 000',
        gradient: 'from-slate-600 to-slate-800',
        icon: <Shield className="w-6 h-6" />,
        color: 'slate',
        features: [
            'gate.features.users_3',
            'gate.features.dossiers',
            'gate.features.reports_basic',
            'gate.features.support_email',
            'gate.features.partner_dashboard',
            'gate.features.backup',
        ],
    },
    Pro: {
        label: 'auth.plans.pro',
        price: '5 900',
        priceYear: '59 000',
        gradient: 'from-blue-600 to-indigo-700',
        icon: <Zap className="w-6 h-6" />,
        color: 'blue',
        features: [
            'gate.features.users_10',
            'gate.features.all_basic',
            'gate.features.reports_advanced',
            'gate.features.accounting',
            'gate.features.support_priority',
            'gate.features.integrations',
        ],
    },
    Enterprise: {
        label: 'auth.plans.enterprise',
        price: '12 900',
        priceYear: '129 000',
        gradient: 'from-purple-600 to-violet-800',
        icon: <Crown className="w-6 h-6" />,
        color: 'purple',
        features: [
            'gate.features.users_unlimited',
            'gate.features.all_pro',
            'gate.features.webhooks',
            'gate.features.white_label',
            'gate.features.support_247',
            'gate.features.sla',
        ],
    },
};

const StatusBanner = ({ status, rejectionReason }: { status: string; rejectionReason?: string | null }) => {
    const { t } = useLanguage();
    const configs = {
        PENDING: {
            bg: 'bg-amber-50 border-amber-200',
            icon: <Clock className="w-5 h-5 text-amber-600 shrink-0" />,
            title: t('gate.status.pending_title'),
            desc: t('gate.status.pending_desc'),
            textColor: 'text-amber-800',
        },
        REJECTED: {
            bg: 'bg-red-50 border-red-200',
            icon: <XCircle className="w-5 h-5 text-red-600 shrink-0" />,
            title: t('gate.status.rejected_title'),
            desc: rejectionReason || t('gate.status.rejected_desc_default'),
            textColor: 'text-red-800',
        },
        SUSPENDED: {
            bg: 'bg-orange-50 border-orange-200',
            icon: <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />,
            title: t('gate.status.suspended_title'),
            desc: t('gate.status.suspended_desc'),
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
    const { t, language } = useLanguage();
    const { subscription, loading, isLocked, refetch } = useSubscription();
    const { logout, user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setUploading(true);
            await masterAPI.uploadPaymentProof(file);
            await refetch();
        } catch (err) {
            console.error('Failed to upload proof:', err);
            alert(t('gate.error_upload'));
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Not locked — render normally
    if (!isLocked) return <>{children}</>;

    // Loading state
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 font-medium">{t('gate.loading_space')}</p>
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
                            {status === 'PENDING' ? t('gate.step_pending') : status === 'REJECTED' ? t('gate.step_rejected') : t('gate.step_suspended')}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={refetch}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
                    >
                        <RefreshCw size={14} />
                        {t('gate.refresh')}
                    </button>
                    <button
                        onClick={logout}
                        className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition font-medium"
                    >
                        <LogOut size={14} />
                        {t('gate.logout')}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex items-start justify-center px-4 py-10">
                <div className="w-full max-w-3xl space-y-6">

                    {/* Welcome Header */}
                    <div className="text-center mb-2">
                        <h1 className="text-3xl font-black text-gray-900">
                            {t('gate.welcome')}, {subscription?.name || user?.username} 👋
                        </h1>
                        <p className="text-gray-500 mt-1">{t('gate.ready_approval')}</p>
                    </div>

                    {/* Status Banner */}
                    <StatusBanner status={status} rejectionReason={subscription?.rejection_reason} />

                    {/* Plan Card — Beautiful gradient */}
                    <div className={`rounded-3xl bg-gradient-to-br ${plan.gradient} text-white shadow-xl shadow-blue-900/20 overflow-hidden`}>
                        {/* Plan Header */}
                        <div className="p-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-2">{t('gate.your_subscription')}</p>
                                    <h2 className="text-4xl font-black">{t('gate.plan')} {t(plan.label)}</h2>
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
                                    <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">{t('gate.monthly')}</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black">{plan.price}</span>
                                        <span className="text-lg font-medium text-white/70">DA</span>
                                    </div>
                                    <p className="text-white/50 text-xs mt-1">{t('gate.per_month')}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">{t('gate.annually')}</p>
                                        <span className="bg-green-400/20 text-green-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-green-400/30">{t('gate.off')}</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black">{plan.priceYear}</span>
                                        <span className="text-lg font-medium text-white/70">DA</span>
                                    </div>
                                    <p className="text-white/50 text-xs mt-1">{t('gate.per_year')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="bg-black/20 backdrop-blur-sm px-8 py-6">
                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">{t('gate.included_features')}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {plan.features.map((feat, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm text-white/90">{t(feat)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* What Happens Next */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <h3 className="font-black text-gray-900 text-xl mb-6 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                            {t('gate.how_to_activate')}
                        </h3>
                        <div className="space-y-5">
                            {[
                                {
                                    step: '1',
                                    title: t('gate.step_1_title'),
                                    desc: t('gate.step_1_desc'),
                                    done: status !== 'PENDING',
                                    active: status === 'PENDING',
                                },
                                {
                                    step: '2',
                                    title: `${t('gate.step_2_title')} — ${plan.price} DA/${t('dashboard.overview.month_short')}`,
                                    desc: t('gate.step_2_desc'),
                                    done: status === 'ACTIVE',
                                    active: status === 'REJECTED',
                                },
                                {
                                    step: '3',
                                    title: t('gate.step_3_title'),
                                    desc: t('gate.step_3_desc'),
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

                    {/* Payment Proof Section */}
                    {status === 'PENDING' && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                            <h3 className="font-black text-gray-900 text-xl mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-indigo-600" />
                                {t('gate.payment_proof')}
                            </h3>
                            <p className="text-gray-500 text-sm mb-6">
                                {t('gate.payment_proof_desc')}
                            </p>
                            
                            {subscription?.payment_proof_url ? (
                                <div className="rounded-2xl border-2 border-emerald-100 bg-emerald-50 p-6 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-emerald-900 text-lg">{t('gate.proof_sent')}</h4>
                                        <p className="text-emerald-700 mt-1 text-sm font-medium">{t('gate.proof_sent_desc')}</p>
                                    </div>
                                    <div className="ml-auto w-16 h-16 rounded-lg overflow-hidden border border-emerald-200 shadow-sm hidden sm:block bg-white">
                                        <a href={subscription.payment_proof_url} target="_blank" rel="noopener noreferrer">
                                            <img src={subscription.payment_proof_url} alt="Reçu" className="w-full h-full object-cover hover:opacity-80 transition" />
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition cursor-pointer group"
                                >
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileUpload} 
                                        accept="image/*,.pdf" 
                                        className="hidden" 
                                    />
                                    {uploading ? (
                                        <div className="flex flex-col items-center justify-center text-blue-600">
                                            <RefreshCw className="w-10 h-10 animate-spin mb-3" />
                                            <p className="font-bold">{t('gate.uploading')}</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500 transition">
                                            <UploadCloud className="w-10 h-10 mb-3" />
                                            <p className="font-bold text-gray-600 group-hover:text-blue-600 text-lg">{t('gate.click_to_add_receipt')}</p>
                                            <p className="text-sm mt-1">{t('gate.accepted_formats')}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Contact Support */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-900/20">
                        <h3 className="font-black text-xl mb-2">{t('gate.need_help')}</h3>
                        <p className="text-blue-100 text-sm mb-6">{t('gate.help_desc')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <a href="tel:+213XXXXXXXXX" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 transition border border-white/20 group">
                                <Phone className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="text-xs text-blue-200 font-medium">{t('gate.phone')}</p>
                                    <p className="text-sm font-bold">Support</p>
                                </div>
                            </a>
                            <a href="mailto:support@trajetour.com" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 transition border border-white/20 group">
                                <Mail className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="text-xs text-blue-200 font-medium">{t('gate.email')}</p>
                                    <p className="text-sm font-bold">support@trajetour.com</p>
                                </div>
                            </a>
                            <a href="https://trajetour.com" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 transition border border-white/20 group">
                                <Globe className="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="text-xs text-blue-200 font-medium">{t('gate.website')}</p>
                                    <p className="text-sm font-bold">trajetour.com</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-400 pb-6">
                        {t('gate.registered_on')} {subscription?.created_at ? new Date(subscription.created_at).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                        {' · '}
                        {subscription?.subdomain}.trajetour.com
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PendingApprovalGate;
