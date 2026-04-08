import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Plane, MapPin, Calendar, Star, Shield, Clock, Users, Award, CheckCircle, TrendingUp, ArrowRight, HelpCircle, ChevronDown, ChevronUp, MessageCircle, Mail, Globe } from 'lucide-react';
import { settingsAPI } from '../../services/api';

const AgencyHome = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [destination, setDestination] = useState('omrah');
    const [date, setDate] = useState('');
    const [statsVisible, setStatsVisible] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    
    // Dynamic settings state
    const [settings, setSettings] = useState<any>(null);
    const [slides, setSlides] = useState<any[]>([]);
    const [popularPackages, setPopularPackages] = useState<any[]>([]);

    // Animated counter for stats
    const [stats, setStats] = useState<Record<string, number>>({ clients: 0, packages: 0, years: 0, satisfaction: 0 });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsAPI.getHomepageSettings();
                if (response.settings) setSettings(response.settings);
                if (response.slides && response.slides.length > 0) {
                    setSlides(response.slides.filter((s: any) => s.isActive));
                }
                if (response.featuredOffers && response.featuredOffers.length > 0) {
                    setPopularPackages(response.featuredOffers);
                }
            } catch (error) {
                console.error('Failed to fetch homepage settings:', error);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const statsSection = document.getElementById('stats-section');
            if (statsSection) {
                const rect = statsSection.getBoundingClientRect();
                if (rect.top < window.innerHeight && !statsVisible) {
                    setStatsVisible(true);
                    animateStats();
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [statsVisible]);

    const animateStats = () => {
        if (!settings?.trustStats || settings.trustStats.length === 0) return;
        
        const duration = 2000;
        const steps = 60;
        const interval = duration / steps;

        const initialStats = settings.trustStats.reduce((acc: any, stat: any) => {
            acc[stat.label] = 0;
            return acc;
        }, {});
        
        setStats(initialStats);

        const timer = setInterval(() => {
            let allDone = true;
            const newStats = { ...stats };

            settings.trustStats.forEach((stat: any) => {
                const target = parseInt(stat.value.replace(/[^0-9]/g, '')) || 0;
                const increment = target / steps;
                if (stats[stat.label] < target) {
                    newStats[stat.label] = Math.min(stats[stat.label] + increment, target);
                    allDone = false;
                }
            });

            setStats(newStats);
            if (allDone) clearInterval(timer);
        }, interval);
    };

    const handleSearch = () => {
        let path = '/packages/omrah';
        if (destination.includes('hajj')) {
            path = '/packages/hajj';
        } else if (destination.includes('ramadan')) {
            path = '/packages/omrah';
        } else {
            path = `/packages/${destination}`;
        }

        if (date) {
            path += `?date=${date}`;
        }

        navigate(path);
    };

    const testimonials = [
        {
            name: 'Ahmed Benali',
            location: 'Oran, Algérie',
            rating: 5,
            text: 'Une expérience spirituelle inoubliable. L\'organisation était parfaite du début à la fin.',
            avatar: 'https://ui-avatars.com/api/?name=Ahmed+Benali&background=004D40&color=fff'
        },
        {
            name: 'Fatima Zerrouqi',
            location: 'Alger, Algérie',
            rating: 5,
            text: 'Service exceptionnel, guide très professionnel. Je recommande vivement Trajetour!',
            avatar: 'https://ui-avatars.com/api/?name=Fatima+Zerrouqi&background=D4AF37&color=fff'
        },
        {
            name: 'Mohamed Kaci',
            location: 'Constantine, Algérie',
            rating: 5,
            text: 'Prix compétitifs et qualité au rendez-vous. Mon Hajj s\'est déroulé sans aucun problème.',
            avatar: 'https://ui-avatars.com/api/?name=Mohamed+Kaci&background=00695C&color=fff'
        }
    ];

    const heroImage = slides.length > 0 && slides[0].imageUrl ? slides[0].imageUrl : '/hajj-hero.png';
    const heroTitle = slides.length > 0 && slides[0].title ? slides[0].title : t('home.hero.title');
    const heroDescription = slides.length > 0 && slides[0].description ? slides[0].description : t('home.hero.subtitle');
    const displayName = settings?.displayName || 'Trajetour';

    // Dynamic SEO & Scripts Injection
    useEffect(() => {
        if (!settings) return;

        // Meta tags
        if (settings.seoTitle) document.title = settings.seoTitle;
        
        const updateMeta = (name: string, content: string, property = false) => {
            let el = document.querySelector(property ? `meta[property="${name}"]` : `meta[name="${name}"]`);
            if (!el) {
                el = document.createElement('meta');
                if (property) el.setAttribute('property', name);
                else el.setAttribute('name', name);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };

        if (settings.seoDescription) updateMeta('description', settings.seoDescription);
        if (settings.ogImageUrl) updateMeta('og:image', settings.ogImageUrl, true);

        // Google Analytics
        if (settings.analyticsGaId) {
            if (!document.getElementById('gtag-script')) {
                const script1 = document.createElement('script');
                script1.id = 'gtag-script';
                script1.async = true;
                script1.src = `https://www.googletagmanager.com/gtag/js?id=${settings.analyticsGaId}`;
                document.head.appendChild(script1);
            }
            (window as any).dataLayer = (window as any).dataLayer || [];
            (window as any).dataLayer.push('js', new Date());
            (window as any).dataLayer.push('config', settings.analyticsGaId);
        }

        // Custom Scripts
        if (settings.customScripts) {
            const script = document.createElement('script');
            script.innerHTML = settings.customScripts;
            document.head.appendChild(script);
        }

        // Custom Font
        if (settings.fontFamily && settings.fontFamily !== 'Inter') {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${settings.fontFamily.replace(/ /g, '+')}:wght@400;700;900&display=swap`;
            document.head.appendChild(link);
        }

    }, [settings]);

    return (
        <div className="agency-home relative w-full overflow-hidden">

            {settings ? (
                <style dangerouslySetInnerHTML={{
                    __html: `
                        :root {
                            --primary-color: ${settings.primaryColor || '#004D40'};
                            --secondary-color: ${settings.secondaryColor || '#D4AF37'};
                            --border-radius: ${settings.borderRadius || '12px'};
                        }
                        .agency-home { font-family: '${settings.fontFamily || 'Inter'}', sans-serif !important; }
                        .agency-home .text-primary { color: var(--primary-color) !important; }
                        .agency-home .bg-primary { background-color: var(--primary-color) !important; }
                        .agency-home .btn-primary, .agency-home .rounded-xl, .agency-home .rounded-2xl { border-radius: var(--border-radius) !important; }
                        .agency-home .from-primary { --tw-gradient-from: var(--primary-color) !important; }
                        .agency-home .border-primary { border-color: var(--primary-color) !important; }
                    `
                }} />
            ) : null}

            {/* Hero Section */}
            <div className="relative w-full min-h-[750px] flex flex-col items-center justify-center px-4 bg-cover bg-center bg-no-repeat bg-fixed overflow-hidden"
                style={{ backgroundImage: settings?.videoUrl ? 'none' : `linear-gradient(135deg, rgba(17, 25, 33, 0.7) 0%, rgba(0, 77, 64, 0.6) 100%), url("${heroImage}")` }}>

                {settings?.videoUrl && (
                    <div className="absolute inset-0 z-0">
                        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                            <source src={settings.videoUrl} type="video/mp4" />
                        </video>
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
                    </div>
                )}

                <div className="absolute inset-0 bg-primary/20 to-secondary/20 animate-pulse-slow"></div>

                <div className="flex flex-col gap-8 text-center max-w-[1000px] z-10 animate-fade-in-up">
                    <div className="mx-auto">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium">
                            <Award size={16} className="text-yellow-400" />
                            {t('home.hero.promo_badge')}
                        </span>
                    </div>

                    <h1 className="text-white text-5xl md:text-7xl font-black leading-tight tracking-tight drop-shadow-2xl font-display whitespace-pre-wrap">
                        {heroTitle}
                    </h1>

                    <h2 className="text-gray-100 text-xl md:text-2xl font-medium leading-relaxed max-w-3xl mx-auto drop-shadow-lg whitespace-pre-wrap">
                        {heroDescription}
                    </h2>

                    <div className="flex flex-wrap gap-4 justify-center mt-4">
                        <button
                            onClick={() => navigate('/packages')}
                            className="group inline-flex items-center justify-center rounded-xl h-14 px-10 bg-primary filter hover:brightness-110 text-white text-lg font-bold shadow-2xl shadow-primary/50 transition-all hover:scale-105"
                        >
                            {t('agency_home.discover_more')}
                            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform rtl:rotate-180" size={20} />
                        </button>

                        <button
                            onClick={() => navigate('/contact')}
                            className="inline-flex items-center justify-center rounded-xl h-14 px-10 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white text-lg font-bold border-2 border-white/30 transition-all hover:scale-105"
                        >
                            {t('agency_home.contact_us')}
                        </button>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap gap-8 justify-center mt-8 text-white/90 text-sm font-bold">
                        <div className="flex items-center gap-2">
                            <Shield size={20} className="text-green-400" />
                            <span>{t('home.hero.features.0')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={20} className="text-green-400" />
                            <span>{t('home.hero.features.1')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users size={20} className="text-green-400" />
                            <span>{t('home.hero.features.2')}</span>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
                        <div className="w-1.5 h-2 bg-white rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Search Widget */}
            <div className="w-full px-4 -mt-20 relative z-30 flex justify-center">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-6xl border border-gray-100 dark:border-gray-700 backdrop-blur-xl">
                    <h3 className="text-xl font-bold mb-6 text-[#0e141b] dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <MapPin className="text-primary" size={20} />
                        </div>
                        {t('agency_home.search_packages')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Type de voyage</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Plane className="text-gray-400" size={18} />
                                </div>
                                <select
                                    id="search-destination"
                                    name="destination"
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                    className="block w-full pl-10 pr-4 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-[#0e141b] dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                >
                                    <option value="omrah">{t('agency_home.omrah')}</option>
                                    <option value="hajj">{t('agency_home.hajj')}</option>
                                    <option value="ramadan">{t('agency_home.ramadan')}</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('agency_home.search_placeholder')}</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="text-gray-400" size={18} />
                                </div>
                                <input
                                    id="search-date"
                                    name="departure_date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="block w-full pl-10 pr-4 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-[#0e141b] dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Durée</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Clock className="text-gray-400" size={18} />
                                </div>
                                <select id="search-duration" name="duration" className="block w-full pl-10 pr-4 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-[#0e141b] dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 font-bold">
                                    <option>10 {t('agency_home.days')}</option>
                                    <option>15 {t('agency_home.days')}</option>
                                    <option>21 {t('agency_home.days')}</option>
                                    <option>30 {t('agency_home.days')}</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleSearch}
                                className="w-full h-12 px-6 bg-primary filter hover:brightness-110 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 flex items-center justify-center gap-2"
                            >
                                {t('common.search')}
                                <ArrowRight size={18} className="rtl:rotate-180" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Counter Section */}
            <section id="stats-section" className="py-20 bg-primary text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className={`grid grid-cols-2 md:grid-cols-${(settings?.trustStats?.length || 4)} gap-8`}>
                        {settings?.trustStats && settings.trustStats.length > 0 ? (
                            settings.trustStats.map((stat: any, idx: number) => (
                                <div key={idx} className="text-center transform hover:scale-110 transition-transform">
                                    <div className="text-5xl font-black mb-2">{stat.value}</div>
                                    <div className="text-white/80 text-lg font-bold">{stat.label}</div>
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="text-center transform hover:scale-110 transition-transform">
                                    <div className="flex items-center justify-center mb-4"><Users className="text-yellow-400" size={48} /></div>
                                    <div className="text-5xl font-black mb-2">5,000+</div>
                                    <div className="text-primary-100 text-lg font-bold">{t('agency_home.happy_clients')}</div>
                                </div>
                                <div className="text-center transform hover:scale-110 transition-transform">
                                    <div className="flex items-center justify-center mb-4"><Plane className="text-yellow-400" size={48} /></div>
                                    <div className="text-5xl font-black mb-2">150+</div>
                                    <div className="text-primary-100 text-lg font-bold">Packages</div>
                                </div>
                                <div className="text-center transform hover:scale-110 transition-transform">
                                    <div className="flex items-center justify-center mb-4"><Award className="text-yellow-400" size={48} /></div>
                                    <div className="text-5xl font-black mb-2">10+</div>
                                    <div className="text-primary-100 text-lg font-bold">{t('agency_home.experience')}</div>
                                </div>
                                <div className="text-center transform hover:scale-110 transition-transform">
                                    <div className="flex items-center justify-center mb-4"><TrendingUp className="text-yellow-400" size={48} /></div>
                                    <div className="text-5xl font-black mb-2">98%</div>
                                    <div className="text-primary-100 text-lg font-bold">{t('agency_home.satisfaction')}</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Popular Packages */}
            <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold mb-4">
                            {t('home.hero.promo_badge')}
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                            {t('agency_home.our_packages')}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                           {t('home.features.section_title')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {popularPackages.map((pkg) => (
                            <div key={pkg.id} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden border border-gray-100 dark:border-gray-700 hover:-translate-y-2">
                                <div className="relative h-64 overflow-hidden">
                                    <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                        <span className="font-bold text-sm">{pkg.rating}</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{pkg.title}</h3>
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-4 font-bold">
                                        <Clock size={16} />
                                        <span className="text-sm">{pkg.duration} {t('agency_home.days')}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {pkg.features.map((feature: string, idx: number) => (
                                            <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-end justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">{t('agency_home.from_price')}</p>
                                            <p className="text-3xl font-black text-primary">{pkg.price} <span className="text-sm font-normal">DA</span></p>
                                        </div>
                                        <button
                                            onClick={() => navigate('/packages')}
                                            className="px-6 py-2 bg-primary filter hover:brightness-110 text-white rounded-xl font-bold transition-colors"
                                        >
                                            {t('agency_home.book_now')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <button
                            onClick={() => navigate('/packages')}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:scale-105 transition-transform"
                        >
                            {t('agency_home.discover_more')}
                            <ArrowRight size={20} className="rtl:rotate-180" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="py-20 px-4 bg-white dark:bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                            {t('agency_home.trust_us')}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto font-bold">
                            {t('home.hero.features.1')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: Shield, title: t('home.hero.features.0'), desc: t('home.hero.features.1'), color: 'blue' },
                            { icon: Users, title: t('agency_home.happy_clients'), desc: t('home.hero.features.2'), color: 'green' },
                            { icon: Award, title: t('agency_home.experience'), desc: t('home.hero.promo_badge'), color: 'yellow' },
                            { icon: Clock, title: t('agency_home.satisfaction'), desc: 'Support 24/7', color: 'purple' }
                        ].map((item, idx) => (
                            <div key={idx} className="group p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-primary hover:shadow-xl transition-all bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <item.icon className="text-primary" size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 font-bold">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="inline-block px-4 py-2 bg-white dark:bg-gray-800 text-primary rounded-full text-sm font-bold mb-4 shadow-md">
                            {t('home.testimonials.badge').toUpperCase()}
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                            {t('agency_home.testimonials_title')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {(settings?.testimonials?.length > 0 ? settings.testimonials : testimonials).map((testimonial: any, idx: number) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100 dark:border-gray-700">
                                <div className="flex gap-1 mb-4">
                                    {[...Array(testimonial.rating || 5)].map((_, i) => (
                                        <Star key={i} size={20} className="text-yellow-500 fill-yellow-500" />
                                    ))}
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 mb-6 italic leading-relaxed font-bold">
                                    "{testimonial.content || testimonial.text}"
                                </p>
                                <div className="flex items-center gap-4">
                                    <img src={testimonial.avatar || `https://ui-avatars.com/api/?name=${testimonial.name}&background=random`} alt={testimonial.name} className="w-12 h-12 rounded-full" />
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{testimonial.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">{testimonial.role || testimonial.location}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            {settings?.faqs && settings.faqs.length > 0 && (
                <section className="py-20 px-4 bg-white dark:bg-gray-900">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">{t('agency_home.faq_title')}</h2>
                            <p className="text-gray-500 font-bold">{t('agency_home.search_placeholder')}</p>
                        </div>
                        <div className="space-y-4">
                            {settings.faqs.map((faq: any, idx: number) => (
                                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                    <button 
                                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                        className="w-full flex items-center justify-between p-5 text-left bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 transition-colors"
                                    >
                                        <span className="font-bold text-gray-900 dark:text-white">{faq.question}</span>
                                        {openFaq === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                    {openFaq === idx && (
                                        <div className="p-5 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-100 dark:border-gray-800 font-bold">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Newsletter Section */}
            {settings?.newsletterEnabled && (
                <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800/50 border-y border-gray-100 dark:border-gray-700">
                    <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Restez Informé</h3>
                            <p className="text-gray-500 font-bold">Inscrivez-vous à notre newsletter pour recevoir nos dernières offres exclusives.</p>
                        </div>
                        <div className="w-full md:w-auto flex gap-2">
                            <input id="newsletter-email" name="newsletter-email" type="email" placeholder="Votre email" autoComplete="email" className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 min-w-[250px] font-bold" />
                            <button className="bg-primary text-white px-6 py-3 rounded-lg font-bold">{t('agency_home.send_message')}</button>
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Section */}
            <section className="py-20 px-4 bg-primary text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-black mb-6">
                        {t('home.hero.title')}
                    </h2>
                    <p className="text-xl text-primary-100 mb-8 font-bold">
                        {t('home.hero.subtitle')}
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <button
                            onClick={() => navigate('/contact')}
                            className="px-10 py-4 bg-white text-primary rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-2xl"
                        >
                            {t('agency_home.contact_us')}
                        </button>
                        <button
                            onClick={() => navigate('/packages')}
                            className="px-10 py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform"
                        >
                            {t('agency_home.discover_more')}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AgencyHome;
