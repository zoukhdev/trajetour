import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    LayoutDashboard, Users, Globe, Shield, Zap, BarChart3, CheckCircle, ArrowRight,
    Star, Building2, Plane, CreditCard, Bell, ChevronRight, Play, Sparkles,
    TrendingUp, Clock, Database, Lock
} from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    const [activeFeature, setActiveFeature] = useState(0);
    const [billingAnnual, setBillingAnnual] = useState(false);
    const [counters, setCounters] = useState({ agencies: 0, bookings: 0, revenue: 0 });
    const [countersStarted, setCountersStarted] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !countersStarted) {
                    setCountersStarted(true);
                    animateCounters();
                }
            },
            { threshold: 0.3 }
        );
        const el = document.getElementById('stats-counter');
        if (el) observer.observe(el);
        return () => observer.disconnect();
    }, [countersStarted]);

    const animateCounters = () => {
        const targets = { agencies: 120, bookings: 15000, revenue: 98 };
        const steps = 60;
        let step = 0;
        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const ease = 1 - Math.pow(1 - progress, 3);
            setCounters({
                agencies: Math.floor(targets.agencies * ease),
                bookings: Math.floor(targets.bookings * ease),
                revenue: Math.floor(targets.revenue * ease),
            });
            if (step >= steps) clearInterval(timer);
        }, 30);
    };

    const features = [
        {
            icon: LayoutDashboard,
            title: 'Dashboard Complet',
            desc: 'Tableau de bord en temps réel pour gérer vos réservations, clients et finances depuis un seul endroit.',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            icon: Globe,
            title: 'Multi-Tenant SaaS',
            desc: 'Chaque agence obtient son propre espace dédié avec sous-domaine personnalisé et base de données isolée.',
            color: 'from-violet-500 to-purple-600',
        },
        {
            icon: Users,
            title: 'Gestion Clients',
            desc: 'CRM intégré pour suivre vos pèlerins, documents, paiements et communications.',
            color: 'from-emerald-500 to-green-600',
        },
        {
            icon: BarChart3,
            title: 'Rapports & Analytics',
            desc: 'Rapports financiers détaillés, commissions, revenus et statistiques de performance.',
            color: 'from-orange-500 to-amber-500',
        },
    ];

    const plans = [
        {
            name: 'Starter',
            monthlyPrice: 2900,
            annualPrice: 24900,
            description: 'Idéal pour les petites agences',
            color: 'border-gray-200',
            badge: null,
            features: [
                'Jusqu\'à 100 réservations/mois',
                '2 utilisateurs inclus',
                'Dashboard & rapports de base',
                'Support par email',
                'Sous-domaine personnalisé',
            ],
        },
        {
            name: 'Professional',
            monthlyPrice: 7900,
            annualPrice: 69900,
            description: 'Pour les agences en croissance',
            color: 'border-blue-500',
            badge: 'Populaire',
            features: [
                'Réservations illimitées',
                '10 utilisateurs inclus',
                'Analytics avancés',
                'API & intégrations',
                'Support prioritaire 24/7',
                'Domaine personnalisé',
                'Base de données dédiée',
            ],
        },
        {
            name: 'Enterprise',
            monthlyPrice: 0,
            annualPrice: 0,
            description: 'Solutions sur mesure',
            color: 'border-violet-500',
            badge: 'Sur devis',
            features: [
                'Tout inclus en Professional',
                'Utilisateurs illimités',
                'SLA garanti 99.9%',
                'Onboarding dédié',
                'White-label complet',
                'Infrastructure privée',
            ],
        },
    ];

    const testimonials = [
        {
            name: 'Karim Benali',
            role: 'Directeur — Al Nour Travel, Oran',
            avatar: 'https://ui-avatars.com/api/?name=Karim+Benali&background=3b82f6&color=fff&size=80',
            rating: 5,
            text: 'Depuis que nous utilisons Trajetour, notre productivité a augmenté de 40%. La gestion des dossiers est devenue un jeu d\'enfant.',
        },
        {
            name: 'Samira Hadj',
            role: 'Gérante — Zamzam Tours, Alger',
            avatar: 'https://ui-avatars.com/api/?name=Samira+Hadj&background=8b5cf6&color=fff&size=80',
            rating: 5,
            text: 'L\'interface est intuitive et le support est réactif. En moins d\'une heure, notre équipe était opérationnelle.',
        },
        {
            name: 'Youcef Mansouri',
            role: 'CEO — Baraka Travel, Constantine',
            avatar: 'https://ui-avatars.com/api/?name=Youcef+Mansouri&background=10b981&color=fff&size=80',
            rating: 5,
            text: 'Le rapport qualité-prix est imbattable. Nos clients adorent les confirmations automatiques et le suivi en temps réel.',
        },
    ];

    return (
        <div className="relative w-full overflow-x-hidden bg-[#050914]">

            {/* ─── HERO ──────────────────────────────────────────────── */}
            <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,130,246,0.25),transparent)]" />
                <div className="absolute top-1/4 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-1000" />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}
                />

                <div className="relative z-10 text-center max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium mb-8">
                        <Sparkles size={14} />
                        La plateforme SaaS #1 pour les agences de voyage Algériennes
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight mb-6">
                        Gérez votre agence{' '}
                        <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                            intelligemment
                        </span>
                    </h1>

                    <p className="text-gray-400 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed mb-10">
                        Trajetour est la solution SaaS complète pour digitaliser votre agence de voyage — réservations, clients, finances, et plus.
                        <span className="text-white font-semibold"> Tout-en-un.</span>
                    </p>

                    <div className="flex flex-wrap gap-4 justify-center mb-16">
                        <button
                            onClick={() => navigate('/agency-signup')}
                            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-lg font-bold rounded-2xl transition-all shadow-2xl shadow-blue-900/50 hover:shadow-blue-900/70 hover:scale-105"
                        >
                            Commencer Gratuitement
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/demo')}
                            className="inline-flex items-center gap-2 px-8 py-4 border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white text-lg font-bold rounded-2xl transition-all"
                        >
                            <Play size={18} className="text-blue-400" />
                            Voir la Démo
                        </button>
                    </div>

                    {/* Dashboard preview mock */}
                    <div className="relative mx-auto max-w-4xl">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050914] via-transparent to-transparent z-10 pointer-events-none" style={{ top: '60%' }} />
                        <div className="bg-[#0d1526] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                            {/* Fake browser bar */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#0a1020]">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                                </div>
                                <div className="flex-1 mx-4 bg-white/5 rounded-lg h-6 flex items-center px-3">
                                    <span className="text-gray-500 text-xs">app.trajetour.com/agency/dashboard</span>
                                </div>
                            </div>
                            {/* Mock dashboard content */}
                            <div className="p-6 grid grid-cols-3 gap-4">
                                {[
                                    { label: 'Réservations', value: '1,247', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                                    { label: 'Revenue (DA)', value: '8.4M', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                                    { label: 'Clients', value: '342', color: 'text-violet-400', bg: 'bg-violet-500/10' },
                                ].map((card, i) => (
                                    <div key={i} className={`${card.bg} border border-white/5 rounded-xl p-4`}>
                                        <p className="text-gray-500 text-xs mb-1">{card.label}</p>
                                        <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                                    </div>
                                ))}
                                <div className="col-span-3 bg-white/3 border border-white/5 rounded-xl p-4 h-28 flex items-end gap-1">
                                    {[30, 45, 60, 40, 70, 55, 80, 65, 90, 75, 85, 95].map((h, i) => (
                                        <div key={i} className="flex-1 bg-gradient-to-t from-blue-600 to-violet-500 rounded-t opacity-70" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── STATS ─────────────────────────────────────────────── */}
            <section id="stats-counter" className="py-20 px-4 border-y border-white/5">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    {[
                        { value: counters.agencies + '+', label: 'Agences partenaires', icon: Building2 },
                        { value: counters.bookings.toLocaleString() + '+', label: 'Réservations traitées', icon: Plane },
                        { value: counters.revenue + '%', label: 'Satisfaction client', icon: TrendingUp },
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <stat.icon size={28} className="text-blue-400" />
                            </div>
                            <div className="text-5xl font-black text-white">{stat.value}</div>
                            <div className="text-gray-500 font-medium">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── FEATURES ──────────────────────────────────────────── */}
            <section className="py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-4">
                            FONCTIONNALITÉS
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                            Tout ce dont votre agence a besoin
                        </h2>
                        <p className="text-gray-500 text-xl max-w-2xl mx-auto">
                            Une suite complète d'outils pour gérer chaque aspect de votre activité
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {features.map((feature, i) => (
                            <div
                                key={i}
                                onClick={() => setActiveFeature(i)}
                                className={`p-8 rounded-2xl border cursor-pointer transition-all ${activeFeature === i
                                    ? 'border-blue-500/50 bg-blue-500/5'
                                    : 'border-white/5 bg-white/2 hover:border-white/10'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                                    <feature.icon size={24} className="text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Feature detail grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: CreditCard, label: 'Gestion des paiements' },
                            { icon: Bell, label: 'Notifications auto' },
                            { icon: Database, label: 'Base de données dédiée' },
                            { icon: Lock, label: 'Sécurité entreprise' },
                            { icon: Globe, label: 'Sous-domaine custom' },
                            { icon: Clock, label: 'Support 24/7' },
                            { icon: Shield, label: 'RGPD compliant' },
                            { icon: Zap, label: 'Déploiement instantané' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <item.icon size={16} className="text-blue-400" />
                                </div>
                                <span className="text-gray-400 text-sm font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── HOW IT WORKS ──────────────────────────────────────── */}
            <section className="py-24 px-4 border-y border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                            Démarrez en moins de 5 minutes
                        </h2>
                        <p className="text-gray-500 text-xl">
                            Pas de configuration complexe, pas de carte de crédit requise
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '01',
                                title: 'Créez votre compte',
                                desc: 'Remplissez le formulaire d\'inscription avec les informations de votre agence.',
                                icon: Building2,
                            },
                            {
                                step: '02',
                                title: 'Espace auto-configuré',
                                desc: 'Votre sous-domaine et base de données sont provisionnés automatiquement en quelques secondes.',
                                icon: Zap,
                            },
                            {
                                step: '03',
                                title: 'Gérez votre agence',
                                desc: 'Connectez-vous à votre tableau de bord et commencez à gérer vos réservations immédiatement.',
                                icon: LayoutDashboard,
                            },
                        ].map((item, i) => (
                            <div key={i} className="relative">
                                {i < 2 && (
                                    <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-white/20 to-transparent z-0" />
                                )}
                                <div className="relative z-10 p-8 rounded-2xl border border-white/10 bg-[#0d1526]">
                                    <div className="text-5xl font-black text-white/10 mb-4">{item.step}</div>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mb-4">
                                        <item.icon size={24} className="text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                    <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── PRICING ───────────────────────────────────────────── */}
            <section className="py-24 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-semibold mb-4">
                            TARIFS
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                            Des tarifs simples et transparents
                        </h2>
                        <div className="flex items-center justify-center gap-4 mt-6">
                            <span className={`text-sm font-medium ${!billingAnnual ? 'text-white' : 'text-gray-500'}`}>Mensuel</span>
                            <button
                                onClick={() => setBillingAnnual(!billingAnnual)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${billingAnnual ? 'bg-blue-600' : 'bg-white/20'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${billingAnnual ? 'translate-x-7' : 'translate-x-1'}`} />
                            </button>
                            <span className={`text-sm font-medium ${billingAnnual ? 'text-white' : 'text-gray-500'}`}>
                                Annuel <span className="text-green-400">(-20%)</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan, i) => (
                            <div
                                key={i}
                                className={`relative p-8 rounded-2xl border-2 ${plan.color} ${i === 1 ? 'bg-[#0d1a2e]' : 'bg-[#0a1020]'} flex flex-col`}
                            >
                                {plan.badge && (
                                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white ${i === 1 ? 'bg-gradient-to-r from-blue-600 to-violet-600' : 'bg-violet-600'}`}>
                                        {plan.badge}
                                    </div>
                                )}
                                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                                <p className="text-gray-500 text-sm mb-6">{plan.description}</p>

                                <div className="mb-6">
                                    {plan.monthlyPrice > 0 ? (
                                        <>
                                            <span className="text-4xl font-black text-white">
                                                {(billingAnnual ? plan.annualPrice : plan.monthlyPrice).toLocaleString()} DA
                                            </span>
                                            <span className="text-gray-500 ml-1 text-sm">/{billingAnnual ? 'an' : 'mois'}</span>
                                        </>
                                    ) : (
                                        <span className="text-2xl font-black text-white">Sur mesure</span>
                                    )}
                                </div>

                                <ul className="flex flex-col gap-3 mb-8 flex-1">
                                    {plan.features.map((f, j) => (
                                        <li key={j} className="flex items-start gap-2 text-gray-400 text-sm">
                                            <CheckCircle size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => navigate(plan.monthlyPrice === 0 ? '/contact' : '/agency-signup')}
                                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${i === 1
                                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-90 shadow-lg shadow-blue-900/50'
                                        : 'border border-white/20 text-white hover:bg-white/10'
                                        }`}
                                >
                                    {plan.monthlyPrice === 0 ? 'Nous contacter' : 'Commencer'}
                                    <ChevronRight size={16} className="inline ml-1" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── TESTIMONIALS ──────────────────────────────────────── */}
            <section className="py-24 px-4 border-y border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                            Ils nous font confiance
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <div key={i} className="p-8 rounded-2xl border border-white/10 bg-[#0d1526]">
                                <div className="flex gap-1 mb-4">
                                    {Array.from({ length: t.rating }).map((_, j) => (
                                        <Star key={j} size={16} className="fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-gray-400 leading-relaxed mb-6 italic">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="text-white font-bold text-sm">{t.name}</p>
                                        <p className="text-gray-500 text-xs">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA ───────────────────────────────────────────────── */}
            <section className="py-24 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="relative p-12 rounded-3xl overflow-hidden border border-white/10">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-violet-600/20" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(59,130,246,0.15),transparent)]" />
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                                Prêt à digitaliser<br />votre agence ?
                            </h2>
                            <p className="text-gray-400 text-xl mb-8">
                                Rejoignez plus de 120 agences qui font confiance à Trajetour
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center">
                                <button
                                    onClick={() => navigate('/agency-signup')}
                                    className="group inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-lg rounded-2xl hover:opacity-90 transition-all shadow-2xl shadow-blue-900/50 hover:scale-105"
                                >
                                    Démarrer gratuitement
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                </button>
                                <Link
                                    to="/demo"
                                    className="inline-flex items-center gap-2 px-10 py-4 border border-white/20 text-white font-bold text-lg rounded-2xl hover:bg-white/10 transition-all"
                                >
                                    Voir la démo
                                </Link>
                            </div>
                            <p className="text-gray-600 text-sm mt-6">Aucune carte de crédit requise • Annulation à tout moment</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
