import { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { settingsAPI } from '../services/api';

const hostname = window.location.hostname;
const parts = hostname.split('.');
let isAgencyDomain = false;
if (hostname.includes('.trajetour.com') && parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'api') {
  isAgencyDomain = true;
} else if (hostname.includes('localhost') && parts.length > 1 && parts[0] !== 'www') {
  isAgencyDomain = true;
}

const PublicLayout = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { t, language, setLanguage, direction } = useLanguage();
    const { isAuthenticated, user } = useAuth();
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        if (isAgencyDomain) {
            settingsAPI.getHomepageSettings()
                .then(data => {
                    if (data && data.settings) {
                        setSettings(data.settings);
                    }
                })
                .catch(err => console.error('Error fetching layout settings:', err));
        }
    }, []);

    const toggleLanguage = () => {
        setLanguage(language === 'fr' ? 'ar' : 'fr');
    };

    const displayName = settings?.displayName || 'Trajetour';

    return (
        <div className={`min-h-screen bg-white font-public text-gray-900 flex flex-col ${isAgencyDomain ? 'agency-theme' : ''}`} dir={direction}>
            {settings?.primaryColor && isAgencyDomain && (
                <style dangerouslySetInnerHTML={{
                    __html: `
                        .agency-theme .text-primary { color: ${settings.primaryColor} !important; }
                        .agency-theme .bg-primary { background-color: ${settings.primaryColor} !important; }
                        .agency-theme .from-primary { --tw-gradient-from: ${settings.primaryColor} var(--tw-gradient-from-position) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
                        .agency-theme .border-primary { border-color: ${settings.primaryColor} !important; }
                        .agency-theme .focus\\:border-primary:focus { border-color: ${settings.primaryColor} !important; }
                        .agency-theme .focus\\:ring-primary:focus { --tw-ring-color: ${settings.primaryColor} !important; }
                        
                        /* Fix buttons with primary color */
                        .agency-theme .bg-blue-600 { background-color: ${settings.primaryColor} !important; }
                        .agency-theme .hover\\:bg-blue-700:hover { filter: brightness(0.9); background-color: ${settings.primaryColor} !important; }
                        .agency-theme .text-blue-600 { color: ${settings.primaryColor} !important; }
                        .agency-theme .border-blue-200 { border-color: ${settings.primaryColor} !important; opacity: 0.5; }
                        .agency-theme .hover\\:text-blue-600:hover { color: ${settings.primaryColor} !important; }
                    `
                }} />
            )}
            
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-sm">
                <div className="px-4 md:px-10 lg:px-40 flex items-center justify-between h-16 max-w-[1440px] mx-auto">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="flex items-center gap-2">
                            {settings?.logoUrl ? (
                                <img src={settings.logoUrl} alt={displayName} className="h-12 w-auto object-contain" />
                            ) : (
                                isAgencyDomain ? (
                                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-sm">
                                        {displayName.charAt(0)}
                                    </div>
                                ) : (
                                    <img src="/logo.png" alt="Trajetour" className="h-14 w-auto object-contain py-1" />
                                )
                            )}
                            {isAgencyDomain && <h2 className="text-gray-900 text-xl font-bold leading-tight tracking-[-0.015em]">{displayName}</h2>}
                        </Link>
                    </div>

                    <nav className="hidden lg:flex items-center gap-8">
                        <a href="/#features" className="text-gray-600 hover:text-primary transition-colors text-sm font-medium">{t('public.saas_nav.features')}</a>
                        <a href="/#pricing" className="text-gray-600 hover:text-primary transition-colors text-sm font-medium">{t('public.saas_nav.pricing')}</a>
                        <Link to="/demo" className="text-gray-600 hover:text-primary transition-colors text-sm font-medium">{t('public.saas_nav.demo')}</Link>
                        <Link to="/about" className="text-gray-600 hover:text-primary transition-colors text-sm font-medium">{t('public.nav.about')}</Link>
                        <Link to="/contact" className="text-gray-600 hover:text-primary transition-colors text-sm font-medium">{t('public.nav.contact')}</Link>
                    </nav>

                    <div className="flex items-center gap-3">
                        <button onClick={toggleLanguage} className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 transition-colors font-bold text-sm text-gray-600">
                            {language === 'fr' ? 'AR' : 'FR'}
                        </button>

                        <Link to="/demo" className="hidden md:flex items-center justify-center overflow-hidden rounded-xl h-9 px-4 border-2 border-primary/20 text-primary hover:bg-primary/5 transition-colors text-sm font-bold">
                            {t('public.saas_nav.demo')}
                        </Link>
                        <Link to="/agency-signup" className="hidden md:flex items-center justify-center overflow-hidden rounded-xl h-9 px-5 bg-primary hover:bg-primary/90 transition-colors text-white text-sm font-bold shadow-lg shadow-primary/20">
                            {t('public.saas_nav.get_started')}
                        </Link>
                        {isAuthenticated ? (
                             <Link to={user?.role === 'client' ? '/client' : (user?.tenantId && user?.tenantId !== 'default' ? '/agency' : '/dashboard')} className="flex items-center justify-center rounded-xl h-9 px-4 bg-primary text-white hover:bg-primary/90 transition-colors font-bold text-sm">
                                {t('common.dashboard')}
                            </Link>
                        ) : (
                            <Link to="/login/agency" className="flex items-center justify-center rounded-xl h-9 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-bold text-sm">
                                {t('public.nav.login')}
                            </Link>
                        )}
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden flex items-center justify-center rounded-lg h-10 w-10 text-gray-700">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-100 p-4 flex flex-col gap-4 shadow-lg z-50">
                        <a href="/#features" className="text-gray-700 font-medium py-2" onClick={() => setIsMenuOpen(false)}>{t('public.saas_nav.features')}</a>
                        <a href="/#pricing" className="text-gray-700 font-medium py-2" onClick={() => setIsMenuOpen(false)}>{t('public.saas_nav.pricing')}</a>
                        <Link to="/demo" className="text-gray-700 font-medium py-2" onClick={() => setIsMenuOpen(false)}>{t('public.saas_nav.demo')}</Link>
                        <Link to="/about" className="text-gray-700 font-medium py-2" onClick={() => setIsMenuOpen(false)}>{t('public.nav.about')}</Link>
                        <Link to="/contact" className="text-gray-700 font-medium py-2" onClick={() => setIsMenuOpen(false)}>{t('public.nav.contact')}</Link>
                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                            <button onClick={toggleLanguage} className="py-2 px-3 bg-gray-100 rounded-lg text-sm font-bold">
                                {language === 'fr' ? 'AR' : 'FR'}
                            </button>
                            <Link to="/agency-signup" className="flex-1 text-center py-2 bg-primary text-white rounded-xl text-sm font-bold">
                                {t('public.saas_nav.get_started')}
                            </Link>
                            <Link to="/login/agency" className="flex-1 text-center py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold">
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
                                {settings?.logoUrl ? (
                                    <img src={settings.logoUrl} alt={displayName} className="h-12 w-auto object-contain brightness-0 invert" />
                                ) : (
                                    isAgencyDomain ? (
                                        <span className="material-symbols-outlined text-3xl">mosque</span>
                                    ) : (
                                        <img src="/logo.png" alt="Trajetour" className="h-20 w-auto object-contain brightness-0 invert" />
                                    )
                                )}
                                {isAgencyDomain && <h2 className="text-white text-xl font-bold">{displayName}</h2>}
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">{settings?.slogan || t('public.footer.desc')}</p>
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
                                    <span>{settings?.contactAddress || 'Es-Senia Oran'}</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary flipped-rtl">call</span>
                                    <span dir="ltr">{settings?.contactPhone || '+213 550 32 30 20'}</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">mail</span>
                                    <span>{settings?.contactEmail || 'contact@trajetour.com'}</span>
                                </li>
                            </ul>
                        </div>
                        {/* Newsletter */}
                        <div>
                            <h4 className="text-lg font-bold mb-6">{t('public.footer.newsletter')}</h4>
                            <p className="text-gray-400 text-sm mb-4">{t('public.footer.newsletter_desc')}</p>
                            <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
                                <input className="bg-gray-800 border-none rounded-lg h-10 px-4 text-sm text-white focus:ring-1 focus:ring-primary placeholder:text-gray-500" placeholder="Email" type="email" />
                                <button className="bg-primary hover:bg-primary-700 text-white font-bold h-10 rounded-lg text-sm transition-colors">{t('public.footer.subscribe')}</button>
                            </form>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-500 text-xs text-center">© {new Date().getFullYear()} {displayName}. {t('public.footer.rights')}</p>
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
