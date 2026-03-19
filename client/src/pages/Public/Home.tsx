import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    LayoutDashboard, Users, Globe, Shield, Zap, BarChart3, CheckCircle, ArrowRight,
    Star, Building2, Plane, CreditCard, Bell, ChevronRight, Play, Sparkles,
    TrendingUp, Clock, Database, Lock, Maximize2, X
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const Home = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [activeFeature, setActiveFeature] = useState(0);
    const [activeScreenshot, setActiveScreenshot] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
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
            title: t('home.features.f1_title'),
            desc: t('home.features.f1_desc'),
            color: 'bg-blue-100 text-blue-600',
            border: 'border-blue-200',
        },
        {
            icon: Globe,
            title: t('home.features.f2_title'),
            desc: t('home.features.f2_desc'),
            color: 'bg-violet-100 text-violet-600',
            border: 'border-violet-200',
        },
        {
            icon: Users,
            title: t('home.features.f3_title'),
            desc: t('home.features.f3_desc'),
            color: 'bg-emerald-100 text-emerald-600',
            border: 'border-emerald-200',
        },
        {
            icon: BarChart3,
            title: t('home.features.f4_title'),
            desc: t('home.features.f4_desc'),
            color: 'bg-orange-100 text-orange-600',
            border: 'border-orange-200',
        },
    ];

    const plans = [
        {
            name: 'Starter',
            monthlyPrice: 2900,
            annualPrice: 24900,
            description: t('home.pricing.starter_desc'),
            highlight: false,
            features: [
                t('home.pricing.starter_f1'),
                t('home.pricing.starter_f2'),
                t('home.pricing.starter_f3'),
                t('home.pricing.starter_f4'),
                t('home.pricing.starter_f5'),
            ],
        },
        {
            name: 'Professional',
            monthlyPrice: 7900,
            annualPrice: 69900,
            description: t('home.pricing.pro_desc'),
            highlight: true,
            features: [
                t('home.pricing.pro_f1'),
                t('home.pricing.pro_f2'),
                t('home.pricing.pro_f3'),
                t('home.pricing.pro_f4'),
                t('home.pricing.pro_f5'),
                t('home.pricing.pro_f6'),
                t('home.pricing.pro_f7'),
            ],
        },
        {
            name: 'Enterprise',
            monthlyPrice: 0,
            annualPrice: 0,
            description: t('home.pricing.enterprise_desc'),
            highlight: false,
            features: [
                t('home.pricing.enterprise_f1'),
                t('home.pricing.enterprise_f2'),
                t('home.pricing.enterprise_f3'),
                t('home.pricing.enterprise_f4'),
                t('home.pricing.enterprise_f5'),
                t('home.pricing.enterprise_f6'),
            ],
        },
    ];

    const testimonials = [
        {
            name: 'Karim Benali',
            role: t('home.testimonials.t1_role'),
            avatar: 'https://ui-avatars.com/api/?name=Karim+Benali&background=3b82f6&color=fff&size=80',
            rating: 5,
            text: t('home.testimonials.t1_text'),
        },
        {
            name: 'Samira Hadj',
            role: t('home.testimonials.t2_role'),
            avatar: 'https://ui-avatars.com/api/?name=Samira+Hadj&background=8b5cf6&color=fff&size=80',
            rating: 5,
            text: t('home.testimonials.t2_text'),
        },
        {
            name: 'Youcef Mansouri',
            role: t('home.testimonials.t3_role'),
            avatar: 'https://ui-avatars.com/api/?name=Youcef+Mansouri&background=10b981&color=fff&size=80',
            rating: 5,
            text: t('home.testimonials.t3_text'),
        },
    ];

    return (
        <>
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
                        {t('home.hero.badge')}
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight tracking-tight mb-6">
                        {t('home.hero.title_start')}{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                            {t('home.hero.title_highlight')}
                        </span>
                    </h1>

                    <p className="text-gray-500 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed mb-10">
                        {t('home.hero.subtitle')}
                        <span className="text-gray-800 font-semibold"> {t('home.hero.subtitle_bold')}</span>
                    </p>

                    <div className="flex flex-wrap gap-4 justify-center mb-16">
                        <button
                            onClick={() => navigate('/agency-signup')}
                            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-lg font-bold rounded-2xl transition-all shadow-xl shadow-blue-200 hover:shadow-blue-300 hover:scale-105"
                        >
                            {t('home.hero.cta_primary')}
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/demo')}
                            className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-200 hover:border-blue-300 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-lg font-bold rounded-2xl transition-all shadow-sm"
                        >
                            <Play size={18} className="text-blue-500" />
                            {t('home.hero.cta_demo')}
                        </button>
                    </div>

                    {/* Trust badges */}
                    <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
                        {[
                            t('home.hero.badge1'),
                            t('home.hero.badge2'),
                            t('home.hero.badge3'),
                            t('home.hero.badge4'),
                        ].map((b, i) => (
                            <span key={i} className="flex items-center gap-1.5">
                                <CheckCircle size={14} className="text-emerald-500" />
                                {b}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Dashboard Showcase Preview */}
                <div className="relative z-10 w-full max-w-6xl mx-auto mt-16 px-4">
                    
                    {/* Tabs / Selectors */}
                    <div className="flex justify-center mb-8 relative z-20">
                        <div className="inline-flex bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-gray-200">
                            {[
                                { id: 0, label: t('home.dashboard_preview.tab_dashboard'), img: '/demo-dashboard-main.png' },
                                { id: 1, label: t('home.dashboard_preview.tab_stats'), img: '/demo-dashboard-stats.png' },
                                { id: 2, label: t('home.dashboard_preview.tab_reservations'), img: '/demo-dashboard-reservations.png' },
                            ].map((tab, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveScreenshot(idx)}
                                    className={`px-5 py-2.5 text-sm md:text-base font-bold rounded-xl transition-all duration-300 whitespace-nowrap ${
                                        activeScreenshot === idx
                                            ? 'text-blue-700 bg-white shadow-sm ring-1 ring-gray-100 flex-1'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex-1'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative rounded-t-[1.5rem] rounded-b-xl border border-gray-800 bg-[#0f172a] shadow-2xl shadow-slate-900/50 overflow-hidden min-h-[400px]">
                        {/* Browser Top Bar */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-[#1e293b]">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                            </div>
                            <div className="flex-1 mx-4 max-w-md bg-[#0f172a] border border-gray-700 rounded-md h-7 flex items-center px-3 mx-auto">
                                <span className="text-gray-400 text-xs font-mono ml-2">app.trajetour.com/agency/dashboard</span>
                            </div>
                        </div>

                        {/* Interactive Image Display */}
                        <div 
                            className="relative w-full overflow-hidden bg-[#0f172a] group cursor-pointer"
                            onClick={() => setIsLightboxOpen(true)}
                        >
                            <img 
                                src={
                                    activeScreenshot === 0 ? '/demo-dashboard-main.png' :
                                    activeScreenshot === 1 ? '/demo-dashboard-stats.png' :
                                    '/demo-dashboard-reservations.png'
                                }
                                alt="Demo Dashboard Preview"
                                className="w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                            />
                            {/* Hover overlay for clicking */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <div className="bg-white/10 backdrop-blur-md rounded-full p-4 border border-white/20 shadow-2xl flex items-center gap-2 text-white font-medium">
                                    <Maximize2 size={24} />
                                    <span>Agrandir</span>
                                </div>
                            </div>
                            {/* Subtle fade effect at bottom of image if it's long */}
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0f172a] to-transparent pointer-events-none" />
                        </div>
                    </div>

                    {/* Shadow glow underneath */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[85%] h-24 bg-blue-500/20 blur-3xl rounded-[100%]" />
                </div>
            </section>

            {/* ─── STATS ─────────────────────────────────────────────── */}
            <section id="stats-counter" className="py-20 px-4 bg-white border-y border-gray-100">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    {[
                        { value: counters.agencies + '+', label: t('home.stats.agencies'), icon: Building2, color: 'text-blue-600 bg-blue-50' },
                        { value: counters.bookings.toLocaleString() + '+', label: t('home.stats.bookings'), icon: Plane, color: 'text-violet-600 bg-violet-50' },
                        { value: counters.revenue + '%', label: t('home.stats.satisfaction'), icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
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
            <section id="features" className="py-24 px-4 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-4">
                            {t('home.features.section_badge')}
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                            {t('home.features.section_title')}
                        </h2>
                        <p className="text-gray-500 text-xl max-w-2xl mx-auto">
                            {t('home.features.section_desc')}
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
                            { icon: CreditCard, label: t('home.features.pill1') },
                            { icon: Bell, label: t('home.features.pill2') },
                            { icon: Database, label: t('home.features.pill3') },
                            { icon: Lock, label: t('home.features.pill4') },
                            { icon: Globe, label: t('home.features.pill5') },
                            { icon: Clock, label: t('home.features.pill6') },
                            { icon: Shield, label: t('home.features.pill7') },
                            { icon: Zap, label: t('home.features.pill8') },
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
                            {t('home.how.title')}
                        </h2>
                        <p className="text-gray-500 text-xl">
                            {t('home.how.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                step: '01',
                                title: t('home.how.step1_title'),
                                desc: t('home.how.step1_desc'),
                                icon: Building2,
                                color: 'bg-blue-600',
                            },
                            {
                                step: '02',
                                title: t('home.how.step2_title'),
                                desc: t('home.how.step2_desc'),
                                icon: Zap,
                                color: 'bg-violet-600',
                            },
                            {
                                step: '03',
                                title: t('home.how.step3_title'),
                                desc: t('home.how.step3_desc'),
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
                            {t('home.pricing.section_badge')}
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                            {t('home.pricing.section_title')}
                        </h2>
                        <div className="flex items-center justify-center gap-4 mt-6">
                            <span className={`text-sm font-semibold ${!billingAnnual ? 'text-gray-900' : 'text-gray-400'}`}>{t('home.pricing.monthly')}</span>
                            <button
                                onClick={() => setBillingAnnual(!billingAnnual)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${billingAnnual ? 'bg-blue-600' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${billingAnnual ? 'translate-x-7' : 'translate-x-1'}`} />
                            </button>
                            <span className={`text-sm font-semibold ${billingAnnual ? 'text-gray-900' : 'text-gray-400'}`}>
                                {t('home.pricing.annual')} <span className="text-emerald-600 font-bold">(-20%)</span>
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
                                        ⭐ {t('home.pricing.popular')}
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
                                            <span className={`ml-1 text-sm ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>/{billingAnnual ? t('home.pricing.per_year') : t('home.pricing.per_month')}</span>
                                        </>
                                    ) : (
                                        <span className={`text-2xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{t('home.pricing.custom')}</span>
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
                                    {plan.monthlyPrice === 0 ? t('home.pricing.contact_us') : t('home.pricing.get_started')}
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
                            {t('home.testimonials.section_badge')}
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                            {t('home.testimonials.section_title')}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((t_item, i) => (
                            <div key={i} className="p-8 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-shadow">
                                <div className="flex gap-1 mb-4">
                                    {Array.from({ length: t_item.rating }).map((_, j) => (
                                        <Star key={j} size={16} className="fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-gray-600 leading-relaxed mb-6 italic">"{t_item.text}"</p>
                                <div className="flex items-center gap-3">
                                    <img src={t_item.avatar} alt={t_item.name} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="text-gray-900 font-bold text-sm">{t_item.name}</p>
                                        <p className="text-gray-400 text-xs">{t_item.role}</p>
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
                        {t('home.cta.title')}
                    </h2>
                    <p className="text-blue-100 text-xl mb-10">
                        {t('home.cta.subtitle')}
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <button
                            onClick={() => navigate('/agency-signup')}
                            className="group inline-flex items-center gap-2 px-10 py-4 bg-white text-blue-600 font-bold text-lg rounded-2xl hover:bg-blue-50 transition-all shadow-2xl hover:scale-105"
                        >
                            {t('home.cta.btn_primary')}
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </button>
                        <Link
                            to="/demo"
                            className="inline-flex items-center gap-2 px-10 py-4 border-2 border-white/40 text-white font-bold text-lg rounded-2xl hover:bg-white/10 transition-all"
                        >
                            {t('home.cta.btn_demo')}
                        </Link>
                    </div>
                    <p className="text-blue-200 text-sm mt-6">{t('home.cta.disclaimer')}</p>
                </div>
            </section>
        </div>
        
        {/* Lightbox Overlay */}
        {isLightboxOpen && (
            <div 
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
                onClick={() => setIsLightboxOpen(false)}
            >
                <button 
                    className="absolute top-4 right-4 md:top-8 md:right-8 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full transition-colors backdrop-blur-md border border-white/10"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsLightboxOpen(false);
                    }}
                >
                    <X size={28} />
                </button>
                
                <img 
                    src={
                        activeScreenshot === 0 ? '/demo-dashboard-main.png' :
                        activeScreenshot === 1 ? '/demo-dashboard-stats.png' :
                        '/demo-dashboard-reservations.png'
                    }
                    alt="Zoomed Dashboard Preview"
                    className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/20"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        )}
        </>
    );
};

export default Home;
