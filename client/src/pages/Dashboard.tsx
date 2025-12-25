import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import ExchangeRateManager from '../components/ExchangeRateManager';
import {
    TrendingUp,
    Users,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Calendar,
    ShoppingCart
} from 'lucide-react';

const Dashboard = () => {
    const { clients, orders } = useData();
    const { t } = useLanguage();
    const { user } = useAuth();

    // Calculate KPIs
    const totalSales = orders.reduce((sum, order) => sum + order.totalAmountDZD, 0);
    const totalReceived = orders.reduce((sum, order) => {
        return sum + order.payments.reduce((pSum, p) => pSum + p.amountDZD, 0);
    }, 0);
    const totalDebt = totalSales - totalReceived;

    const kpiCards = [
        {
            title: t('dashboard.total_sales'),
            value: `${totalSales.toLocaleString()} DZD`,
            icon: TrendingUp,
            change: '+12.5%',
            trend: 'up',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            adminOnly: true
        },
        {
            title: t('dashboard.total_received'),
            value: `${totalReceived.toLocaleString()} DZD`,
            icon: DollarSign,
            change: '+8.2%',
            trend: 'up',
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-100',
            adminOnly: true
        },
        {
            title: t('dashboard.total_debt'),
            value: `${totalDebt.toLocaleString()} DZD`,
            icon: CreditCard,
            change: '-2.4%',
            trend: 'down',
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-100',
            adminOnly: true
        },
        {
            title: t('common.orders'),
            value: orders.length.toString(),
            icon: ShoppingCart,
            change: '+2',
            trend: 'up',
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            border: 'border-orange-100'
        },
        {
            title: t('common.clients'),
            value: clients.length.toString(),
            icon: Users,
            change: '+4',
            trend: 'up',
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            border: 'border-purple-100'
        }
    ].filter(card => !card.adminOnly || user?.role === 'admin');

    return (
        <div className="space-y-6 overflow-x-hidden w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-display">{t('common.dashboard')}</h1>
                    <p className="text-gray-500 text-sm mt-1">{t('common.dashboard_subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                    <Calendar size={16} className="text-primary" />
                    <span className="font-medium">
                        {new Date().toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {kpiCards.map((card, index) => (
                    <div
                        key={index}
                        className={`group relative overflow-hidden bg-white p-6 rounded-2xl border ${card.border} shadow-sm hover:shadow-md transition-all duration-300`}
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full opacity-10 transition-transform group-hover:scale-110 ${card.bg.replace('bg-', 'bg-current text-')}`} />

                        <div className="relative flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                                <card.icon size={24} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${card.trend === 'up' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                                }`}>
                                {card.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {card.change}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
                            <h3 className="text-2xl font-bold text-gray-900 font-display">{card.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Exchange Rate Management - Admin Only */}
            {user?.role === 'admin' && (
                <ExchangeRateManager />
            )}
        </div>
    );
};

export default Dashboard;
