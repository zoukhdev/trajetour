import { useState, useEffect, useCallback } from 'react';
import { masterAPI } from '../../services/api';
import {
    Clock, CheckCircle2, XCircle, Globe, Mail, Phone, MapPin,
    User, CreditCard, RefreshCw, Filter, AlertTriangle, Building2, Crown
} from 'lucide-react';

interface Agency {
    id: string;
    name: string;
    subdomain: string;
    owner_email: string;
    contact_name: string;
    phone: string;
    address: string;
    plan: string;
    status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
    created_at: string;
    db_provisioned_at: string | null;
    status_updated_at: string | null;
    rejection_reason: string | null;
    payment_proof_url: string | null;
    neon_branch_id: string | null;
}

const PLAN_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    Basic: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: '🌱' },
    Pro: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '🚀' },
    Enterprise: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '👑' },
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', label: 'En attente' },
    ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Approuvée' },
    REJECTED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Rejetée' },
    SUSPENDED: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Suspendue' },
};

const AgencyRegistrations = () => {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('ALL');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<{ open: boolean; agency: Agency | null }>({ open: false, agency: null });
    const [rejectionReason, setRejectionReason] = useState('');
    const [detailModal, setDetailModal] = useState<Agency | null>(null);

    const fetchAgencies = useCallback(async () => {
        try {
            setLoading(true);
            const data = await masterAPI.getAgencies(filter === 'ALL' ? undefined : filter);
            setAgencies(data);
        } catch (err) {
            console.error('Failed to fetch agencies:', err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchAgencies();
    }, [fetchAgencies]);

    const handleApprove = async (agency: Agency) => {
        if (!window.confirm(`Approuver l'agence "${agency.name}" (plan ${agency.plan}) ?`)) return;
        setActionLoading(agency.id);
        try {
            await masterAPI.updateAgencyStatus(agency.id, 'ACTIVE');
            await fetchAgencies();
        } catch (err) {
            console.error('Approve failed:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!rejectModal.agency) return;
        setActionLoading(rejectModal.agency.id);
        try {
            await masterAPI.updateAgencyStatus(rejectModal.agency.id, 'REJECTED', rejectionReason);
            setRejectModal({ open: false, agency: null });
            setRejectionReason('');
            await fetchAgencies();
        } catch (err) {
            console.error('Reject failed:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleSuspend = async (agency: Agency) => {
        if (!window.confirm(`Suspendre l'agence "${agency.name}" ?`)) return;
        setActionLoading(agency.id);
        try {
            await masterAPI.updateAgencyStatus(agency.id, 'SUSPENDED');
            await fetchAgencies();
        } catch (err) {
            console.error('Suspend failed:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const counts = {
        ALL: agencies.length,
        PENDING: agencies.filter(a => a.status === 'PENDING').length,
        ACTIVE: agencies.filter(a => a.status === 'ACTIVE').length,
        REJECTED: agencies.filter(a => a.status === 'REJECTED').length,
    };

    const filteredAgencies = filter === 'ALL' ? agencies : agencies.filter(a => a.status === filter);

    const PLAN_PRICES: Record<string, string> = {
        Basic: '2 900 DA/mois',
        Pro: '5 900 DA/mois',
        Enterprise: '12 900 DA/mois',
    };

    return (
        <div className="space-y-6 p-6 min-h-screen bg-gray-50">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <span className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                            <Building2 size={22} />
                        </span>
                        Demandes d'inscription
                    </h1>
                    <p className="text-gray-500 mt-1 ml-1">Gérez les demandes d'inscription des nouvelles agences.</p>
                </div>
                <button
                    onClick={fetchAgencies}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium shadow-sm"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Actualiser
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { key: 'ALL', label: 'Total', color: 'blue', icon: Globe },
                    { key: 'PENDING', label: 'En attente', color: 'amber', icon: Clock },
                    { key: 'ACTIVE', label: 'Approuvées', color: 'emerald', icon: CheckCircle2 },
                    { key: 'REJECTED', label: 'Rejetées', color: 'red', icon: XCircle },
                ].map(({ key, label, color, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`bg-white rounded-2xl p-4 border-2 text-left transition-all shadow-sm hover:shadow-md ${
                            filter === key ? `border-${color}-500` : 'border-transparent'
                        }`}
                    >
                        <div className={`w-9 h-9 rounded-lg bg-${color}-50 text-${color}-600 flex items-center justify-center mb-3`}>
                            <Icon size={18} />
                        </div>
                        <div className="text-2xl font-black text-gray-900">
                            {key === 'ALL' ? agencies.length : agencies.filter(a => a.status === key).length}
                        </div>
                        <div className="text-xs font-semibold text-gray-500 mt-0.5 uppercase tracking-wide">{label}</div>
                    </button>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                <Filter size={16} className="text-gray-400 mt-2 ml-1" />
                {['ALL', 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                            filter === s
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                        }`}
                    >
                        {s === 'ALL' ? 'Toutes' : STATUS_STYLES[s]?.label || s}
                        {s !== 'ALL' && (
                            <span className="ml-1.5 opacity-70">({agencies.filter(a => a.status === s).length})</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Agency Cards Grid */}
            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse h-64" />
                    ))}
                </div>
            ) : filteredAgencies.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-20 flex flex-col items-center justify-center text-gray-400">
                    <Globe size={48} className="mb-4 opacity-30" />
                    <p className="text-lg font-semibold">Aucune agence trouvée</p>
                    <p className="text-sm mt-1">
                        {filter === 'PENDING' ? 'Aucune demande en attente.' : `Aucune agence avec le statut "${filter}".`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredAgencies.map(agency => {
                        const plan = PLAN_STYLES[agency.plan] || PLAN_STYLES.Basic;
                        const status = STATUS_STYLES[agency.status] || STATUS_STYLES.PENDING;
                        const isLoading = actionLoading === agency.id;

                        return (
                            <div
                                key={agency.id}
                                onClick={() => setDetailModal(agency)}
                                className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer ${
                                    agency.status === 'PENDING' ? 'border-amber-200' : 'border-gray-100'
                                }`}
                            >
                                {/* Card Top Accent */}
                                <div className={`h-1.5 w-full ${
                                    agency.status === 'PENDING' ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                                    agency.status === 'ACTIVE' ? 'bg-gradient-to-r from-emerald-400 to-teal-400' :
                                    agency.status === 'REJECTED' ? 'bg-gradient-to-r from-red-400 to-rose-400' :
                                    'bg-gray-200'
                                }`} />

                                <div className="p-5">
                                    {/* Header Row */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1 min-w-0 pr-3">
                                            <h3 className="font-bold text-gray-900 text-lg truncate">{agency.name}</h3>
                                            <a
                                                href={`https://${agency.subdomain}.trajetour.com`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 text-sm hover:underline flex items-center gap-1 mt-0.5"
                                            >
                                                <Globe size={12} />
                                                {agency.subdomain}.trajetour.com
                                            </a>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            {/* Status Badge */}
                                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-${agency.status === 'PENDING' ? 'pulse' : 'none'}`} />
                                                {status.label}
                                            </span>
                                            {/* Plan Badge */}
                                            <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${plan.bg} ${plan.text} ${plan.border}`}>
                                                {plan.icon} {agency.plan}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 mb-4">
                                        {agency.contact_name && (
                                            <div className="flex items-center gap-2">
                                                <User size={13} className="text-gray-400 shrink-0" />
                                                <span className="truncate">{agency.contact_name}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Mail size={13} className="text-gray-400 shrink-0" />
                                            <span className="truncate">{agency.owner_email}</span>
                                        </div>
                                        {agency.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone size={13} className="text-gray-400 shrink-0" />
                                                <span>{agency.phone}</span>
                                            </div>
                                        )}
                                        {agency.address && (
                                            <div className="flex items-center gap-2">
                                                <MapPin size={13} className="text-gray-400 shrink-0" />
                                                <span className="truncate">{agency.address}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={13} className="text-gray-400 shrink-0" />
                                            <span className="font-semibold text-gray-700">{PLAN_PRICES[agency.plan] || agency.plan}</span>
                                        </div>
                                    </div>

                                    {/* Rejection Reason */}
                                    {agency.status === 'REJECTED' && agency.rejection_reason && (
                                        <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4 flex gap-2">
                                            <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-red-700">{agency.rejection_reason}</p>
                                        </div>
                                    )}

                                    {/* DB Status */}
                                    <div className={`text-xs rounded-lg px-3 py-2 mb-4 flex items-center gap-2 ${
                                        agency.db_provisioned_at
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-amber-50 text-amber-700'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${agency.db_provisioned_at ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                                        {agency.db_provisioned_at ? '✅ Base de données provisionnée' : '⏳ Base de données en cours de provisionnement...'}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between border-t border-gray-100 pt-3" onClick={e => e.stopPropagation()}>
                                        <span className="text-xs text-gray-400">
                                            {new Date(agency.created_at).toLocaleDateString('fr-FR', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </span>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            {agency.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => setRejectModal({ open: true, agency })}
                                                        disabled={isLoading}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition disabled:opacity-50"
                                                    >
                                                        <XCircle size={13} /> Rejeter
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(agency)}
                                                        disabled={isLoading}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold transition shadow-sm disabled:opacity-50"
                                                    >
                                                        {isLoading ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                                        Approuver
                                                    </button>
                                                </>
                                            )}
                                            {agency.status === 'ACTIVE' && (
                                                <button
                                                    onClick={() => handleSuspend(agency)}
                                                    disabled={isLoading}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-semibold transition disabled:opacity-50"
                                                >
                                                    Suspendre
                                                </button>
                                            )}
                                            {(agency.status === 'REJECTED' || agency.status === 'SUSPENDED') && (
                                                <button
                                                    onClick={() => handleApprove(agency)}
                                                    disabled={isLoading}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition disabled:opacity-50"
                                                >
                                                    Réactiver
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal.open && rejectModal.agency && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-11 h-11 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                                <XCircle size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Rejeter la demande</h3>
                                <p className="text-sm text-gray-500">{rejectModal.agency.name}</p>
                            </div>
                        </div>

                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Motif du rejet <span className="text-gray-400">(optionnel)</span>
                        </label>
                        <textarea
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            placeholder="Ex: Documents manquants, informations incorrectes..."
                            rows={4}
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition"
                        />
                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => { setRejectModal({ open: false, agency: null }); setRejectionReason(''); }}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!!actionLoading}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <RefreshCw size={15} className="animate-spin" /> : null}
                                Confirmer le rejet
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Detail Modal */}
            {detailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDetailModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 md:p-8 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{detailModal.name}</h2>
                                <p className="text-sm text-blue-600 font-medium mt-1">{detailModal.subdomain}.trajetour.com</p>
                            </div>
                            <button onClick={() => setDetailModal(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Contact</p>
                                    <p className="text-sm font-medium text-gray-900">{detailModal.contact_name}</p>
                                    <p className="text-sm text-gray-600">{detailModal.owner_email}</p>
                                    <p className="text-sm text-gray-600">{detailModal.phone}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Adresse</p>
                                    <p className="text-sm text-gray-800">{detailModal.address}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Plan choisi</p>
                                    <p className="text-sm font-bold text-gray-900">{detailModal.plan} <span className="text-gray-500 font-normal">({PLAN_PRICES[detailModal.plan]})</span></p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Statut actuel</p>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${STATUS_STYLES[detailModal.status]?.bg} ${STATUS_STYLES[detailModal.status]?.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[detailModal.status]?.dot}`} />
                                        {STATUS_STYLES[detailModal.status]?.label}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Dates</p>
                                    <p className="text-sm text-gray-600">Inscription: {new Date(detailModal.created_at).toLocaleString('fr-FR')}</p>
                                    {detailModal.status_updated_at && <p className="text-sm text-gray-600">Modifié: {new Date(detailModal.status_updated_at).toLocaleString('fr-FR')}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Payment Proof Section */}
                        <div className="border-t border-gray-100 pt-6 mb-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                                <CreditCard size={16} /> Preuve de paiement
                            </h3>
                            {detailModal.payment_proof_url ? (
                                <div className="rounded-xl overflow-hidden border border-gray-200">
                                    <a href={detailModal.payment_proof_url} target="_blank" rel="noopener noreferrer" className="block w-full">
                                        <img src={detailModal.payment_proof_url} alt="Preuve de paiement" className="w-full max-h-96 object-contain bg-gray-50 hover:opacity-90 transition" />
                                    </a>
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500">
                                    Aucune preuve de paiement téléchargée par l'agence.
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            {detailModal.status === 'PENDING' && (
                                <>
                                    <button
                                        onClick={() => { setDetailModal(null); setRejectModal({ open: true, agency: detailModal }); }}
                                        disabled={!!actionLoading}
                                        className="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition"
                                    >
                                        Rejeter
                                    </button>
                                    <button
                                        onClick={() => { handleApprove(detailModal); setDetailModal(null); }}
                                        disabled={!!actionLoading}
                                        className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm transition"
                                    >
                                        Approuver l'agence
                                    </button>
                                </>
                            )}
                            {detailModal.status === 'ACTIVE' && (
                                <button
                                    onClick={() => { handleSuspend(detailModal); setDetailModal(null); }}
                                    disabled={!!actionLoading}
                                    className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition"
                                >
                                    Suspendre l'agence
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgencyRegistrations;
