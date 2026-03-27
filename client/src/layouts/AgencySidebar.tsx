import { NavLink } from 'react-router-dom';
import { getAgencyPath } from '../lib/tenant';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect } from 'react';
import { supportAPI } from '../services/api';
import {
    LayoutDashboard,
    ShoppingCart,
    Calendar,
    Bell,
    FileText,
    LogOut,
    UserCircle,
    Plane,
    X,
    Languages,
    CreditCard,
    Globe,
    Users,
    Package,
    Briefcase,
    Wallet,
    BarChart,
    Percent,
    Bed,
    HelpCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AgencySidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const AgencySidebar = ({ isOpen, onClose }: AgencySidebarProps) => {
    const { user, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await supportAPI.getUnreadCount();
                setUnreadCount(res.count);
            } catch (err) {
                console.error('Failed to fetch unread sum', err);
            }
        };
        fetchUnread();
        
        // Optional: Add polling
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, []);

    const menuItems = [
        { icon: LayoutDashboard, label: t('common.dashboard'), path: getAgencyPath('/') },
        { icon: ShoppingCart, label: t('common.my_bookings'), path: getAgencyPath('/bookings'), permission: 'access_orders' },
        { icon: Users, label: t('common.reservations'), path: getAgencyPath('/clients'), permission: 'access_clients' },
        { icon: Package, label: t('common.offers_packs'), path: getAgencyPath('/offers'), permission: 'access_offers' },
        { icon: Briefcase, label: t('common.suppliers'), path: getAgencyPath('/suppliers'), permission: 'access_suppliers' },
        { icon: Wallet, label: t('common.cash_register'), path: getAgencyPath('/cash_register'), permission: 'access_cash_register' },
        { icon: CreditCard, label: t('common.expenses'), path: getAgencyPath('/expenses'), permission: 'access_expenses' },
        { icon: BarChart, label: t('common.reports'), path: getAgencyPath('/reports'), permission: 'access_reports' },
        { icon: Percent, label: t('common.discounts'), path: getAgencyPath('/discounts'), permission: 'access_discounts' },
        { icon: Percent, label: t('common.taxes'), path: getAgencyPath('/tax'), permission: 'access_discounts' },
        { icon: Bed, label: t('common.rooming_list'), path: getAgencyPath('/rooming-list'), permission: 'access_rooming_list' },
        { icon: Users, label: t('common.staff_agents'), path: getAgencyPath('/users'), permission: 'access_users' },
        { icon: CreditCard, label: t('common.payments'), path: getAgencyPath('/payments'), permission: 'access_cash_register' },
        { icon: Calendar, label: t('common.slot_booking'), path: getAgencyPath('/slots'), permission: 'access_orders' },
        { icon: HelpCircle, label: t('common.support_help'), path: getAgencyPath('/support'), badge: unreadCount },
        { icon: Bell, label: t('common.notifications'), path: getAgencyPath('/notifications') },
        { icon: FileText, label: t('common.documents'), path: getAgencyPath('/documents') },
        { icon: Globe, label: t('common.homepage_builder'), path: getAgencyPath('/homepage-builder') },
        { icon: Globe, label: t('common.public_landing'), path: getAgencyPath('/landing') },
    ];

    const filteredMenuItems = menuItems.filter(item => {
        if (!item.permission) return true;
        // Agency Admin/Owner might have different role name, but typically they have all permissions or are 'admin'
        // If owner has role 'admin' on their scope or is super_admin.
        // Let's allow access if they have the permission string OR if they are 'admin'/'super_admin'
        return user?.permissions?.includes(item.permission as any) || user?.role === 'admin' || user?.role === 'super_admin';
    });

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
                "h-screen w-64 bg-white dark:bg-[#1a2634] border-gray-100 dark:border-gray-700 flex flex-col shadow-lg z-50 transition-all duration-300 flex-shrink-0",
                "fixed md:relative outline-none",
                language === 'ar' ? (
                    isOpen ? "right-0 translate-x-0" : "right-0 translate-x-full md:translate-x-0 md:right-auto"
                ) : (
                    isOpen ? "left-0 translate-x-0" : "left-0 -translate-x-full md:translate-x-0 md:left-auto"
                ),
                language === 'ar' ? "border-l border-r-0" : "border-r border-l-0"
            )}>
                {/* Header */}
                <div
                    className="border-b border-gray-50 dark:border-gray-700 flex items-center justify-between"
                    style={{
                        paddingTop: 'max(env(safe-area-inset-top), 2.5rem)',
                        paddingLeft: '1.5rem',
                        paddingRight: '1.5rem',
                        paddingBottom: '1.5rem'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                            <Plane size={24} className="-rotate-45 rtl:rotate-45" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white font-display tracking-tight">{t('common.partner_portal')}</h1>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{t('common.agency_dashboard_label')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {filteredMenuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => onClose?.()}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-gradient-to-r from-primary to-primary-700 text-white shadow-md shadow-primary/25"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            <item.icon size={20} className="transition-transform duration-200 group-hover:scale-110" />
                            <span className="flex-1">{item.label}</span>
                            {!!(item as any).badge && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {(item as any).badge}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div
                    className="border-t border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 space-y-3"
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
                        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Languages size={18} />
                            <span>{language === 'fr' ? 'Français' : 'العربية'}</span>
                        </div>
                        <span className="text-xs font-bold text-primary dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded">
                            {language === 'fr' ? 'FR' : 'AR'}
                        </span>
                    </button>

                    {/* User Info */}
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/10">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <UserCircle size={20} className="text-primary dark:text-primary-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.username}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                                {({
                                    admin: t('common.administrator'),
                                    super_admin: t('common.super_admin'),
                                    agent: t('common.agent'),
                                    staff: t('common.staff'),
                                    caissier: t('common.caissier'),
                                    manager: t('common.manager'),
                                } as Record<string, string>)[user?.role || ''] || user?.role || t('common.agent')}
                            </p>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-800"
                    >
                        <LogOut size={16} className="rtl:rotate-180" />
                        {t('common.logout')}
                    </button>
                </div>
            </div>
        </>
    );
};

export default AgencySidebar;
