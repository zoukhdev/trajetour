import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const PublicLayout = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { t, language, setLanguage, direction } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'fr' ? 'ar' : 'fr');
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-public text-[#0e141b] dark:text-white flex flex-col" dir={direction}>
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 w-full bg-white dark:bg-background-dark border-b border-gray-200 dark:border-gray-800">
                <div className="px-4 md:px-10 lg:px-40 flex items-center justify-between h-20 max-w-[1440px] mx-auto">
                    <div className="flex items-center gap-4 text-primary">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="size-8 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-3xl">mosque</span>
                            </div>
                            <h2 className="text-[#0e141b] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">Trajetour</h2>
                        </Link>
                    </div>

                    <nav className="hidden lg:flex items-center gap-8">
                        <Link to="/packages/omrah" className="text-[#0e141b] dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium">{t('public.nav.omrah')}</Link>
                        <Link to="/packages/hajj" className="text-[#0e141b] dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium">{t('public.nav.hajj')}</Link>
                        <Link to="/about" className="text-[#0e141b] dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium">{t('public.nav.about')}</Link>
                        <Link to="/reviews" className="text-[#0e141b] dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium">{t('public.nav.reviews')}</Link>
                        <Link to="/faq" className="text-[#0e141b] dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium">FAQ</Link>
                        <Link to="/contact" className="text-[#0e141b] dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium">{t('public.nav.contact')}</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <button onClick={toggleLanguage} className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-bold text-sm">
                            {language === 'fr' ? 'AR' : 'FR'}
                        </button>

                        <Link to="/contact" className="hidden md:flex items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-primary hover:bg-blue-700 transition-colors text-white text-sm font-bold shadow-lg shadow-blue-500/20">
                            <span className="truncate">{t('public.nav.book_now')}</span>
                        </Link>
                        <Link to="/login" className="flex items-center justify-center rounded-lg h-10 px-4 bg-gray-100 dark:bg-gray-800 text-[#0e141b] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-bold text-sm">
                            {t('public.nav.login')}
                        </Link>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden flex items-center justify-center rounded-lg h-10 w-10 text-[#0e141b] dark:text-white">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden absolute top-20 left-0 w-full bg-white dark:bg-background-dark border-b border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-4 shadow-lg z-50">
                        <Link to="/packages/omrah" className="text-[#0e141b] dark:text-gray-300 font-medium py-2">{t('public.nav.omrah')}</Link>
                        <Link to="/packages/hajj" className="text-[#0e141b] dark:text-gray-300 font-medium py-2">{t('public.nav.hajj')}</Link>
                        <Link to="/about" className="text-[#0e141b] dark:text-gray-300 font-medium py-2">{t('public.nav.about')}</Link>
                        <Link to="/contact" className="text-[#0e141b] dark:text-gray-300 font-medium py-2">{t('public.nav.contact')}</Link>
                        <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button onClick={toggleLanguage} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-bold">
                                {language === 'fr' ? 'العربية' : 'Français'}
                            </button>
                            <Link to="/login" className="flex-1 text-center py-2 bg-primary text-white rounded-lg text-sm font-bold">
                                {t('public.nav.login')}
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1 w-full relative">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-[#111921] text-white pt-16 pb-8">
                <div className="px-4 md:px-10 lg:px-40 max-w-[1440px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                        {/* Brand */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-primary mb-2">
                                <span className="material-symbols-outlined text-3xl">mosque</span>
                                <h2 className="text-white text-xl font-bold">Trajetour</h2>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">{t('public.footer.desc')}</p>
                        </div>
                        {/* Quick Links */}
                        <div>
                            <h4 className="text-lg font-bold mb-6">{t('public.footer.quick_links')}</h4>
                            <ul className="flex flex-col gap-3 text-gray-400 text-sm">
                                <li><Link className="hover:text-primary transition-colors" to="/about">{t('public.nav.about')}</Link></li>
                                <li><Link className="hover:text-primary transition-colors" to="/packages">{t('public.nav.omrah')}</Link></li>
                                <li><Link className="hover:text-primary transition-colors" to="/contact">{t('public.nav.contact')}</Link></li>
                                <li><Link className="hover:text-primary transition-colors" to="/login">{t('public.nav.portal')}</Link></li>
                            </ul>
                        </div>
                        {/* Contact */}
                        <div>
                            <h4 className="text-lg font-bold mb-6">{t('public.footer.contact')}</h4>
                            <ul className="flex flex-col gap-4 text-gray-400 text-sm">
                                <li className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary mt-0.5">location_on</span>
                                    <span>Es-Senia Oran</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary flipped-rtl">call</span>
                                    <span dir="ltr">+213 550 32 30 20</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">mail</span>
                                    <span>contact@trajetour.com</span>
                                </li>
                            </ul>
                        </div>
                        {/* Newsletter */}
                        <div>
                            <h4 className="text-lg font-bold mb-6">{t('public.footer.newsletter')}</h4>
                            <p className="text-gray-400 text-sm mb-4">{t('public.footer.newsletter_desc')}</p>
                            <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
                                <input className="bg-gray-800 border-none rounded-lg h-10 px-4 text-sm text-white focus:ring-1 focus:ring-primary placeholder:text-gray-500" placeholder="Email" type="email" />
                                <button className="bg-primary hover:bg-blue-600 text-white font-bold h-10 rounded-lg text-sm transition-colors">{t('public.footer.subscribe')}</button>
                            </form>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-500 text-xs text-center">© 2024 Trajetour. {t('public.footer.rights')}</p>
                        <div className="flex gap-4">
                            <Link className="text-gray-500 hover:text-white transition-colors" to="#"><span className="text-xs">Privacy</span></Link>
                            <Link className="text-gray-500 hover:text-white transition-colors" to="#"><span className="text-xs">Terms</span></Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
