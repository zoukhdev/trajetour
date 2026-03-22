import React, { useState, useEffect, useRef } from 'react';
import { masterAPI } from '../services/api';
import { CreditCard, Shield, Clock, AlertTriangle, CheckCircle2, XCircle, Globe, ExternalLink, Upload, Image, Loader2 } from 'lucide-react';

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
    payment_proof_url: string | null;
}

const PLAN_FEATURES: Record<string, { features: string[]; price: string; color: string }> = {
    Basic: {
        price: '2 900 DA/mois',
        color: 'from-slate-500 to-slate-700',
        features: ["Jusqu'à 3 utilisateurs", 'Gestion des dossiers', 'Rapports de base', 'Support email'],
    },
    Pro: {
        price: '5 900 DA/mois',
        color: 'from-blue-500 to-indigo-700',
        features: ["Jusqu'à 10 utilisateurs", 'Toutes les fonctionnalités', 'Rapports avancés', 'Support prioritaire'],
    },
    Enterprise: {
        price: '12 900 DA/mois',
        color: 'from-purple-500 to-violet-800',
        features: ['Utilisateurs illimités', 'Fonctionnalités exclusives', 'API personnalisée', 'Support dédié 24/7'],
    },
};

const STATUS_CONFIG: Record<string, { icon: React.ReactElement; bg: string; border: string; text: string; title: string; description: string }> = {
    PENDING: {
        icon: <Clock size={20} className="text-amber-600" />,
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        title: "Demande en cours d'examen",
        description: "Votre demande d'inscription est en cours d'examen par notre équipe. Vous serez notifié par email une fois la vérification terminée (généralement sous 24h ouvrables).",
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
        description: "Votre demande a été rejetée. Consultez le motif ci-dessous et contactez notre support pour plus d'informations.",
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

    // Payment proof upload state
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [upgradeNotes, setUpgradeNotes] = useState('');
    const [requesting, setRequesting] = useState(false);
    const [requestError, setRequestError] = useState<string | null>(null);
    const [requestSuccess, setRequestSuccess] = useState(false);

    const handleUpgradeSubmit = async () => {
        if (!selectedPlan) return;
        setRequesting(true);
        setRequestError(null);
        setRequestSuccess(false);
        try {
            await masterAPI.requestUpgrade(selectedPlan, upgradeNotes);
            setIsUpgradeModalOpen(false);
            setUpgradeNotes('');
            setRequestSuccess(true);
            // Re-fetch or show success banner
        } catch (err: any) {
            setRequestError(err?.response?.data?.error || 'Failed submitting upgrade request.');
        } finally {
            setRequesting(false);
        }
    };


    const fetchSubscription = () => {
        setLoading(true);
        masterAPI.getMySubscription()
            .then((data: Subscription) => setSubscription(data))
            .catch((err: unknown) => {
                const e = err as { response?: { data?: { error?: string } } };
                setError(e?.response?.data?.error || "Impossible de charger les informations d'abonnement.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchSubscription();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProofFile(file);
        setUploadError(null);
        setUploadSuccess(false);
        const reader = new FileReader();
        reader.onload = (ev) => setProofPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!proofFile) return;
        setUploading(true);
        setUploadError(null);
        try {
            await masterAPI.uploadPaymentProof(proofFile);
            setUploadSuccess(true);
            setProofFile(null);
            setProofPreview(null);
            // Refresh to show proof
            fetchSubscription();
        } catch (err: any) {
            setUploadError(err?.response?.data?.error || 'Erreur lors du téléchargement. Veuillez réessayer.');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse mb-6">
                <div className="h-5 bg-gray-100 rounded w-48 mb-4" />
                <div className="h-24 bg-gray-50 rounded-xl" />
            </div>
        );
    }

    if (error || !subscription) {
        return null;
    }

    const plan = PLAN_FEATURES[subscription.plan] || PLAN_FEATURES.Basic;
    const statusCfg = STATUS_CONFIG[subscription.status] || STATUS_CONFIG.PENDING;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
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
                                href={(() => {
                                    const currentHost = window.location.host;
                                    const protocol = window.location.protocol;
                                    
                                    if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
                                        const portMatch = currentHost.match(/:\d+/);
                                        const port = portMatch ? portMatch[0] : '';
                                        return `${protocol}//${subscription.subdomain}.localhost${port}`;
                                    } else {
                                        const baseDomain = currentHost.split('.').slice(-2).join('.');
                                        return `${protocol}//${subscription.subdomain}.${baseDomain}`;
                                    }
                                })()}
                                className="text-sm opacity-80 hover:opacity-100 underline"
                                target="_blank" rel="noreferrer"
                            >
                                {subscription.subdomain}.
                                {window.location.host.includes('localhost') 
                                    ? 'localhost' 
                                    : window.location.host.split('.').slice(-2).join('.')}
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
                        {subscription.plan !== 'Gold' && subscription.status === 'ACTIVE' && (
                            <button
                                onClick={() => setIsUpgradeModalOpen(true)}
                                className="mt-2 inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-sm transition"
                            >
                                <ExternalLink size={12} />
                                Upgrade Plan
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isUpgradeModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl animate-scaleIn">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-black text-slate-800">Upgrade Subscription</h3>
                            <button onClick={() => setIsUpgradeModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Select the plan you wish to request an upgrade to. Our team will approve it to apply pricing.</p>
                        
                        <div className="space-y-3">
                            {['Premium', 'Gold'].filter(p => p !== subscription.plan).map(p => (
                                <label key={p} className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer hover:border-blue-500 transition ${selectedPlan === p ? 'border-blue-600 bg-blue-50/30' : 'border-gray-200'}`}>
                                    <div>
                                        <p className="font-bold text-slate-800">{p}</p>
                                        <p className="text-xs text-gray-500">{p === 'Premium' ? '200 listings & 10 users' : 'Unlimited capacity'}</p>
                                    </div>
                                    <input type="radio" name="plan" value={p} checked={selectedPlan === p} onChange={() => setSelectedPlan(p)} />
                                </label>
                            ))}
                        </div>

                        <textarea 
                            className="w-full mt-4 p-3 border border-gray-200 rounded-xl text-sm"
                            rows={3}
                            placeholder="Add nodes or message (optional)..."
                            value={upgradeNotes}
                            onChange={(e) => setUpgradeNotes(e.target.value)}
                        />

                        {requestError && <p className="text-red-600 text-xs mt-2">{requestError}</p>}

                        <button 
                            onClick={handleUpgradeSubmit}
                            disabled={!selectedPlan || requesting}
                            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-2xl font-bold hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {requesting ? <Loader2 size={16} className="animate-spin" /> : 'Submit Upgrade Request'}
                        </button>
                    </div>
                </div>
            )}

            <div className="p-5 space-y-4">
                {/* Success Banner */}
                {requestSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3 animate-scaleIn">
                        <CheckCircle2 size={18} className="text-emerald-500 mt-0.5" />
                        <div>
                            <p className="font-bold text-sm">Demande envoyée !</p>
                            <p className="text-xs opacity-90">Votre demande de surclassement a bien été soumise pour approbation.</p>
                        </div>
                    </div>
                )}

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

                {/* ─── Payment Proof Section — only for PENDING agencies ─── */}
                {subscription.status === 'PENDING' && (
                    <div className="border border-dashed border-amber-300 bg-amber-50/50 rounded-xl p-4">
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2 mb-3">
                            <CreditCard size={14} />
                            Preuve de paiement
                        </p>

                        {subscription.payment_proof_url ? (
                            // Already uploaded
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold mb-2">
                                    <CheckCircle2 size={14} />
                                    Reçu téléchargé — en attente de vérification par notre équipe
                                </div>
                                <a href={subscription.payment_proof_url} target="_blank" rel="noopener noreferrer" className="block">
                                    <img
                                        src={subscription.payment_proof_url}
                                        alt="Preuve de paiement"
                                        className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-white hover:opacity-90 transition"
                                    />
                                </a>
                            </div>
                        ) : (
                            // No proof — let the agency upload it now
                            <div className="space-y-3">
                                {!uploadSuccess && (
                                    <div className="flex items-center gap-2 text-xs text-amber-700 font-semibold">
                                        <AlertTriangle size={13} />
                                        Aucune preuve de paiement reçue. Veuillez télécharger votre reçu pour accélérer la validation.
                                    </div>
                                )}

                                {uploadSuccess && (
                                    <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                        <CheckCircle2 size={14} />
                                        Reçu envoyé avec succès ! Notre équipe va procéder à la vérification.
                                    </div>
                                )}

                                {proofPreview && (
                                    <img
                                        src={proofPreview}
                                        alt="Aperçu"
                                        className="w-full max-h-40 object-contain rounded-lg border border-gray-200 bg-white"
                                    />
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 px-3 py-2 bg-white border border-amber-300 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-50 transition flex-1 justify-center"
                                    >
                                        <Image size={13} />
                                        {proofFile ? proofFile.name : 'Choisir un fichier (image ou PDF)'}
                                    </button>

                                    {proofFile && (
                                        <button
                                            onClick={handleUpload}
                                            disabled={uploading}
                                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition disabled:opacity-60"
                                        >
                                            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                                            {uploading ? 'Envoi...' : 'Envoyer'}
                                        </button>
                                    )}
                                </div>

                                {uploadError && (
                                    <p className="text-xs text-red-600 font-medium">{uploadError}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

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
