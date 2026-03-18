import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Plane, Users, CreditCard, Bell, FileText, LogOut,
    TrendingUp, TrendingDown, ArrowRight, Star, CheckCircle, Clock,
    BarChart3, Calendar, Menu, X, ChevronDown, Sparkles
} from 'lucide-react';

// ── Demo Data ──────────────────────────────────────────────────────────────
const demoBookings = [
    { ref: 'TJ-2024-001', client: 'Ahmed Benali', package: 'Omrah VIP Ramadan', date: '2024-03-15', status: 'Confirmé', amount: '350,000 DA' },
    { ref: 'TJ-2024-002', client: 'Fatima Zerrouqi', package: 'Hajj Premium 2026', date: '2024-06-10', status: 'En attente', amount: '680,000 DA' },
    { ref: 'TJ-2024-003', client: 'Mohamed Kaci', package: 'Omrah Économique', date: '2024-02-20', status: 'Payé', amount: '180,000 DA' },
    { ref: 'TJ-2024-004', client: 'Amina Boudiaf', package: 'Omrah VIP Ramadan', date: '2024-03-28', status: 'Confirmé', amount: '350,000 DA' },
    { ref: 'TJ-2024-005', client: 'Khalid Mansouri', package: 'Hajj Premium 2026', date: '2024-06-10', status: 'En attente', amount: '680,000 DA' },
];

const demoStats = [
    { label: 'Revenus ce mois', value: '4,280,000 DA', change: '+12.5%', up: true, icon: CreditCard, color: 'emerald' },
    { label: 'Réservations actives', value: '47', change: '+8', up: true, icon: Plane, color: 'blue' },
    { label: 'Clients total', value: '342', change: '+23', up: true, icon: Users, color: 'violet' },
    { label: 'Taux conversion', value: '68%', change: '-2%', up: false, icon: BarChart3, color: 'orange' },
];

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: Plane, label: 'Réservations', active: false },
    { icon: Users, label: 'Clients', active: false },
    { icon: CreditCard, label: 'Paiements', active: false },
    { icon: Calendar, label: 'Calendrier', active: false },
    { icon: FileText, label: 'Rapports', active: false },
    { icon: Bell, label: 'Notifications', active: false },
];

const statusColors: Record<string, string> = {
    'Payé': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    'Confirmé': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    'En attente': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    'Annulé': 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const chartData = [40, 65, 55, 80, 70, 90, 75, 95, 85, 100, 88, 95];
const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const DemoAgencyDashboard = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeNav, setActiveNav] = useState(0);

    return (
        <div className="min-h-screen bg-[#050914] text-white flex flex-col">

            {/* ── Demo Banner ── */}
            <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} />
                    <span className="font-medium">Mode Démonstration — Explorez toutes les fonctionnalités</span>
                </div>
                <button
                    onClick={() => navigate('/agency-signup')}
                    className="bg-white text-blue-600 font-bold px-4 py-1 rounded-full text-xs hover:bg-blue-50 transition-colors"
                >
                    Créer mon compte →
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">

                {/* ── Sidebar ── */}
                <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a1020] border-r border-white/5 flex flex-col pt-[42px] transition-transform duration-300 md:relative md:translate-x-0 md:pt-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-black">T</div>
                        <div>
                            <p className="font-bold text-sm text-white">Al Nour Travel</p>
                            <p className="text-[10px] text-gray-500">Demo Agency • Pro Plan</p>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto text-gray-500 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 px-3 py-4 overflow-y-auto">
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-3">Menu principal</p>
                        {navItems.map((item, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveNav(i)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all text-sm font-medium ${activeNav === i
                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon size={18} />
                                {item.label}
                                {i === 6 && (
                                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">3</span>
                                )}
                            </button>
                        ))}
                    </nav>

                    {/* Upgrade prompt */}
                    <div className="m-3 p-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20">
                        <p className="text-xs font-bold text-white mb-1">Plan Demo</p>
                        <p className="text-[11px] text-gray-400 mb-3">Passez au Pro pour débloquer toutes les fonctionnalités</p>
                        <button
                            onClick={() => navigate('/agency-signup')}
                            className="w-full py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-bold rounded-lg hover:opacity-90 transition"
                        >
                            Passer au Pro
                        </button>
                    </div>
                </aside>

                {/* ── Main Content ── */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

                    {/* Header */}
                    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a1020]">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-400 hover:text-white">
                                <Menu size={20} />
                            </button>
                            <div>
                                <h1 className="text-lg font-bold text-white">Tableau de bord</h1>
                                <p className="text-xs text-gray-500">Bienvenue, Mohammed — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                                <Bell size={16} className="text-gray-400" />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                            </button>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                                <img src="https://ui-avatars.com/api/?name=Mohammed+Demo&background=3b82f6&color=fff&size=32" className="w-7 h-7 rounded-full" alt="User" />
                                <span className="text-sm font-medium text-white hidden md:block">Mohammed Demo</span>
                                <ChevronDown size={14} className="text-gray-500 hidden md:block" />
                            </div>
                        </div>
                    </header>

                    {/* Dashboard content */}
                    <div className="flex-1 overflow-y-auto p-6">

                        {/* Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white">Vue d'ensemble</h2>
                                <p className="text-gray-500 text-sm">Mars 2024 — Mise à jour en temps réel</p>
                            </div>
                            <button
                                onClick={() => navigate('/agency-signup')}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-blue-900/30"
                            >
                                <Plane size={16} />
                                Nouvelle Réservation
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                            {demoStats.map((stat, i) => (
                                <div key={i} className="p-5 rounded-2xl border border-white/5 bg-[#0d1526] hover:border-white/10 transition-all group">
                                    <div className="flex items-start justify-between mb-3">
                                        <p className="text-gray-500 text-xs font-medium">{stat.label}</p>
                                        <div className={`w-8 h-8 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                                            <stat.icon size={16} className={`text-${stat.color}-400`} />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-white mb-2">{stat.value}</p>
                                    <div className={`flex items-center gap-1 text-xs font-semibold ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {stat.change} vs mois dernier
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
                            {/* Revenue Chart */}
                            <div className="xl:col-span-2 p-6 rounded-2xl border border-white/5 bg-[#0d1526]">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="font-bold text-white">Revenus mensuels</h3>
                                        <p className="text-gray-500 text-xs mt-0.5">12 derniers mois</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                        <TrendingUp size={12} className="text-emerald-400" />
                                        <span className="text-emerald-400 text-xs font-bold">+18.2%</span>
                                    </div>
                                </div>
                                {/* Bar chart */}
                                <div className="flex items-end gap-2 h-32">
                                    {chartData.map((h, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                                            <div
                                                className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-violet-500 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                                                style={{ height: `${h}%` }}
                                                title={`${months[i]}: ${h * 42800} DA`}
                                            />
                                            <span className="text-[9px] text-gray-600">{months[i]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Package breakdown */}
                            <div className="p-6 rounded-2xl border border-white/5 bg-[#0d1526]">
                                <h3 className="font-bold text-white mb-4">Répartition packages</h3>
                                {[
                                    { label: 'Omrah VIP', value: 45, color: 'bg-blue-500' },
                                    { label: 'Hajj Premium', value: 30, color: 'bg-violet-500' },
                                    { label: 'Omrah Éco', value: 25, color: 'bg-emerald-500' },
                                ].map((item, i) => (
                                    <div key={i} className="mb-4">
                                        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                                            <span>{item.label}</span>
                                            <span className="font-bold text-white">{item.value}%</span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                                        </div>
                                    </div>
                                ))}

                                <div className="mt-6 pt-4 border-t border-white/5">
                                    <h4 className="text-xs font-bold text-gray-500 mb-3">Statut des réservations</h4>
                                    {[
                                        { label: 'Payées', count: 28, icon: CheckCircle, color: 'text-emerald-400' },
                                        { label: 'En attente', count: 12, icon: Clock, color: 'text-amber-400' },
                                        { label: 'Confirmées', count: 7, icon: Star, color: 'text-blue-400' },
                                    ].map((s, i) => (
                                        <div key={i} className="flex items-center justify-between py-1.5">
                                            <div className="flex items-center gap-2">
                                                <s.icon size={14} className={s.color} />
                                                <span className="text-gray-400 text-xs">{s.label}</span>
                                            </div>
                                            <span className="text-white text-xs font-bold">{s.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bookings Table */}
                        <div className="rounded-2xl border border-white/5 bg-[#0d1526] overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                                <h3 className="font-bold text-white">Réservations récentes</h3>
                                <button className="text-blue-400 text-xs font-bold hover:text-blue-300 transition-colors flex items-center gap-1">
                                    Voir tout <ArrowRight size={12} />
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="text-left px-6 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Référence</th>
                                            <th className="text-left px-6 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Client</th>
                                            <th className="text-left px-6 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider hidden md:table-cell">Package</th>
                                            <th className="text-left px-6 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Date</th>
                                            <th className="text-left px-6 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Statut</th>
                                            <th className="text-right px-6 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {demoBookings.map((b, i) => (
                                            <tr key={i} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-blue-400 text-xs">{b.ref}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <img
                                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(b.client)}&background=3b82f6&color=fff&size=28`}
                                                            className="w-7 h-7 rounded-full"
                                                            alt={b.client}
                                                        />
                                                        <span className="text-white font-medium text-xs">{b.client}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    <span className="text-gray-400 text-xs">{b.package}</span>
                                                </td>
                                                <td className="px-6 py-4 hidden lg:table-cell">
                                                    <span className="text-gray-500 text-xs">{b.date}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusColors[b.status] || 'bg-gray-500/20 text-gray-400'}`}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-white font-bold text-xs">{b.amount}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* CTA at bottom */}
                        <div className="mt-8 p-6 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-600/10 to-violet-600/10">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-white font-bold text-lg">Vous aimez ce que vous voyez ?</h3>
                                    <p className="text-gray-400 text-sm">Créez votre agence en moins de 5 minutes et accédez à toutes les fonctionnalités.</p>
                                </div>
                                <div className="flex gap-3 flex-shrink-0">
                                    <Link to="/" className="px-5 py-2.5 border border-white/20 text-white text-sm font-bold rounded-xl hover:bg-white/10 transition-colors">
                                        En savoir plus
                                    </Link>
                                    <button
                                        onClick={() => navigate('/agency-signup')}
                                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-900/30 flex items-center gap-2"
                                    >
                                        Commencer gratuitement
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemoAgencyDashboard;
