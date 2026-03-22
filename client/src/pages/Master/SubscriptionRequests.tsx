import { useState, useEffect, useCallback } from 'react';
import { masterAPI } from '../../services/api';
import {
    CheckCircle2, XCircle, Clock, RefreshCw, AlertTriangle, Building2, CreditCard, ChevronRight
} from 'lucide-react';

interface SubscriptionRequest {
    id: string;
    agency_id: string;
    type: 'UPGRADE_PLAN';
    current_value: string;
    requested_value: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    notes: string | null;
    created_at: string;
    updated_at: string;
    agency_name: string;
    agency_subdomain: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', label: 'En attente' },
    APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Approuvée' },
    REJECTED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Rejetée' },
};

const PLAN_STYLES: Record<string, { bg: string; text: string; border: string }> = {
    Standard: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    Premium: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    Gold: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

const SubscriptionRequests = () => {
    const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('ALL');
    const [rejectModal, setRejectModal] = useState<{ open: boolean; request: SubscriptionRequest | null }>({ open: false, request: null });
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const data = await masterAPI.getSubscriptionsRequests();
            setRequests(data);
        } catch (err) {
            console.error('Failed to fetch subscription requests:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED', notes?: string) => {
        if (status === 'APPROVED' && !window.confirm('Êtes-vous sûr de vouloir APPROUVER ce surclassement ?\nLe plan de l\'agence sera modifié immédiatement.')) return;
        
        setActionLoading(id);
        try {
            await masterAPI.updateRequestStatus(id, status, notes);
            await fetchRequests();
            if (status === 'REJECTED') {
                setRejectModal({ open: false, request: null });
                setRejectionReason('');
            }
        } catch (err) {
            console.error('Failed to update request status:', err);
            alert('Erreur lors de la mise à jour de la demande.');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredRequests = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);

    return (
        <div className="space-y-6 p-6 min-h-screen bg-gray-50">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <span className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                            <CreditCard size={22} />
                        </span>
                        Demandes de Surclassement
                    </h1>
                    <p className="text-gray-500 mt-1 ml-1">Gérez les demandes de changement de plan d'abonnement des agences.</p>
                </div>
                <button
                    onClick={fetchRequests}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium shadow-sm"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Actualiser
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap bg-white p-1 rounded-xl border border-gray-200/80 w-fit">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            filter === s
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-transparent text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {s === 'ALL' ? 'Toutes' : STATUS_STYLES[s]?.label || s}
                        <span className="ml-1.5 opacity-70">
                            ({s === 'ALL' ? requests.length : requests.filter(r => r.status === s).length})
                        </span>
                    </button>
                ))}
            </div>

            {/* Requests List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse h-32" />
                    ))}
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-20 flex flex-col items-center justify-center text-gray-400">
                    <CreditCard size={48} className="mb-4 opacity-30" />
                    <p className="text-lg font-semibold">Aucune demande trouvée</p>
                    <p className="text-sm mt-1">Vous êtes à jour !</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
                    {filteredRequests.map(request => {
                        const curStyle = PLAN_STYLES[request.current_value] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                        const reqStyle = PLAN_STYLES[request.requested_value] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                        const status = STATUS_STYLES[request.status];
                        const isLoading = actionLoading === request.id;

                        return (
                            <div key={request.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{request.agency_name}</h3>
                                            <p className="text-xs text-gray-500">{request.agency_subdomain}.trajetour.com</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${curStyle.bg} ${curStyle.text} ${curStyle.border}`}>
                                            {request.current_value}
                                        </span>
                                        <ChevronRight size={14} className="text-gray-400" />
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border animate-pulse ${reqStyle.bg} ${reqStyle.text} ${reqStyle.border}`}>
                                            {request.requested_value}
                                        </span>
                                    </div>

                                    {request.notes && (
                                        <div className="bg-slate-50 rounded-xl p-3 text-sm text-gray-600 max-w-xl">
                                            <p className="font-semibold text-xs text-gray-400 uppercase mb-1">Note de l'agence :</p>
                                            {request.notes}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <span>Demandé le: {new Date(request.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-col items-end gap-3 justify-between md:justify-end">
                                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                        {status.label}
                                    </span>

                                    {request.status === 'PENDING' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setRejectModal({ open: true, request })}
                                                disabled={isLoading}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition"
                                            >
                                                <XCircle size={14} /> Rejeter
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(request.id, 'APPROVED')}
                                                disabled={isLoading}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold transition shadow-sm"
                                            >
                                                {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                Approuver
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal.open && rejectModal.request && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-11 h-11 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                                <XCircle size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Rejeter la demande</h3>
                                <p className="text-sm text-gray-500">{rejectModal.request.agency_name}</p>
                            </div>
                        </div>

                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Motif du rejet <span className="text-gray-400">(optionnel)</span>
                        </label>
                        <textarea
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            placeholder="Ex: Solde insuffisant, etc..."
                            rows={4}
                            className="w-full border border-gray-100 rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition"
                        />
                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => { setRejectModal({ open: false, request: null }); setRejectionReason(''); }}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => handleUpdateStatus(rejectModal.request!.id, 'REJECTED', rejectionReason)}
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
        </div>
    );
};

export default SubscriptionRequests;
