import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supportAPI } from '../../services/api';
import { ArrowLeft, Send, CheckCircle, AlertCircle, Clock, User, UserCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { getAgencyPath } from '../../lib/tenant';
import { fr, arSA } from 'date-fns/locale';
import { useLanguage } from '../../context/LanguageContext';

interface Message {
    id: string;
    ticket_id: string;
    sender_id: string;
    sender_name: string;
    role: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

export default function TicketDetails() {
    const { t, language, direction } = useLanguage();
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [ticket, setTicket] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMsg, setNewMsg] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchTicket();
    }, [id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchTicket = async () => {
        try {
            if (!id) return;
            const data = await supportAPI.getTicket(id);
            setTicket(data.ticket);
            setMessages(data.messages || []);
        } catch (err) {
            console.error('Failed to fetch ticket', err);
            alert(t('support_tickets.error_load_ticket'));
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMsg.trim() || !id) return;

        try {
            const addedMsg = await supportAPI.addMessage(id, newMsg);
            setMessages(prev => [...prev, addedMsg]);
            setNewMsg('');
        } catch (err) {
            console.error('Failed to send message', err);
            alert(t('support_tickets.error_send_message'));
        }
    };

    const handleUpdateStatus = async (status: string) => {
        if (!id) return;
        try {
            await supportAPI.updateStatus(id, status);
            setTicket({ ...ticket, status });
        } catch (err) {
            console.error('Failed to update status', err);
            alert(t('support_tickets.error_update_status'));
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">{t('support_tickets.loading')}</div>;
    if (!ticket) return <div className="p-8 text-center text-gray-500">{t('support_tickets.ticket_not_found')}</div>;

    const basePath = location.pathname.startsWith('/dashboard') ? '/dashboard/support' : getAgencyPath('/support');

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col pt-6 pb-6 px-4" dir={direction}>
            {/* Header */}
            <div className={`flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-4 ${direction === 'rtl' ? 'flex-row-reverse text-right' : 'text-left'}`}>
                    <button
                        onClick={() => navigate(basePath)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                    >
                        {direction === 'rtl' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                    </button>
                    <div>
                        <div className={`flex items-center gap-3 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                ticket.status === 'open' ? 'bg-amber-100 text-amber-700' :
                                ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                                {ticket.status === 'open' ? t('support_tickets.status_open') : 
                                 ticket.status === 'resolved' ? t('support_tickets.status_resolved') : 
                                 t('support_tickets.status_closed')}
                            </span>
                        </div>
                        {user?.role === 'admin' && (
                            <p className={`text-sm text-gray-500 flex items-center gap-1 mt-1 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                <User size={14} /> {t('support_tickets.field_agency')}: {ticket.agency_name}
                            </p>
                        )}
                    </div>
                </div>

                <div className={`flex gap-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                    {ticket.status !== 'resolved' && (
                        <button
                            onClick={() => handleUpdateStatus('resolved')}
                            className="bg-green-50 text-green-600 border border-green-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex items-center gap-2"
                        >
                            <CheckCircle size={16} /> {t('support_tickets.btn_resolve')}
                        </button>
                    )}
                    {ticket.status !== 'open' && (
                        <button
                            onClick={() => handleUpdateStatus('open')}
                            className="bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors flex items-center gap-2"
                        >
                            <AlertCircle size={16} /> {t('support_tickets.btn_reopen')}
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 bg-gray-50 rounded-xl rounded-b-none border border-gray-100 border-b-0 overflow-y-auto p-4 space-y-4 shadow-inner">
                {messages.length === 0 ? (
                    <p className="text-center text-gray-500 mt-10">{t('support_tickets.no_messages')}</p>
                ) : (
                    messages.map((msg, i) => {
                        const isMine = user?.id === msg.sender_id || (user?.role === 'admin' && msg.role === 'admin');
                        
                        return (
                            <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-3 max-w-[80%] ${isMine ? (direction === 'rtl' ? 'flex-row' : 'flex-row-reverse') : (direction === 'rtl' ? 'flex-row-reverse' : 'flex-row')}`}>
                                    <div className="flex-shrink-0 mt-1 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <UserCircle size={20} />
                                    </div>
                                    <div className={direction === 'rtl' ? 'text-right' : 'text-left'}>
                                        {!isMine && (
                                            <p className="text-xs text-gray-500 mb-1 mx-1">
                                                {msg.sender_name || (msg.role === 'admin' ? t('support_tickets.sender_support') : t('support_tickets.sender_agency'))}
                                            </p>
                                        )}
                                        <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                                            isMine ? `bg-blue-600 text-white ${direction === 'rtl' ? 'rounded-tl-none' : 'rounded-tr-none'}` : `bg-white text-gray-800 border border-gray-100 ${direction === 'rtl' ? 'rounded-tr-none' : 'rounded-tl-none'}`
                                        }`}>
                                            <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>
                                        </div>
                                        <div className={`text-[10px] text-gray-400 mt-1 ${isMine ? (direction === 'rtl' ? 'text-left ml-1' : 'text-right mr-1') : (direction === 'rtl' ? 'text-right mr-1' : 'text-left ml-1')}`}>
                                            {format(new Date(msg.created_at), 'dd MMM HH:mm', { locale: language === 'fr' ? fr : arSA })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className={`bg-white p-3 rounded-xl rounded-t-none border border-gray-100 shadow-sm flex items-end gap-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <textarea
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                        }
                    }}
                    placeholder={t('support_tickets.message_type_placeholder')}
                    className={`flex-1 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none py-3 px-4 text-[15px] min-h-[50px] max-h-32 shadow-inner ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
                    rows={1}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!newMsg.trim()}
                    className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    <Send size={20} className={direction === 'rtl' ? 'rotate-180' : ''} />
                </button>
            </div>
        </div>
    );
}
