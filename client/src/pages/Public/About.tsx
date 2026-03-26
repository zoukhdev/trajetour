import { useLanguage } from '../../context/LanguageContext';

const About = () => {
    const { t } = useLanguage();

    return (
        <div className="bg-background-light dark:bg-background-dark">
            {/* Header Hero */}
            <div className="relative h-[400px] flex items-center justify-center">
                <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/hajj-hero.png")' }}></div>
                <div className="absolute inset-0 bg-black opacity-60"></div> {/* Overlay for text readability */}
                <div className="text-center z-10 px-4">
                    <h1 className="text-5xl font-black text-white mb-4 tracking-tight shadow-xl">{t('public.about.title')}</h1>
                    <div className="h-1 w-24 bg-primary mx-auto rounded-full"></div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
                    <div>
                        <h2 className="text-3xl font-bold text-[#0e141b] dark:text-white mb-6 relative inline-block">
                            {t('public.about.story')}
                            <span className="absolute bottom-0 left-0 w-full h-3 bg-primary/20 -z-10 rounded-sm"></span>
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed text-justify">
                            {t('public.about.story_text')}
                        </p>
                        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 leading-relaxed text-justify">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                        </p>
                    </div>
                    <div className="relative">
                        <div className="absolute -inset-4 bg-primary/20 rounded-2xl rotate-3"></div>
                        <img
                           src="/masjid-nabawi-green-dome.png" alt="Agency Team" className="relative rounded-2xl shadow-xl w-full h-auto object-cover transform transition hover:scale-[1.01] duration-500"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-3xl font-bold text-center text-[#0e141b] dark:text-white mb-12">{t('public.about.values')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { title: 'public.about.v1', icon: 'verified_user', color: 'text-blue-500' },
                            { title: 'public.about.v2', icon: 'handshake', color: 'text-green-500' },
                            { title: 'public.about.v3', icon: 'diamond', color: 'text-purple-500' }
                        ].map((v, i) => (
                            <div key={i} className="flex flex-col items-center text-center group">
                                <div className={`size-20 rounded-2xl bg-gray-50 dark:bg-gray-900 ${v.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                                    <span className="material-symbols-outlined text-4xl">{v.icon}</span>
                                </div>
                                <h3 className="text-xl font-bold text-[#0e141b] dark:text-white mb-2">{t(v.title)}</h3>
                                <p className="text-gray-500 text-sm">Brief description of the value goes here.</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
