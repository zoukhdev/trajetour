import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Check, CheckCheck, Trash2, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    category?: string;
    is_read: boolean;
    created_at: string;
}

const Notifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const params = filter === 'unread' ? '?unread_only=true' : '';
            const response = await fetch(`/api/notifications${params}`, {
                credentials: 'include'
            });
            const data = await response.json();
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}/read`, {
                method: 'PATCH',
                credentials: 'include'
            });
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications/mark-all-read', {
                method: 'POST',
                credentials: 'include'
            });
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const clearAllRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'DELETE',
                credentials: 'include'
            });
            setNotifications(notifications.filter(n => !n.is_read));
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 size={20} className="text-green-600" />;
            case 'warning': return <AlertTriangle size={20} className="text-orange-600" />;
            case 'error': return <XCircle size={20} className="text-red-600" />;
            default: return <Info size={20} className="text-blue-600" />;
        }
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins}min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;
        return date.toLocaleDateString('fr-FR');
    };

    return (
        <div className="flex-1 bg-background-light dark:bg-background-dark p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Bell size={28} />
                            Notifications
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {notifications.filter(n => !n.is_read).length} non lue(s)
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={markAllAsRead}
                            disabled={notifications.every(n => n.is_read)}
                            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <CheckCheck size={16} />
                            Tout marquer lu
                        </button>
                        <button
                            onClick={clearAllRead}
                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            Effacer lues
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 flex gap-3">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                                ? 'bg-primary text-white'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                    >
                        Toutes
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'unread'
                                ? 'bg-primary text-white'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                    >
                        Non lues
                    </button>
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
                        <Bell size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                        <p className="text-lg font-medium text-slate-400">Aucune notification</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-4 rounded-xl border transition-all ${notif.is_read
                                        ? 'bg-slate-50 dark:bg-slate-800/50 border-transparent'
                                        : 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900 shadow-sm'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5">{getIcon(notif.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className={`font-bold ${notif.is_read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                                {notif.title}
                                            </h3>
                                            <span className="text-xs text-slate-400 whitespace-nowrap">
                                                {getTimeAgo(notif.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm">{notif.message}</p>
                                        {!notif.is_read && (
                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={() => markAsRead(notif.id)}
                                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                                >
                                                    <Check size={14} />
                                                    Marquer lu
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => deleteNotification(notif.id)}
                                        className="text-slate-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
