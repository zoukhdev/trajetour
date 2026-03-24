import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supportAPI, masterAPI } from '../../services/api';
import { Plus, MessageSquare, Clock, CheckCircle, Search, User, Filter, AlertCircle, X } from 'lucide-react';
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

    // Determine base path based on route
    const basePath = location.pathname.startsWith('/dashboard') ? '/dashboard/support' : '/agency/support';

    useEffect(() => {
        fetchTickets();
        if (user?.role === 'admin') {
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
            await supportAPI.createTicket(newTitle, newMessage, selectedAgency || undefined);
            setIsCreateModalOpen(false);
            setNewTitle('');
            setNewMessage('');
            setSelectedAgency('');
            fetchTickets();
        } catch (err) {
            console.error('Failed to create ticket', err);
            alert('Erreur lors de la création du ticket');
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return t.title.toLowerCase().includes(searchLower) || (t.agency_name && t.agency_name.toLowerCase().includes(searchLower));
        }
        return true;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Support & Aide</h1>
                    <p className="text-gray-500">
                        {user?.role === 'admin' ? 'Gérez les demandes des agences' : 'Assistance technique et support client'}
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Nouveau Ticket
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher un ticket..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="all">Tous les statuts</option>
                    <option value="open">Ouvert</option>
                    <option value="resolved">Résolu</option>
                    <option value="closed">Fermé</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Chargement...</div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun ticket trouvé</h3>
                        <p>Il n'y a pas de tickets correspondant à vos critères.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredTickets.map(ticket => (
                            <div
                                key={ticket.id}
                                onClick={() => navigate(`${basePath}/${ticket.id}`)}
                                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-lg ${
                                        ticket.status === 'open' ? 'bg-amber-100 text-amber-600' :
                                        ticket.status === 'resolved' ? 'bg-green-100 text-green-600' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                        {ticket.status === 'open' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                                            {parseInt(ticket.unread_count) > 0 && (
                                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    {ticket.unread_count} nouveau(x)
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            {user?.role === 'admin' && (
                                                <span className="flex items-center gap-1">
                                                    <User size={14} />
                                                    {ticket.agency_name || 'Agence inconnue'}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {format(new Date(ticket.updated_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                                            </span>
                                            <span className="capitalize">{ticket.status === 'open' ? 'Ouvert' : ticket.status === 'resolved' ? 'Résolu' : 'Fermé'}</span>
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
                            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Créer un nouveau ticket</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTicket} className="space-y-4">
                            {user?.role === 'admin' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Agence ciblée</label>
                                    <select
                                        required
                                        value={selectedAgency}
                                        onChange={(e) => setSelectedAgency(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Sélectionner une agence...</option>
                                        {agencies.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                                <input
                                    type="text"
                                    required
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ex: Problème de connexion..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message Detailé</label>
                                <textarea
                                    required
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    rows={5}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    placeholder="Décrivez votre problème ou demande en détail..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-colors shadow-md shadow-blue-500/25 font-medium"
                                >
                                    Envoyer le ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
