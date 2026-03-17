import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Plane, MapPin, Calendar, Star, Shield, Clock, Users, Award, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';

const Home = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [destination, setDestination] = useState('omrah');
    const [date, setDate] = useState('');
    const [statsVisible, setStatsVisible] = useState(false);

    // Animated counter for stats
    const [stats, setStats] = useState({ clients: 0, packages: 0, years: 0, satisfaction: 0 });

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
        const duration = 2000;
        const steps = 60;
        const interval = duration / steps;

        const targets = { clients: 5000, packages: 150, years: 10, satisfaction: 98 };
        let current = { clients: 0, packages: 0, years: 0, satisfaction: 0 };

        const timer = setInterval(() => {
            current.clients = Math.min(current.clients + targets.clients / steps, targets.clients);
            current.packages = Math.min(current.packages + targets.packages / steps, targets.packages);
            current.years = Math.min(current.years + targets.years / steps, targets.years);
            current.satisfaction = Math.min(current.satisfaction + targets.satisfaction / steps, targets.satisfaction);

            setStats({
                clients: Math.floor(current.clients),
                packages: Math.floor(current.packages),
                years: Math.floor(current.years),
                satisfaction: Math.floor(current.satisfaction)
            });

            if (current.clients >= targets.clients) {
                clearInterval(timer);
            }
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

    const popularPackages = [
        {
            id: 1,
            title: 'Omrah VIP Ramadan',
            price: '350,000',
            image: '/kaaba-night.png',
            duration: '15 jours',
            rating: 4.9,
            features: ['5★ Hotels', 'Vol direct', 'Guide FR/AR']
        },
        {
            id: 2,
            title: 'Hajj Premium 2026',
            price: '680,000',
            image: '/masjid-haram-aerial.png',
            duration: '21 jours',
            rating: 5.0,
            features: ['Tout inclus', 'Groupe VIP', 'Assistance 24/7']
        },
        {
            id: 3,
            title: 'Omrah Économique',
            price: '180,000',
            image: '/masjid-nabawi-green-dome.png',
            duration: '10 jours',
            rating: 4.7,
            features: ['3★ Hotels', 'Petit groupe', 'Visa inclus']
        }
    ];

    const testimonials = [
        {
            name: 'Ahmed Benali',
            location: 'Oran, Algérie',
            rating: 5,
            text: 'Une expérience spirituelle inoubliable. L\'organisation était parfaite du début à la fin.',
            avatar: 'https://ui-avatars.com/api/?name=Ahmed+Benali&background=3b82f6&color=fff'
        },
        {
            name: 'Fatima Zerrouqi',
            location: 'Alger, Algérie',
            rating: 5,
            text: 'Service exceptionnel, guide très professionnel. Je recommande vivement Trajetour!',
            avatar: 'https://ui-avatars.com/api/?name=Fatima+Zerrouqi&background=10b981&color=fff'
        },
        {
            name: 'Mohamed Kaci',
            location: 'Constantine, Algérie',
            rating: 5,
            text: 'Prix compétitifs et qualité au rendez-vous. Mon Hajj s\'est déroulé sans aucun problème.',
            avatar: 'https://ui-avatars.com/api/?name=Mohamed+Kaci&background=f59e0b&color=fff'
        }
    ];

    return (
        <div className="relative w-full overflow-hidden">
            {/* Hero Section with Parallax Effect */}
            <div className="relative w-full min-h-[700px] flex flex-col items-center justify-center px-4 bg-cover bg-center bg-no-repeat bg-fixed"
                style={{ backgroundImage: 'linear-gradient(135deg, rgba(17, 25, 33, 0.7) 0%, rgba(59, 130, 246, 0.6) 100%), url("/hajj-hero.png")' }}>

                {/* Animated Background Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 animate-pulse-slow"></div>

                <div className="flex flex-col gap-8 text-center max-w-[1000px] z-10 animate-fade-in-up">
                    {/* Badge */}
                    <div className="mx-auto">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium">
                            <Award size={16} className="text-yellow-400" />
                            Agence Certifiée et Accréditée
                        </span>
                    </div>

                    <h1 className="text-white text-5xl md:text-7xl font-black leading-tight tracking-tight drop-shadow-2xl font-display">
                        Votre Voyage Spirituel <br />
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                            Commence Ici
                        </span>
                    </h1>

                    <h2 className="text-gray-100 text-xl md:text-2xl font-medium leading-relaxed max-w-3xl mx-auto drop-shadow-lg">
                        Organisation professionnelle de <span className="font-bold text-yellow-400">Omrah & Hajj</span> avec
                        plus de 10 ans d'expérience
                    </h2>

                    <div className="flex flex-wrap gap-4 justify-center mt-4">
                        <button
                            onClick={() => navigate('/packages')}
                            className="group inline-flex items-center justify-center rounded-xl h-14 px-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg font-bold shadow-2xl shadow-blue-900/50 transition-all hover:scale-105 hover:shadow-blue-900/70"
                        >
                            Découvrir nos Offres
                            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                        </button>

                        <button
                            onClick={() => navigate('/contact')}
                            className="inline-flex items-center justify-center rounded-xl h-14 px-10 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white text-lg font-bold border-2 border-white/30 transition-all hover:scale-105"
                        >
                            Contactez-nous
                        </button>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap gap-8 justify-center mt-8 text-white/90 text-sm">
                        <div className="flex items-center gap-2">
                            <Shield size={20} className="text-green-400" />
                            <span>Paiement Sécurisé</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={20} className="text-green-400" />
                            <span>Licence Officielle</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users size={20} className="text-green-400" />
                            <span>+5000 Pèlerins</span>
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

            {/* Floating Search Widget */}
            <div className="w-full px-4 -mt-20 relative z-30 flex justify-center">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-6xl border border-gray-100 dark:border-gray-700 backdrop-blur-xl">
                    <h3 className="text-xl font-bold mb-6 text-[#0e141b] dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <MapPin className="text-primary" size={20} />
                        </div>
                        Rechercher Votre Voyage Idéal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Destination</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Plane className="text-gray-400" size={18} />
                                </div>
                                <select
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                    className="block w-full pl-10 pr-4 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-[#0e141b] dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                >
                                    <option value="omrah">Makkah & Madinah (Omrah)</option>
                                    <option value="hajj">Hajj 2026</option>
                                    <option value="ramadan">Ramadan Special</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date de départ</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar className="text-gray-400" size={18} />
                                </div>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="block w-full pl-10 pr-4 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-[#0e141b] dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Durée</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Clock className="text-gray-400" size={18} />
                                </div>
                                <select className="block w-full pl-10 pr-4 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-[#0e141b] dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20">
                                    <option>10 jours</option>
                                    <option>15 jours</option>
                                    <option>21 jours</option>
                                    <option>30 jours</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleSearch}
                                className="w-full h-12 px-6 bg-gradient-to-r from-primary to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 flex items-center justify-center gap-2"
                            >
                                Rechercher
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Counter Section */}
            <section id="stats-section" className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center transform hover:scale-110 transition-transform">
                            <div className="flex items-center justify-center mb-4">
                                <Users className="text-yellow-400" size={48} />
                            </div>
                            <div className="text-5xl font-black mb-2">{stats.clients.toLocaleString()}+</div>
                            <div className="text-blue-100 text-lg font-medium">Pèlerins Satisfaits</div>
                        </div>

                        <div className="text-center transform hover:scale-110 transition-transform">
                            <div className="flex items-center justify-center mb-4">
                                <Plane className="text-yellow-400" size={48} />
                            </div>
                            <div className="text-5xl font-black mb-2">{stats.packages}+</div>
                            <div className="text-blue-100 text-lg font-medium">Packages Disponibles</div>
                        </div>

                        <div className="text-center transform hover:scale-110 transition-transform">
                            <div className="flex items-center justify-center mb-4">
                                <Award className="text-yellow-400" size={48} />
                            </div>
                            <div className="text-5xl font-black mb-2">{stats.years}+</div>
                            <div className="text-blue-100 text-lg font-medium">Années d'Expérience</div>
                        </div>

                        <div className="text-center transform hover:scale-110 transition-transform">
                            <div className="flex items-center justify-center mb-4">
                                <TrendingUp className="text-yellow-400" size={48} />
                            </div>
                            <div className="text-5xl font-black mb-2">{stats.satisfaction}%</div>
                            <div className="text-blue-100 text-lg font-medium">Taux de Satisfaction</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Popular Packages */}
            <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-primary rounded-full text-sm font-bold mb-4">
                            NOS MEILLEURES OFFRES
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                            Packages Populaires
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                            Découvrez nos formules les plus demandées avec un excellent rapport qualité-prix
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
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
                                        <Clock size={16} />
                                        <span className="text-sm">{pkg.duration}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {pkg.features.map((feature, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-end justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">À partir de</p>
                                            <p className="text-3xl font-black text-primary">{pkg.price} <span className="text-sm font-normal">DZD</span></p>
                                        </div>
                                        <button
                                            onClick={() => navigate('/packages')}
                                            className="px-6 py-2 bg-primary hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                                        >
                                            Réserver
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
                            Voir Tous les Packages
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="py-20 px-4 bg-white dark:bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                            Pourquoi Choisir Trajetour ?
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                            Votre confiance est notre priorité absolue
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: Shield, title: 'Sécurité & Fiabilité', desc: 'Agence certifiée avec licence officielle', color: 'blue' },
                            { icon: Users, title: 'Guides Expérimentés', desc: 'Accompagnement professionnel FR/AR', color: 'green' },
                            { icon: Award, title: 'Qualité Premium', desc: 'Hôtels 4-5★ et services VIP', color: 'yellow' },
                            { icon: Clock, title: 'Support 24/7', desc: 'Assistance disponible à tout moment', color: 'purple' }
                        ].map((item, idx) => (
                            <div key={idx} className="group p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-primary hover:shadow-xl transition-all bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                                <div className={`w-16 h-16 bg-${item.color}-100 dark:bg-${item.color}-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <item.icon className={`text-${item.color}-600 dark:text-${item.color}-400`} size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="inline-block px-4 py-2 bg-white dark:bg-gray-800 text-primary rounded-full text-sm font-bold mb-4 shadow-md">
                            TÉMOIGNAGES
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                            Ce Que Disent Nos Pèlerins
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100 dark:border-gray-700">
                                <div className="flex gap-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} size={20} className="text-yellow-500 fill-yellow-500" />
                                    ))}
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 mb-6 italic leading-relaxed">
                                    "{testimonial.text}"
                                </p>
                                <div className="flex items-center gap-4">
                                    <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full" />
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{testimonial.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.location}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-black mb-6">
                        Prêt à Commencer Votre Voyage Spirituel ?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Contactez-nous dès aujourd'hui pour une consultation gratuite
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <button
                            onClick={() => navigate('/contact')}
                            className="px-10 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-2xl"
                        >
                            Demander un Devis Gratuit
                        </button>
                        <button
                            onClick={() => navigate('/packages')}
                            className="px-10 py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform"
                        >
                            Explorer les Packages
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
