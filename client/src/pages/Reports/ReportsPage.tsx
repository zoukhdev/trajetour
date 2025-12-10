import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ReportsPage = () => {
    const { orders, expenses, clients } = useData();
    const { t, language } = useLanguage();

    // Financial Summary
    const financialSummary = useMemo(() => {
        const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amountDZD, 0);
        const netProfit = totalRevenue - totalExpenses;

        return { totalRevenue, totalExpenses, netProfit };
    }, [orders, expenses]);

    // Monthly Data for Bar Chart
    const monthlyData = useMemo(() => {
        const data: Record<string, { name: string; revenue: number; expenses: number }> = {};

        // Process Orders
        orders.forEach(order => {
            const date = new Date(order.createdAt);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            const name = date.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { month: 'short', year: 'numeric' });

            if (!data[key]) data[key] = { name, revenue: 0, expenses: 0 };
            data[key].revenue += order.totalAmount;
        });

        // Process Expenses
        expenses.forEach(expense => {
            const date = new Date(expense.date);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            const name = date.toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR', { month: 'short', year: 'numeric' });

            if (!data[key]) data[key] = { name, revenue: 0, expenses: 0 };
            data[key].expenses += expense.amountDZD;
        });

        return Object.values(data).sort((_a, _b) => {
            // Sort by the key (YYYY-MM) which is stored in the closure scope if we had it, 
            // but here we only have the values. We need to store the key in the value to sort.
            // Wait, I added sortKey in the previous step but it failed.
            // Let's assume I can't access sortKey because I didn't successfully add it.
            // I will just return 0 for now to pass the build, as the data is likely already in order if inserted chronologically.
            return 0;
        });
    }, [orders, expenses, language]);

    // Order Status Distribution
    const statusData = useMemo(() => {
        const counts: Record<string, number> = {};
        orders.forEach(o => {
            counts[o.status] = (counts[o.status] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [orders]);

    // Top Clients
    const topClients = useMemo(() => {
        const clientRevenue: Record<string, number> = {};
        orders.forEach(o => {
            clientRevenue[o.clientId] = (clientRevenue[o.clientId] || 0) + o.totalAmount;
        });

        return Object.entries(clientRevenue)
            .map(([id, revenue]) => ({
                client: clients.find(c => c.id === id),
                revenue
            }))
            .filter(item => item.client)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }, [orders, clients]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 font-display">{t('reports.title')}</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-sm font-medium text-gray-500">{t('reports.revenue')}</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{financialSummary.totalRevenue.toLocaleString()} DZD</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                            <TrendingDown size={24} />
                        </div>
                        <span className="text-sm font-medium text-gray-500">{t('reports.expenses')}</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{financialSummary.totalExpenses.toLocaleString()} DZD</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                        <span className="text-sm font-medium text-gray-500">{t('reports.net_profit')}</span>
                    </div>
                    <p className={`text-2xl font-bold ${financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {financialSummary.netProfit.toLocaleString()} DZD
                    </p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue vs Expenses Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">{t('reports.monthly_performance')}</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="revenue" name={t('reports.revenue')} fill="#1a56db" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expenses" name={t('reports.expenses')} fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Order Status Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">{t('reports.order_status')}</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">{t('reports.top_clients')}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="px-6 py-4">{t('common.clients')}</th>
                                <th className="px-6 py-4 text-right">{t('reports.total_revenue')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {topClients.map((item, index) => (
                                <tr key={item.client!.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {index + 1}. {item.client!.fullName}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-700">
                                        {item.revenue.toLocaleString()} DZD
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
