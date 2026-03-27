import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supportAPI, masterAPI } from '../../services/api';
import { Plus, MessageSquare, Clock, CheckCircle, Search, User, AlertCircle, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr, arSA } from 'date-fns/locale';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

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
    const { t, language, direction } = useLanguage();
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
            const targetAgency = isAdmin ? (selectedAgency || undefined) : undefined;
            await supportAPI.createTicket(newTitle, newMessage, targetAgency);
            setIsCreateModalOpen(false);
            setNewTitle('');
            setNewMessage('');
            setSelectedAgency('');
            fetchTickets();
        } catch (err) {
            console.error('Failed to create ticket', err);
            alert(t('support_tickets.error_create'));
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
        open: t('support_tickets.status_open'),
        resolved: t('support_tickets.status_resolved'),
        closed: t('support_tickets.status_closed'),
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6" dir={direction}>
            {/* Header */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('support_tickets.title')}</h1>
                    <p className="text-gray-500 mt-1">
                        {isAdmin
                            ? t('support_tickets.subtitle_admin')
                            : t('support_tickets.subtitle_agency')}
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    {t('support_tickets.new_ticket')}
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className={`absolute ${direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
                    <input
                        type="text"
                        placeholder={t('support_tickets.search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full ${direction === 'rtl' ? 'pr-10 text-right' : 'pl-10 text-left'} py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500`}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
                >
                    <option value="all">{t('support_tickets.filter_all')}</option>
                    <option value="open">{t('support_tickets.status_open')}</option>
                    <option value="resolved">{t('support_tickets.status_resolved')}</option>
                    <option value="closed">{t('support_tickets.status_closed')}</option>
                </select>
            </div>

            {/* Ticket List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">{t('support_tickets.loading')}</div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{t('support_tickets.no_tickets')}</h3>
                        <p>
                            {isAdmin
                                ? t('support_tickets.no_tickets_admin')
                                : t('support_tickets.no_tickets_agency')}
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
                                    <div className={`flex items-start gap-4 flex-1 min-w-0 ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {/* Status icon */}
                                        <div className={`flex-shrink-0 p-2 rounded-lg ${statusColor[ticket.status] || 'bg-gray-100 text-gray-500'}`}>
                                            {ticket.status === 'open' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                                        </div>
                                        <div className={`flex-1 min-w-0 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                                            <div className={`flex items-center gap-2 mb-1 flex-wrap ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                                <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusColor[ticket.status]}`}>
                                                    {statusLabel[ticket.status] || ticket.status}
                                                </span>
                                                {parseInt(ticket.unread_count) > 0 && (
                                                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                        {ticket.unread_count} {t('support_tickets.unread')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`flex items-center gap-3 text-sm text-gray-500 flex-wrap ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                                {/* Master: show agency badge */}
                                                {isAdmin && (
                                                    <span className="flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                                                        <User size={12} />
                                                        {ticket.agency_name || t('support_tickets.unknown_agency')}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Clock size={13} />
                                                    {format(new Date(ticket.updated_at), 'dd MMM yyyy HH:mm', { locale: language === 'fr' ? fr : arSA })}
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
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6" dir={direction}>
                        <div className={`flex justify-between items-center mb-4 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                            <div className={direction === 'rtl' ? 'text-right' : 'text-left'}>
                                <h2 className="text-xl font-bold text-gray-900">{t('support_tickets.modal_title')}</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {isAdmin
                                        ? t('support_tickets.modal_subtitle_admin')
                                        : t('support_tickets.modal_subtitle_agency')}
                                </p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className={`text-gray-400 hover:text-gray-600 ${direction === 'rtl' ? 'mr-4' : 'ml-4'}`}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTicket} className="space-y-4">
                            {/* Admin: pick target agency | Agency: show read-only sender info */}
                            {isAdmin ? (
                                <div className={direction === 'rtl' ? 'text-right' : 'text-left'}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('support_tickets.field_agency')}</label>
                                    <select
                                        required
                                        value={selectedAgency}
                                        onChange={(e) => setSelectedAgency(e.target.value)}
                                        className={`w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
                                    >
                                        <option value="">{t('support_tickets.field_agency_placeholder')}</option>
                                        {agencies.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className={`bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-3 ${direction === 'rtl' ? 'flex-row-reverse text-right' : 'text-left'}`}>
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                        <User size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
                                        <p className="text-xs text-gray-500">{user?.email}</p>
                                        <p className="text-xs text-blue-600 mt-0.5">{t('support_tickets.sent_to_support')}</p>
                                    </div>
                                </div>
                            )}
                            <div className={direction === 'rtl' ? 'text-right' : 'text-left'}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('support_tickets.field_subject')}</label>
                                <input
                                    type="text"
                                    required
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className={`w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
                                    placeholder={t('support_tickets.field_subject_placeholder')}
                                />
                            </div>
                            <div className={direction === 'rtl' ? 'text-right' : 'text-left'}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('support_tickets.field_message')}</label>
                                <textarea
                                    required
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    rows={5}
                                    className={`w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 resize-none ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
                                    placeholder={t('support_tickets.field_message_placeholder')}
                                />
                            </div>
                            <div className={`flex justify-end gap-3 pt-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    {t('audit_logs.na') === 'N/A' ? 'Annuler' : (language === 'ar' ? 'إلغاء' : 'Annuler')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                                >
                                    {t('support_tickets.btn_send')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
