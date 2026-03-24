import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supportAPI, masterAPI } from '../../services/api';
import { Plus, MessageSquare, Clock, CheckCircle, Search, User, AlertCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router-dom';

interface Ticket {
    id: string;
    agency_id: string;
    agency_name: string;
    title: string;
    status: string;
    created_at: string;
    updated_at: string;
    unread_count: string;
}

export default function SupportTickets() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [agencies, setAgencies] = useState<{ id: string, name: string }[]>([]);
    const [selectedAgency, setSelectedAgency] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const navigate = useNavigate();
    const location = useLocation();

    const isMasterDashboard = location.pathname.startsWith('/dashboard');
    const basePath = isMasterDashboard ? '/dashboard/support' : '/agency/support';
    // A user is the platform admin ONLY if they're on the /dashboard path AND have no agencyId
    // Agency users may have role='admin' in their own tenant DB but they always have an agencyId
    const isAdmin = isMasterDashboard && (user?.role === 'admin' || user?.role === 'super_admin') && !user?.agencyId;

    useEffect(() => {
        fetchTickets();
        if (isAdmin) {
            fetchAgencies();
        }
    }, [user]);

    const fetchTickets = async () => {
        try {
            const data = await supportAPI.getTickets();
            setTickets(data);
        } catch (err) {
            console.error('Failed to fetch tickets', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAgencies = async () => {
        try {
            const data = await masterAPI.getAgencies();
            setAgencies(data.map((a: any) => ({ id: a.id, name: a.name || a.subdomain })));
        } catch (err) {
            console.error('Failed to fetch agencies', err);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Admin picks a target agency; agency users always contact master (no agencyId)
            const targetAgency = isAdmin ? (selectedAgency || undefined) : undefined;
            await supportAPI.createTicket(newTitle, newMessage, targetAgency);
            setIsCreateModalOpen(false);
            setNewTitle('');
            setNewMessage('');
            setSelectedAgency('');
            fetchTickets();
        } catch (err) {
            console.error('Failed to create ticket', err);
            alert('Erreur lors de la creation du ticket');
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            return t.title.toLowerCase().includes(s) || (t.agency_name && t.agency_name.toLowerCase().includes(s));
        }
        return true;
    });

    const statusColor: Record<string, string> = {
        open: 'bg-amber-100 text-amber-600',
        resolved: 'bg-green-100 text-green-600',
        closed: 'bg-gray-100 text-gray-500',
    };
    const statusLabel: Record<string, string> = {
        open: 'Ouvert',
        resolved: 'Resolu',
        closed: 'Ferme',
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Support &amp; Aide</h1>
                    <p className="text-gray-500 mt-1">
                        {isAdmin
                            ? 'Gerez les demandes de support des agences'
                            : 'Contactez directement le support Trajetour pour toute assistance'}
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    Nouveau Ticket
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher un ticket..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">Tous les statuts</option>
                    <option value="open">Ouvert</option>
                    <option value="resolved">Resolu</option>
                    <option value="closed">Ferme</option>
                </select>
            </div>

            {/* Ticket List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Chargement...</div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun ticket</h3>
                        <p>
                            {isAdmin
                                ? "Aucune demande de support pour le moment."
                                : "Vous n'avez pas encore de tickets. Cliquez sur 'Nouveau Ticket' pour contacter le support."}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredTickets.map(ticket => (
                            <div
                                key={ticket.id}
                                onClick={() => navigate(`${basePath}/${ticket.id}`)}
                                className="p-4 hover:bg-blue-50/40 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        {/* Status icon */}
                                        <div className={`flex-shrink-0 p-2 rounded-lg ${statusColor[ticket.status] || 'bg-gray-100 text-gray-500'}`}>
                                            {ticket.status === 'open' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusColor[ticket.status]}`}>
                                                    {statusLabel[ticket.status] || ticket.status}
                                                </span>
                                                {parseInt(ticket.unread_count) > 0 && (
                                                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                        {ticket.unread_count} non lu
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                                                {/* Master: show agency badge */}
                                                {isAdmin && (
                                                    <span className="flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                                                        <User size={12} />
                                                        {ticket.agency_name || 'Agence inconnue'}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Clock size={13} />
                                                    {format(new Date(ticket.updated_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Ticket Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Nouveau Ticket de Support</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {isAdmin
                                        ? "Initiez une conversation avec une agence"
                                        : "Votre demande sera envoyee directement au support Trajetour"}
                                </p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 ml-4">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTicket} className="space-y-4">
                            {/* Admin: pick target agency | Agency: show read-only sender info */}
                            {isAdmin ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Agence concernee</label>
                                    <select
                                        required
                                        value={selectedAgency}
                                        onChange={(e) => setSelectedAgency(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Selectionner une agence...</option>
                                        {agencies.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                        <User size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
                                        <p className="text-xs text-gray-500">{user?.email}</p>
                                        <p className="text-xs text-blue-600 mt-0.5">Ce ticket sera envoye au support Trajetour</p>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                                <input
                                    type="text"
                                    required
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: Probleme de connexion..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea
                                    required
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    rows={5}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="Decrivez votre probleme ou demande en detail..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                                >
                                    Envoyer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
