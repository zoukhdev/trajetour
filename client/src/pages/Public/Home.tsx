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
            color: 'bg-blue-100 text-blue-600',
            border: 'border-blue-200',
        },
        {
            icon: Globe,
            title: 'Multi-Tenant SaaS',
            desc: 'Chaque agence obtient son propre espace dédié avec sous-domaine personnalisé et base de données isolée.',
            color: 'bg-violet-100 text-violet-600',
            border: 'border-violet-200',
        },
        {
            icon: Users,
            title: 'Gestion Clients',
            desc: 'CRM intégré pour suivre vos pèlerins, documents, paiements et communications.',
            color: 'bg-emerald-100 text-emerald-600',
            border: 'border-emerald-200',
        },
        {
            icon: BarChart3,
            title: 'Rapports & Analytics',
            desc: 'Rapports financiers détaillés, commissions, revenus et statistiques de performance.',
            color: 'bg-orange-100 text-orange-600',
            border: 'border-orange-200',
        },
    ];

    const plans = [
        {
            name: 'Starter',
            monthlyPrice: 2900,
            annualPrice: 24900,
            description: 'Idéal pour les petites agences',
            highlight: false,
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
            highlight: true,
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
            highlight: false,
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
        <div className="relative w-full overflow-x-hidden bg-white">

            {/* ─── HERO ──────────────────────────────────────────────── */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 pt-24 pb-20 overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
                {/* Soft background blobs */}
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-100 rounded-full blur-[120px] opacity-50 -translate-y-1/2" />
                <div className="absolute top-1/2 right-0 w-96 h-96 bg-violet-100 rounded-full blur-[100px] opacity-40" />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: 'linear-gradient(#1e40af 1px, transparent 1px), linear-gradient(90deg, #1e40af 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                />

                <div className="relative z-10 text-center max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold mb-8">
                        <Sparkles size={14} className="text-blue-500" />
                        La plateforme SaaS #1 pour les agences de voyage Algériennes
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight tracking-tight mb-6">
                        Gérez votre agence{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                            intelligemment
                        </span>
                    </h1>

                    <p className="text-gray-500 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed mb-10">
                        Trajetour est la solution SaaS complète pour digitaliser votre agence de voyage — réservations, clients, finances, et plus.
                        <span className="text-gray-800 font-semibold"> Tout-en-un.</span>
                    </p>

                    <div className="flex flex-wrap gap-4 justify-center mb-16">
                        <button
                            onClick={() => navigate('/agency-signup')}
                            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-lg font-bold rounded-2xl transition-all shadow-xl shadow-blue-200 hover:shadow-blue-300 hover:scale-105"
                        >
                            Commencer Gratuitement
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/demo')}
                            className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-200 hover:border-blue-300 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-lg font-bold rounded-2xl transition-all shadow-sm"
                        >
                            <Play size={18} className="text-blue-500" />
                            Voir la Démo
                        </button>
                    </div>

                    {/* Trust badges */}
                    <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
                        {['Sans carte de crédit', 'Déploiement instantané', 'Support inclus', 'Annulation libre'].map((b, i) => (
                            <span key={i} className="flex items-center gap-1.5">
                                <CheckCircle size={14} className="text-emerald-500" />
                                {b}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Dashboard Preview */}
                <div className="relative z-10 w-full max-w-5xl mx-auto mt-16 px-4">
                    <div className="relative rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-200 overflow-hidden">
                        {/* Fake browser bar */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                            <div className="flex-1 mx-4 bg-white border border-gray-200 rounded-lg h-6 flex items-center px-3">
                                <span className="text-gray-400 text-xs">app.trajetour.com/agency/dashboard</span>
                            </div>
                        </div>
                        {/* Mock dashboard */}
                        <div className="p-6 bg-gray-50">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                {[
                                    { label: 'Réservations', value: '1,247', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                                    { label: 'Revenus (DA)', value: '8.4M', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                                    { label: 'Clients', value: '342', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
                                ].map((card, i) => (
                                    <div key={i} className={`${card.bg} border rounded-xl p-4`}>
                                        <p className="text-gray-500 text-xs mb-1">{card.label}</p>
                                        <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                                    </div>
                                ))}
                            </div>
                            {/* Chart bars */}
                            <div className="bg-white border border-gray-100 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-500 mb-3">Revenus mensuels</p>
                                <div className="flex items-end gap-2 h-20">
                                    {[30, 45, 60, 40, 70, 55, 80, 65, 90, 75, 85, 95].map((h, i) => (
                                        <div key={i} className="flex-1 bg-gradient-to-t from-blue-500 to-violet-400 rounded-t opacity-80" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Shadow glow underneath */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-10 bg-blue-200 blur-2xl opacity-30 rounded-full" />
                </div>
            </section>

            {/* ─── STATS ─────────────────────────────────────────────── */}
            <section id="stats-counter" className="py-20 px-4 bg-white border-y border-gray-100">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    {[
                        { value: counters.agencies + '+', label: 'Agences partenaires', icon: Building2, color: 'text-blue-600 bg-blue-50' },
                        { value: counters.bookings.toLocaleString() + '+', label: 'Réservations traitées', icon: Plane, color: 'text-violet-600 bg-violet-50' },
                        { value: counters.revenue + '%', label: 'Satisfaction client', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center`}>
                                <stat.icon size={28} />
                            </div>
                            <div className="text-5xl font-black text-gray-900">{stat.value}</div>
                            <div className="text-gray-500 font-medium">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── FEATURES ──────────────────────────────────────────── */}
            <section className="py-24 px-4 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-4">
                            FONCTIONNALITÉS
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
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
                                className={`p-8 rounded-2xl border-2 cursor-pointer transition-all bg-white ${activeFeature === i
                                    ? `${feature.border} shadow-lg`
                                    : 'border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-5`}>
                                    <feature.icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Feature pills */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                            <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <item.icon size={16} className="text-blue-600" />
                                </div>
                                <span className="text-gray-600 text-sm font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── HOW IT WORKS ──────────────────────────────────────── */}
            <section className="py-24 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                            Démarrez en moins de 5 minutes
                        </h2>
                        <p className="text-gray-500 text-xl">
                            Pas de configuration complexe, pas de carte de crédit requise
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                step: '01',
                                title: 'Créez votre compte',
                                desc: 'Remplissez le formulaire d\'inscription avec les informations de votre agence.',
                                icon: Building2,
                                color: 'bg-blue-600',
                            },
                            {
                                step: '02',
                                title: 'Espace auto-configuré',
                                desc: 'Votre sous-domaine et base de données sont provisionnés automatiquement en quelques secondes.',
                                icon: Zap,
                                color: 'bg-violet-600',
                            },
                            {
                                step: '03',
                                title: 'Gérez votre agence',
                                desc: 'Connectez-vous à votre tableau de bord et commencez à gérer vos réservations immédiatement.',
                                icon: LayoutDashboard,
                                color: 'bg-emerald-600',
                            },
                        ].map((item, i) => (
                            <div key={i} className="relative p-8 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                                <div className="text-6xl font-black text-gray-100 mb-4 leading-none">{item.step}</div>
                                <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-4 shadow-lg`}>
                                    <item.icon size={22} className="text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                                {i < 2 && (
                                    <div className="hidden md:flex absolute -right-3 top-12 w-6 h-6 bg-blue-100 rounded-full items-center justify-center z-10">
                                        <ChevronRight size={14} className="text-blue-600" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── PRICING ───────────────────────────────────────────── */}
            <section id="pricing" className="py-24 px-4 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 text-sm font-bold mb-4">
                            TARIFS
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                            Des tarifs simples et transparents
                        </h2>
                        <div className="flex items-center justify-center gap-4 mt-6">
                            <span className={`text-sm font-semibold ${!billingAnnual ? 'text-gray-900' : 'text-gray-400'}`}>Mensuel</span>
                            <button
                                onClick={() => setBillingAnnual(!billingAnnual)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${billingAnnual ? 'bg-blue-600' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${billingAnnual ? 'translate-x-7' : 'translate-x-1'}`} />
                            </button>
                            <span className={`text-sm font-semibold ${billingAnnual ? 'text-gray-900' : 'text-gray-400'}`}>
                                Annuel <span className="text-emerald-600 font-bold">(-20%)</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan, i) => (
                            <div
                                key={i}
                                className={`relative p-8 rounded-2xl border-2 flex flex-col transition-all ${plan.highlight
                                    ? 'border-blue-500 bg-gradient-to-b from-blue-600 to-violet-600 text-white shadow-2xl shadow-blue-200 scale-105'
                                    : 'border-gray-100 bg-white shadow-sm hover:shadow-lg hover:border-gray-200'
                                    }`}
                            >
                                {plan.highlight && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-amber-900 text-xs font-black rounded-full uppercase tracking-wide">
                                        ⭐ Populaire
                                    </div>
                                )}

                                <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                                <p className={`text-sm mb-6 ${plan.highlight ? 'text-blue-100' : 'text-gray-500'}`}>{plan.description}</p>

                                <div className="mb-6">
                                    {plan.monthlyPrice > 0 ? (
                                        <>
                                            <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                                                {(billingAnnual ? plan.annualPrice : plan.monthlyPrice).toLocaleString()} DA
                                            </span>
                                            <span className={`ml-1 text-sm ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>/{billingAnnual ? 'an' : 'mois'}</span>
                                        </>
                                    ) : (
                                        <span className={`text-2xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>Sur mesure</span>
                                    )}
                                </div>

                                <ul className="flex flex-col gap-3 mb-8 flex-1">
                                    {plan.features.map((f, j) => (
                                        <li key={j} className={`flex items-start gap-2 text-sm ${plan.highlight ? 'text-blue-50' : 'text-gray-600'}`}>
                                            <CheckCircle size={16} className={`flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-blue-200' : 'text-emerald-500'}`} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => navigate(plan.monthlyPrice === 0 ? '/contact' : '/agency-signup')}
                                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${plan.highlight
                                        ? 'bg-white text-blue-600 hover:bg-blue-50 shadow-md'
                                        : 'bg-gray-900 text-white hover:bg-gray-800'
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
            <section className="py-24 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-100 text-yellow-700 text-sm font-bold mb-4">
                            TÉMOIGNAGES
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                            Ils nous font confiance
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <div key={i} className="p-8 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-shadow">
                                <div className="flex gap-1 mb-4">
                                    {Array.from({ length: t.rating }).map((_, j) => (
                                        <Star key={j} size={16} className="fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-gray-600 leading-relaxed mb-6 italic">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="text-gray-900 font-bold text-sm">{t.name}</p>
                                        <p className="text-gray-400 text-xs">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA ───────────────────────────────────────────────── */}
            <section className="py-24 px-4 bg-gradient-to-br from-blue-600 to-violet-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                        Prêt à digitaliser<br />votre agence ?
                    </h2>
                    <p className="text-blue-100 text-xl mb-10">
                        Rejoignez plus de 120 agences qui font confiance à Trajetour
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <button
                            onClick={() => navigate('/agency-signup')}
                            className="group inline-flex items-center gap-2 px-10 py-4 bg-white text-blue-600 font-bold text-lg rounded-2xl hover:bg-blue-50 transition-all shadow-2xl hover:scale-105"
                        >
                            Démarrer gratuitement
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </button>
                        <Link
                            to="/demo"
                            className="inline-flex items-center gap-2 px-10 py-4 border-2 border-white/40 text-white font-bold text-lg rounded-2xl hover:bg-white/10 transition-all"
                        >
                            Voir la démo
                        </Link>
                    </div>
                    <p className="text-blue-200 text-sm mt-6">Aucune carte de crédit requise • Annulation à tout moment</p>
                </div>
            </section>
        </div>
    );
};

export default Home;
