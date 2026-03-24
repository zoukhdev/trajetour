import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supportAPI } from '../../services/api';
import { ArrowLeft, Send, CheckCircle, AlertCircle, Clock, User, UserCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
            alert('Impossible de charger le ticket.');
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
            alert('Erreur lors de l\\'envoi du message');
        }
    };

    const handleUpdateStatus = async (status: string) => {
        if (!id) return;
        try {
            await supportAPI.updateStatus(id, status);
            setTicket({ ...ticket, status });
        } catch (err) {
            console.error('Failed to update status', err);
            alert('Erreur lors de la mise à jour du statut');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>;
    if (!ticket) return <div className="p-8 text-center text-gray-500">Ticket introuvable.</div>;

    const basePath = location.pathname.startsWith('/dashboard') ? '/dashboard/support' : '/agency/support';

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col pt-6 pb-6 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(basePath)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
                            <span className={\`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase \${
                                ticket.status === 'open' ? 'bg-amber-100 text-amber-700' :
                                ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-700'
                            }\`}>
                                {ticket.status === 'open' ? 'Ouvert' : ticket.status === 'resolved' ? 'Résolu' : 'Fermé'}
                            </span>
                        </div>
                        {user?.role === 'admin' && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <User size={14} /> Agence: {ticket.agency_name}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    {ticket.status !== 'resolved' && (
                        <button
                            onClick={() => handleUpdateStatus('resolved')}
                            className="bg-green-50 text-green-600 border border-green-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex items-center gap-2"
                        >
                            <CheckCircle size={16} /> Résoudre
                        </button>
                    )}
                    {ticket.status !== 'open' && (
                        <button
                            onClick={() => handleUpdateStatus('open')}
                            className="bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors flex items-center gap-2"
                        >
                            <AlertCircle size={16} /> Réouvrir
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 bg-gray-50 rounded-xl rounded-b-none border border-gray-100 border-b-0 overflow-y-auto p-4 space-y-4 shadow-inner">
                {messages.length === 0 ? (
                    <p className="text-center text-gray-500 mt-10">Aucun message. Commencez la discussion !</p>
                ) : (
                    messages.map((msg, i) => {
                        // User's own messages displayed on the right, others on the left
                        // Master users logic: role === 'admin' -> master user
                        const isMine = user?.id === msg.sender_id || (user?.role === 'admin' && msg.role === 'admin');
                        
                        return (
                            <div key={msg.id || i} className={\`flex \${isMine ? 'justify-end' : 'justify-start'}\`}>
                                <div className={\`flex gap-3 max-w-[80%] \${isMine ? 'flex-row-reverse' : 'flex-row'}\`}>
                                    <div className="flex-shrink-0 mt-1 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <UserCircle size={20} />
                                    </div>
                                    <div>
                                        {!isMine && (
                                            <p className="text-xs text-gray-500 mb-1 ml-1">
                                                {msg.sender_name || (msg.role === 'admin' ? 'Support Trajetour' : 'Contact Agence')}
                                            </p>
                                        )}
                                        <div className={\`px-4 py-2.5 rounded-2xl shadow-sm \${
                                            isMine ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                                        }\`}>
                                            <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>
                                        </div>
                                        <div className={\`text-[10px] text-gray-400 mt-1 \${isMine ? 'text-right mr-1' : 'ml-1'}\`}>
                                            {format(new Date(msg.created_at), 'dd MMM HH:mm', { locale: fr })}
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
            <div className="bg-white p-3 rounded-xl rounded-t-none border border-gray-100 shadow-sm flex items-end gap-2">
                <textarea
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                        }
                    }}
                    placeholder="Tapez votre message ici..."
                    className="flex-1 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none py-3 px-4 text-[15px] min-h-[50px] max-h-32 shadow-inner"
                    rows={1}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!newMsg.trim()}
                    className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    <Send size={20} className="rtl:-rotate-90" />
                </button>
            </div>
        </div>
    );
}
