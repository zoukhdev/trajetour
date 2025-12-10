import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    Briefcase,
    FileText,
    CreditCard,
    Wallet,
    LogOut,
    UserCircle,
    Plane,
    X,
    Languages,
    PlusCircle,
    Tag,
    MapPin,
    Settings,
    Percent,
    HelpCircle,
    List,
    Receipt,
    BarChart
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { user, logout, hasPermission } = useAuth();
    const { language, setLanguage, t } = useLanguage();

    const sections = [
        {
            title: 'COMMANDES',
            items: [
                { icon: Users, label: t('common.clients'), path: '/clients', permission: 'manage_business' },
                { icon: ShoppingCart, label: t('common.orders'), path: '/orders', permission: 'manage_business' },
                { icon: Users, label: t('common.suppliers'), path: '/suppliers', permission: 'manage_business' },
                { icon: PlusCircle, label: t('common.new_order'), path: '/orders/new', permission: 'manage_business' },
                { icon: Tag, label: t('common.offers'), path: '/offers', permission: 'manage_business' },
                { icon: Briefcase, label: t('common.agencies'), path: '/agencies', permission: 'manage_business' },
            ]
        },
        {
            title: 'COMPTABILITÉ',
            items: [
                { icon: FileText, label: t('common.reports'), path: '/reports', permission: 'view_reports' },
                { icon: BarChart, label: 'Commissions', path: '/reports/commissions', permission: 'view_reports' },
                { icon: BarChart, label: 'Revenus', path: '/reports/revenue', permission: 'view_reports' },
                { icon: CreditCard, label: t('common.expenses'), path: '/expenses', permission: 'manage_financials' },
                { icon: CreditCard, label: t('common.guide_expenses'), path: '/guide-expenses', permission: 'manage_financials' },
            ]
        },
        {
            title: 'GESTION DE L\'AGENCE',
            items: [
                { icon: MapPin, label: t('common.annexes'), path: '/annexes', permission: 'manage_business' },
                { icon: Settings, label: t('common.agency_details'), path: '/agency-details', permission: 'manage_business' },
                { icon: Percent, label: t('common.discounts'), path: '/discounts', permission: 'manage_business' },
                { icon: Percent, label: t('common.tax'), path: '/tax', permission: 'manage_business' },
                { icon: UserCircle, label: t('common.users'), path: '/users', permission: 'manage_users' },
                { icon: HelpCircle, label: t('common.support'), path: '/support', permission: 'manage_business' },
                { icon: Receipt, label: t('common.payments'), path: '/payments', permission: 'manage_business' },
                { icon: List, label: t('common.rooming_list'), path: '/rooming-list', permission: 'manage_business' },
                { icon: Wallet, label: t('common.caisse'), path: '/cash-register', permission: 'manage_financials' },
            ]
        }
    ];

    const toggleLanguage = () => {
        setLanguage(language === 'fr' ? 'ar' : 'fr');
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            <div className={cn(
                "h-screen w-64 bg-surface border-r border-gray-100 flex flex-col shadow-sm z-50 transition-transform duration-300",
                // Mobile: use transform for slide-in/out
                "fixed md:translate-x-0",
                // RTL: position from right, LTR: position from left
                language === 'ar' ? (
                    isOpen ? "right-0 translate-x-0" : "right-0 translate-x-full"
                ) : (
                    isOpen ? "left-0 translate-x-0" : "left-0 -translate-x-full"
                ),
                // RTL: border on left, LTR: border on right
                language === 'ar' ? "border-l border-r-0" : "border-r border-l-0"
            )}>
                {/* Header with Safe Area */}
                <div
                    className="border-b border-gray-50 flex items-center justify-between"
                    style={{
                        paddingTop: 'max(env(safe-area-inset-top), 2.5rem)',
                        paddingLeft: '1.5rem',
                        paddingRight: '1.5rem',
                        paddingBottom: '1.5rem'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                            <Plane size={24} className="-rotate-45 rtl:rotate-45" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 font-display tracking-tight">Wahat Alrajaa</h1>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Tour Management</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                    {/* Dashboard Link */}
                    <NavLink
                        to="/"
                        onClick={() => onClose?.()}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                            isActive
                                ? "bg-primary text-white shadow-md shadow-primary/25"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        )}
                    >
                        <LayoutDashboard size={20} className={cn("transition-transform duration-200 group-hover:scale-110 rtl:rotate-180")} />
                        <span className="relative z-10">{t('common.dashboard')}</span>
                    </NavLink>

                    {sections.map((section, index) => (
                        <div key={index}>
                            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    if (item.permission && !hasPermission(item.permission as any)) {
                                        return null;
                                    }

                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => onClose?.()}
                                            className={({ isActive }) => cn(
                                                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                                isActive
                                                    ? "text-primary bg-primary/5"
                                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                            )}
                                        >
                                            <item.icon size={18} className={cn("transition-transform duration-200 group-hover:scale-110 rtl:rotate-180", ({ isActive }: { isActive: boolean }) => isActive && "text-primary")} />
                                            <span className="relative z-10">{item.label}</span>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer with Safe Area */}
                <div
                    className="border-t border-gray-50 bg-gray-50/50 space-y-3"
                    style={{
                        paddingTop: '1rem',
                        paddingLeft: '1rem',
                        paddingRight: '1rem',
                        paddingBottom: 'max(env(safe-area-inset-bottom), 2rem)'
                    }}
                >
                    {/* Language Switcher */}
                    <button
                        onClick={toggleLanguage}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Languages size={18} />
                            <span>{language === 'fr' ? 'Français' : 'العربية'}</span>
                        </div>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {language === 'fr' ? 'FR' : 'AR'}
                        </span>
                    </button>

                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-gray-100 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/10">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <UserCircle size={20} className="text-primary" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate font-display">{user?.username}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{user?.role}</p>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    >
                        <LogOut size={16} className="rtl:rotate-180" />
                        {t('common.logout')}
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
