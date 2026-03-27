import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect } from 'react';
import { supportAPI } from '../services/api';
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
    BarChart,
    Activity,
    Building2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { user, logout, hasPermission } = useAuth();
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

    const sections = [
        {
            title: 'AGENCES & CLIENTS',
            items: [
                { icon: Building2, label: 'Toutes les Agences', path: '/dashboard/master-agencies', permission: 'manage_business' },
                { icon: CreditCard, label: 'Surclassements', path: '/dashboard/master-subscriptions', permission: 'manage_business' },

                { icon: FileText, label: t('common.reports'), path: '/dashboard/reports', permission: 'view_reports' },
                { icon: BarChart, label: 'Commissions', path: '/dashboard/reports/commissions', permission: 'view_reports' },
                { icon: BarChart, label: 'Revenus Master', path: '/dashboard/reports/revenue', permission: 'view_reports' },
            ]
        },
        {
            title: 'CONFIGURATION PLATFORME',
            items: [
                { icon: UserCircle, label: 'Utilisateurs (Master)', path: '/dashboard/users', permission: 'manage_users' },
                { icon: Activity, label: "Journal d'activité", path: '/dashboard/logs', permission: 'manage_users' },
                { icon: HelpCircle, label: t('common.support'), path: '/dashboard/support', permission: 'manage_business', badge: unreadCount },
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
                    <div className="flex flex-col gap-1">
                        <img src="/logo.png" alt="Trajetour" className="h-16 w-auto object-contain self-start" />
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider px-2">Tour Management System</p>
                    </div>
                    <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                    {/* Dashboard Link */}
                    <NavLink
                        to="/dashboard"
                        end
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

                    {sections.map((section, index) => {
                        // Check if any item in the section is visible to the user
                        const visibleItems = section.items.filter(item => {
                            if ((item as any).adminOnly && user?.role !== 'admin') return false;
                            if (item.permission && !hasPermission(item.permission as any)) return false;
                            return true;
                        });

                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={index}>
                                <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    {section.title}
                                </h3>
                                <div className="space-y-1">
                                    {visibleItems.map((item) => (
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
                                            <span className="relative z-10 flex-1">{item.label}</span>
                                            {!!(item as any).badge && (
                                                <span className="relative z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    {(item as any).badge}
                                                </span>
                                            )}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
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
