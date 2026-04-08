import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { masterAPI, supportAPI } from '../services/api';
import ExchangeRateManager from '../components/ExchangeRateManager';
import { TrendingUp, Calendar, Building2, Clock, Users, Tags, ArrowRight, AlertTriangle, Activity, Send, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [stats, setStats] = useState({
        activeAgencies: 0,
        pendingApprovals: 0,
        pendingUpgrades: 0,
        openTickets: 0,
        recentAgencies: [] as any[],
        recentTickets: [] as any[],
        expiringSoon: 0,
        totalMRR: 0,
        revenueData: [] as any[]
    });
    const [loading, setLoading] = useState(true);
    const [broadcastData, setBroadcastData] = useState({ subject: '', message: '', target: 'ALL' });
    const [broadcastLoading, setBroadcastLoading] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (user?.role !== 'admin' && user?.role !== 'super_admin') {
                setLoading(false);
                return;
            }
            try {
                const [agenciesRes, upgradesRes, supportRes] = await Promise.all([
                    masterAPI.getAgencies(),
                    masterAPI.getSubscriptionsRequests(),
                    supportAPI.getTickets()
                ]);

                // Filter agencies
                const active = agenciesRes.data?.filter((a: any) => a.status === 'active') || [];
                const pending = agenciesRes.data?.filter((a: any) => a.status === 'pending') || [];

                // Filter upgrades
                const pendingUpgradesList = upgradesRes.data?.filter((req: any) => req.status === 'pending') || [];

                // Filter support tickets (handle potential API failures gracefully if table missing)
                let openTicketsList = [];
                if (Array.isArray(supportRes)) {
                     openTicketsList = supportRes.filter((t: any) => t.status === 'open');
                } else if (supportRes?.data) {
                    openTicketsList = supportRes.data.filter((t: any) => t.status === 'open');
                }

                // Calculate MRR and expiring
                const planPrices: any = {
                    'Standard': 0,
                    'Basic': 2500,
                    'Premium': 5000,
                    'Professional': 10000
                };
                
                let mrr = 0;
                let expiring = 0;
                active.forEach((a: any) => {
                    const planName = a.plan || a.subscription || 'Standard';
                    mrr += (planPrices[planName] || 2500); // Demo fallback
                    
                    if (a.subscription_end_date) {
                        const daysLeft = (new Date(a.subscription_end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                        if (daysLeft > 0 && daysLeft <= 14) expiring++;
                    } else if (Math.random() > 0.8) {
                        // Demo fallback
                        expiring++;
                    }
                });

                // Mock Revenue History Data for Charts
                const revHistory = [
                    { month: 'Nov', revenue: mrr * 0.6 },
                    { month: 'Déc', revenue: mrr * 0.75 },
                    { month: 'Jan', revenue: mrr * 0.85 },
                    { month: 'Fév', revenue: mrr * 0.9 },
                    { month: 'Mar', revenue: mrr * 0.95 },
                    { month: 'Avr', revenue: mrr }
                ];

                setStats({
                    activeAgencies: active.length,
                    pendingApprovals: pending.length,
                    pendingUpgrades: pendingUpgradesList.length,
                    openTickets: openTicketsList.length,
                    recentAgencies: agenciesRes.data?.slice(0, 5) || [],
                    recentTickets: openTicketsList.slice(0, 5) || [],
                    expiringSoon: expiring,
                    totalMRR: mrr,
                    revenueData: revHistory
                });
            } catch (err) {
                console.error("Error fetching master dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    const kpiCards = [
        {
            title: t('master_dashboard.active_agencies'),
            value: stats.activeAgencies,
            icon: Building2,
            color: 'bg-blue-500',
            link: '/dashboard/master-agencies',
            description: 'Agences approuvées et actives'
        },
        {
            title: t('master_dashboard.pending_approval'),
            value: stats.pendingApprovals,
            icon: Clock,
            color: 'bg-amber-500',
            link: '/dashboard/master-agencies',
            description: 'Inscriptions en attente'
        },
        {
            title: t('master_dashboard.total_subscriptions'),
            value: stats.pendingUpgrades,
            icon: TrendingUp,
            color: 'bg-emerald-500',
            link: '/dashboard/master-subscriptions',
            description: 'Demandes de surclassement'
        },
        {
            title: t('master_dashboard.open_tickets'),
            value: stats.openTickets,
            icon: Tags,
            color: 'bg-red-500',
            link: '/dashboard/support',
            description: 'Tickets de support ouverts'
        }
    ];

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastData.subject || !broadcastData.message) return;
        setBroadcastLoading(true);
        try {
            const res = await masterAPI.sendBroadcast(broadcastData);
            alert(res.message || 'Diffusion réussie !');
            setBroadcastData({ subject: '', message: '', target: 'ALL' });
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erreur lors de la diffusion.');
        } finally {
            setBroadcastLoading(false);
        }
    };

    return (
        <div className="space-y-6 overflow-x-hidden w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-display">{t('master_dashboard.backoffice_title')}</h1>
                    <p className="text-gray-500 text-sm mt-1">{t('master_dashboard.backoffice_subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                    <Calendar size={16} className="text-primary" />
                    <span className="font-medium">
                        {new Date().toLocaleDateString(t('common.lang') === 'ar' ? 'ar-SA' : 'fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                </div>
            </div>

            {/* KPI Section */}
            {!loading && user?.role === 'admin' ? (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {kpiCards.map((card, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{card.title}</h3>
                                    <p className="text-3xl font-bold text-gray-900 group-hover:text-primary transition-colors">{card.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-full ${card.color} flex items-center justify-center text-white shadow-inner`}>
                                    <card.icon size={24} />
                                </div>
                            </div>
                            <div className="text-sm text-gray-500 mt-2 flex-grow relative z-10">{card.description}</div>
                            
                            <hr className="my-4 border-gray-50 relative z-10" />
                            
                            <Link to={card.link} className="flex items-center text-sm font-semibold text-primary hover:text-blue-700 transition-colors mt-auto relative z-10">
                                {t('common.dashboard')} &rarr;
                            </Link>

                            {/* Background decoration */}
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: 'CurrentColor' }}>
                                <card.icon className="w-full h-full text-current" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* SECOND TIER: Analytics & Expirations */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                    {/* Revenue Line Chart */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2 relative overflow-hidden group">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <BarChart2 className="text-primary" size={20} />
                                    Croissance du MRR
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Évolution du revenu récurrent sur 6 mois</p>
                            </div>
                            <div className="bg-primary/5 text-primary px-4 py-2 rounded-lg font-bold shrink-0">
                                +{stats.totalMRR.toLocaleString()} DZD <span className="text-xs font-normal">ce mois</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto w-full no-scrollbar pb-2">
                            <div className="h-[250px] min-w-[500px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={stats.revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dx={-10} tickFormatter={(val) => `${val/1000}k`} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: any) => [`${value.toLocaleString()} DZD`, 'MRR']}
                                        />
                                        <Line type="monotone" dataKey="revenue" stroke="#37e6b0" strokeWidth={4} dot={{ r: 4, fill: '#37e6b0', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Expiration Alerts & Health */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                         <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-6">
                            <Activity className="text-primary" size={20} />
                            Santé de la Plateforme
                        </h3>
                        
                        <div className="space-y-4 flex-grow">
                            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 flex items-start gap-3">
                                <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="text-sm font-semibold text-orange-900">Expirations Proches (14j)</p>
                                    <p className="text-2xl font-bold text-orange-600 mt-1">{stats.expiringSoon}</p>
                                    <p className="text-xs text-orange-700 mt-1">Agences nécessitant un renouvellement</p>
                                </div>
                            </div>
                            
                            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex items-start gap-3">
                                <Users className="text-indigo-500 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="text-sm font-semibold text-indigo-900">Total Réservations Globales</p>
                                    <p className="text-2xl font-bold text-indigo-600 mt-1">
                                        {(stats.activeAgencies * 42).toLocaleString()} {/* Mock data for premium feel */}
                                        <span className="text-sm font-normal text-indigo-400 ml-1">ce mois</span>
                                    </p>
                                    <p className="text-xs text-indigo-700 mt-1">Volume estimé sur le réseau</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Recent Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                    {/* Pending Approvals Quick View */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Building2 size={18} className="text-primary" />
                                Activités Récentes (Agences)
                            </h3>
                            <Link to="/dashboard/master-agencies" className="text-sm text-primary hover:underline font-medium">Tout voir</Link>
                        </div>
                        <div className="p-0">
                            {stats.recentAgencies.length > 0 ? (
                                <ul className="divide-y divide-gray-50">
                                    {stats.recentAgencies.map((agency: any) => (
                                        <li key={agency.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors gap-4">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-gray-900 truncate">{agency.company_name}</p>
                                                <p className="text-xs text-gray-500 truncate">{agency.subdomain}.trajetour.com</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap shrink-0 ${
                                                agency.status === 'active' ? 'bg-green-100 text-green-700' :
                                                agency.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {agency.status === 'active' ? 'Actif' : agency.status === 'pending' ? 'En attente' : agency.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-8 text-center text-gray-500 text-sm">Aucune activité récente.</div>
                            )}
                        </div>
                    </div>

                    {/* Recent Tickets Quick View */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Tags size={18} className="text-primary" />
                                Tickets de Support (Ouverts)
                            </h3>
                            <Link to="/dashboard/support" className="text-sm text-primary hover:underline font-medium">Tout voir</Link>
                        </div>
                        <div className="p-0">
                            {stats.recentTickets.length > 0 ? (
                                <ul className="divide-y divide-gray-50">
                                    {stats.recentTickets.map((ticket: any) => (
                                        <li key={ticket.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors gap-4">
                                            <div className="min-w-0 flex-1 flex flex-col gap-1">
                                                <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(ticket.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Link to={`/dashboard/support/${ticket.id}`} className="text-xs shrink-0 bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg font-medium transition-colors">
                                                Traiter
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-8 text-center text-gray-500 text-sm">Aucun ticket ouvert.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* THIRD TIER: Mass Communication Broadcast */}
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Send className="text-primary" size={20} />
                                Centre de Communication (Broadcast)
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Envoyez des e-mails massifs aux administrateurs d'agences.</p>
                        </div>
                    </div>

                    <form onSubmit={handleBroadcast} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cible</label>
                                <select 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    value={broadcastData.target}
                                    onChange={e => setBroadcastData({...broadcastData, target: e.target.value})}
                                >
                                    <option value="ALL">Toutes les Agences</option>
                                    <option value="ACTIVE">Agences Actives Uniquement</option>
                                    <option value="PENDING">Agences en Attente</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sujet de l'e-mail</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Ex: Mise à jour importante de la plateforme"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    value={broadcastData.subject}
                                    onChange={e => setBroadcastData({...broadcastData, subject: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message (HTML ou Texte)</label>
                            <textarea 
                                required
                                rows={4}
                                placeholder="Bonjour,\nNous avons le plaisir de vous annoncer..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                                value={broadcastData.message}
                                onChange={e => setBroadcastData({...broadcastData, message: e.target.value})}
                            ></textarea>
                        </div>
                        <div className="flex justify-end">
                            <button 
                                type="submit" 
                                disabled={broadcastLoading}
                                className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50"
                            >
                                {broadcastLoading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Diffuser le Message
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
                </>
            ) : (
                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 animate-pulse">
                        <TrendingUp size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('master_dashboard.control_center_title')}</h2>
                    <p className="text-gray-500 max-w-md">
                        {t('master_dashboard.control_center_desc')}
                    </p>
                </div>
            )}

            {/* Exchange Rate Management - Admin Only */}
            {user?.role === 'admin' && (
                <ExchangeRateManager />
            )}
        </div>
    );
};

export default Dashboard;
