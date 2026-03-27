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
    { label: 'Revenus ce mois', value: '4,280,000 DA', change: '+12.5%', up: true, icon: CreditCard, color: 'primary' },
    { label: 'Réservations actives', value: '47', change: '+8', up: true, icon: Plane, color: 'secondary' },
    { label: 'Clients total', value: '342', change: '+23', up: true, icon: Users, color: 'primary' },
    { label: 'Taux conversion', value: '68%', change: '-2%', up: false, icon: BarChart3, color: 'secondary' },
];

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: BarChart3, label: 'Statistiques', active: false },
    { icon: Plane, label: 'Réservations', active: false },
    { icon: Users, label: 'Clients', active: false },
    { icon: CreditCard, label: 'Paiements', active: false },
    { icon: FileText, label: 'Caisse / Banques', active: false },
    { icon: Users, label: 'Staff / Agents', active: false },
    { icon: Star, label: 'Remises / Promos', active: false },
    { icon: Bell, label: 'Notifications', active: false },
    { icon: Sparkles, label: 'Paramètres / Site', active: false },
];

const statusColors: Record<string, string> = {
    'Payé': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    'Confirmé': 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
    'En attente': 'bg-secondary-500/20 text-secondary-400 border border-secondary-500/30',
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
            <div className="bg-gradient-to-r from-primary to-secondary px-4 py-2.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} />
                    <span className="font-medium text-white">Mode Démonstration — Explorez toutes les fonctionnalités</span>
                </div>
                <button
                    onClick={() => navigate('/agency-signup')}
                    className="bg-white text-primary font-bold px-4 py-1 rounded-full text-xs hover:bg-white/90 transition-colors"
                >
                    Créer mon compte →
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">

                {/* ── Sidebar ── */}
                <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a1020] border-r border-white/5 flex flex-col pt-[42px] transition-transform duration-300 md:relative md:translate-x-0 md:pt-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-black">T</div>
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
                                    ? 'bg-primary/20 text-secondary border border-secondary/20'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon size={18} />
                                {item.label}
                                {i === 8 && (
                                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">3</span>
                                )}
                            </button>
                        ))}
                    </nav>

                    {/* Upgrade prompt */}
                    <div className="m-3 p-4 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20">
                        <p className="text-xs font-bold text-white mb-1">Plan Demo</p>
                        <p className="text-[11px] text-gray-400 mb-3">Passez au Pro pour débloquer toutes les fonctionnalités</p>
                        <button
                            onClick={() => navigate('/agency-signup')}
                            className="w-full py-2 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold rounded-lg hover:opacity-90 transition"
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
                                <p className="text-xs text-secondary-400 font-medium tracking-wide">Bienvenue, Mohammed — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                                <Bell size={16} className="text-gray-400" />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                            </button>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                                <img src={`https://ui-avatars.com/api/?name=Mohammed+Demo&background=004D40&color=D4AF37&size=32`} className="w-7 h-7 rounded-full" alt="User" />
                                <span className="text-sm font-medium text-white hidden md:block">Mohammed Demo</span>
                                <ChevronDown size={14} className="text-gray-500 hidden md:block" />
                            </div>
                        </div>
                    </header>

                    {/* Dashboard content */}
                    <div className="flex-1 overflow-y-auto p-6">

                        {/* ─── VIEW: DASHBOARD ─── */}
                        {activeNav === 0 && (
                            <div className="animate-in fade-in duration-500">
                                {/* Action Bar */}
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Vue d'ensemble</h2>
                                        <p className="text-secondary-400 text-sm font-medium tracking-wide">Mars 2024 — Mise à jour en temps réel</p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/agency-signup')}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-primary/30"
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
                                                <div className={`w-8 h-8 rounded-lg ${stat.color === 'primary' ? 'bg-primary-500/10' : 'bg-secondary-500/10'} flex items-center justify-center`}>
                                                    <stat.icon size={16} className={stat.color === 'primary' ? 'text-primary-400' : 'text-secondary-400'} />
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
                                                        className="w-full rounded-t-md bg-gradient-to-t from-primary to-secondary opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
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
                                            { label: 'Omrah VIP', value: 45, color: 'bg-primary' },
                                            { label: 'Hajj Premium', value: 30, color: 'bg-secondary' },
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
                                    </div>
                                </div>

                                {/* Recent Bookings Table Preview */}
                                <div className="rounded-2xl border border-white/5 bg-[#0d1526] overflow-hidden">
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                                        <h3 className="font-bold text-white">Réservations récentes</h3>
                                        <button onClick={() => setActiveNav(2)} className="text-secondary-400 text-xs font-bold hover:text-secondary-300 transition-colors flex items-center gap-1">
                                            Voir tout <ArrowRight size={12} />
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-white/5">
                                                    <th className="text-left px-6 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Référence</th>
                                                    <th className="text-left px-6 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Client</th>
                                                    <th className="text-left px-6 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Statut</th>
                                                    <th className="text-right px-6 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Montant</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {demoBookings.slice(0, 3).map((b, i) => (
                                                    <tr key={i} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <span className="font-mono text-secondary-400 text-xs">{b.ref}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <img
                                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(b.client)}&background=004D40&color=D4AF37&size=28`}
                                                                    className="w-7 h-7 rounded-full"
                                                                    alt={b.client}
                                                                />
                                                                <span className="text-white font-medium text-xs">{b.client}</span>
                                                            </div>
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
                            </div>
                        )}

                        {/* ─── VIEW: STATS ─── */}
                        {activeNav === 1 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-white mb-1">Rapports & Statistiques</h2>
                                    <p className="text-gray-500">Analyse détaillée de vos performances commerciales</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                                        <BarChart3 className="text-primary-400 mb-4" size={32} />
                                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Chiffre d'Affaires</h3>
                                        <p className="text-3xl font-black text-white">12,450,000 DA</p>
                                        <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 mt-2">
                                            <TrendingUp size={12} /> +24% vs l'année dernière
                                        </span>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20">
                                        <Users className="text-secondary-400 mb-4" size={32} />
                                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Nouveaux Clients</h3>
                                        <p className="text-3xl font-black text-white">+156</p>
                                        <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 mt-2">
                                            <TrendingUp size={12} /> +12% ce mois
                                        </span>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                                        <Star className="text-emerald-400 mb-4" size={32} />
                                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Note Moyenne</h3>
                                        <p className="text-3xl font-black text-white">4.9/5</p>
                                        <div className="flex gap-0.5 mt-2">
                                            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className="fill-secondary text-secondary" />)}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 rounded-2xl border border-white/5 bg-[#0d1526]">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="font-bold text-white text-lg">Croissance des ventes</h3>
                                        <select className="bg-white/5 border border-white/10 rounded-lg text-xs px-3 py-1.5 focus:outline-none">
                                            <option>Année 2024</option>
                                            <option>Année 2023</option>
                                        </select>
                                    </div>
                                    <div className="relative h-64 flex items-end gap-3 px-4">
                                        {chartData.map((h, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center group relative">
                                                <div 
                                                    className="w-full bg-primary/40 rounded-t-lg transition-all duration-500 group-hover:bg-primary/60"
                                                    style={{ height: `${h}%` }}
                                                />
                                                <div 
                                                    className="absolute bottom-0 w-2/3 bg-secondary rounded-t-lg transition-all duration-700 delay-100"
                                                    style={{ height: `${Math.max(0, h - 20)}%` }}
                                                />
                                                <span className="mt-4 text-[10px] font-bold text-gray-500 uppercase">{months[i]}</span>
                                                
                                                {/* Tooltip on hover */}
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-gray-900 px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                    {(h * 150000).toLocaleString()} DA
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── VIEW: RESERVATIONS ─── */}
                        {activeNav === 2 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black text-white mb-1">Gestion des Réservations</h2>
                                        <p className="text-gray-500">Consultez et gérez vos dossiers clients</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition">
                                            Exporter (CSV)
                                        </button>
                                        <button className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20">
                                            Nouveau Dossier
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                    {['Toutes', 'Confirmées', 'En attente', 'Payées', 'Annulées'].map((f, i) => (
                                        <button key={f} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${i === 0 ? 'bg-primary text-white border-primary' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/20'}`}>
                                            {f}
                                        </button>
                                    ))}
                                </div>

                                <div className="rounded-2xl border border-white/5 bg-[#0d1526] overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-white/2 border-b border-white/5">
                                                <th className="text-left px-6 py-4 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Référence</th>
                                                <th className="text-left px-6 py-4 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Client / Voyageur</th>
                                                <th className="text-left px-6 py-4 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Offre / Service</th>
                                                <th className="text-left px-6 py-4 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Statut</th>
                                                <th className="text-right px-6 py-4 text-[11px] font-bold text-gray-600 uppercase tracking-wider">Total</th>
                                                <th className="px-6 py-4"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {demoBookings.map((b, i) => (
                                                <tr key={i} className="border-b border-white/3 hover:bg-white/2 transition-colors group">
                                                    <td className="px-6 py-5">
                                                        <span className="px-2 py-1 rounded bg-white/5 font-mono text-secondary-400 text-xs border border-white/5">{b.ref}</span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xs font-bold text-white uppercase border border-white/10">
                                                                {b.client.split(' ').map(n => n[0]).join('')}
                                                            </div>
                                                            <div>
                                                                <p className="text-white font-bold text-sm">{b.client}</p>
                                                                <p className="text-[10px] text-gray-500">Contacté il y a 2h</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-2">
                                                            <Plane size={14} className="text-primary-400" />
                                                            <span className="text-gray-300 text-xs font-medium">{b.package}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg ${statusColors[b.status] || 'bg-gray-500/20 text-gray-400'}`}>
                                                            {b.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <p className="text-white font-black text-sm">{b.amount}</p>
                                                        <p className="text-[10px] text-emerald-400 font-bold">Soldé</p>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-primary/20 hover:text-primary-400 transition-colors flex items-center justify-center">
                                                            <ArrowRight size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Action buttons (common for all views or just for dashboard) */}
                        {activeNav !== 2 && (
                            <div className="mt-8 p-6 rounded-2xl border border-secondary/20 bg-gradient-to-r from-primary/10 to-secondary/10">
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
                                            className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/30 flex items-center gap-2"
                                        >
                                            Commencer gratuitement
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemoAgencyDashboard;
