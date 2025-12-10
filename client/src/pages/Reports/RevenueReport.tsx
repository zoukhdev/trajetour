import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Download, TrendingUp, DollarSign, Calendar, PieChart } from 'lucide-react';

const RevenueReport = () => {
    const { orders } = useData();
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Calculate revenue data
    const revenueData = useMemo(() => {
        let filteredOrders = orders;

        // Filter by date
        if (dateRange.start) {
            filteredOrders = filteredOrders.filter(o =>
                new Date(o.createdAt) >= new Date(dateRange.start)
            );
        }
        if (dateRange.end) {
            filteredOrders = filteredOrders.filter(o =>
                new Date(o.createdAt) <= new Date(dateRange.end)
            );
        }

        // Aggregate by currency
        const byCurrency = filteredOrders.reduce((acc, order) => {
            const currency = order.orderCurrency || 'DZD';

            if (!acc[currency]) {
                acc[currency] = {
                    currency,
                    total: 0,
                    totalDZD: 0,
                    orderCount: 0,
                    passengerCount: 0
                };
            }

            acc[currency].total += order.totalAmount;
            acc[currency].totalDZD += order.totalAmountDZD || order.totalAmount;
            acc[currency].orderCount += 1;
            acc[currency].passengerCount += order.passengers?.length || 0;

            return acc;
        }, {} as Record<string, any>);

        return Object.values(byCurrency);
    }, [orders, dateRange]);

    const totalStats = useMemo(() => {
        return revenueData.reduce((acc, item: any) => ({
            totalRevenueDZD: acc.totalRevenueDZD + item.totalDZD,
            totalOrders: acc.totalOrders + item.orderCount,
            totalPassengers: acc.totalPassengers + item.passengerCount
        }), { totalRevenueDZD: 0, totalOrders: 0, totalPassengers: 0 });
    }, [revenueData]);

    const paymentStats = useMemo(() => {
        let filteredOrders = orders;

        if (dateRange.start) {
            filteredOrders = filteredOrders.filter(o =>
                new Date(o.createdAt) >= new Date(dateRange.start)
            );
        }
        if (dateRange.end) {
            filteredOrders = filteredOrders.filter(o =>
                new Date(o.createdAt) <= new Date(dateRange.end)
            );
        }

        const totalPaid = filteredOrders.reduce((sum, o) =>
            sum + o.payments.reduce((pSum, p) => pSum + p.amountDZD, 0), 0
        );

        const totalDue = filteredOrders.reduce((sum, o) =>
            sum + (o.totalAmountDZD || o.totalAmount), 0
        );

        return {
            paid: totalPaid,
            pending: totalDue - totalPaid,
            total: totalDue
        };
    }, [orders, dateRange]);

    const handleExport = () => {
        const csv = [
            ['Devise', 'Montant', 'Équivalent DZD', 'Commandes', 'Passagers', 'Moy./Commande'],
            ...revenueData.map((item: any) => [
                item.currency,
                item.total.toFixed(2),
                item.totalDZD.toFixed(2),
                item.orderCount,
                item.passengerCount,
                (item.total / item.orderCount).toFixed(2)
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-revenus-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-display">Rapport des Revenus</h1>
                    <p className="text-sm text-gray-500 mt-1">Analyse multi-devises des revenus et paiements</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Download size={20} />
                    <span>Exporter CSV</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Calendar size={16} className="inline mr-1" />
                            Date de début
                        </label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Calendar size={16} className="inline mr-1" />
                            Date de fin
                        </label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm opacity-90">Revenu Total</p>
                            <p className="text-xl font-bold">
                                {totalStats.totalRevenueDZD.toLocaleString()} DZD
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm opacity-90">Payé</p>
                            <p className="text-xl font-bold">
                                {paymentStats.paid.toLocaleString()} DZD
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <PieChart size={24} />
                        </div>
                        <div>
                            <p className="text-sm opacity-90">En Attente</p>
                            <p className="text-xl font-bold">
                                {paymentStats.pending.toLocaleString()} DZD
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm opacity-90">Commandes</p>
                            <p className="text-2xl font-bold">{totalStats.totalOrders}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue by Currency */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenus par Devise</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {revenueData.map((item: any) => (
                        <div key={item.currency} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl font-bold">
                                    {item.currency === 'DZD' ? '🇩🇿' : item.currency === 'SAR' ? '🇸🇦' : '🇪🇺'}
                                </span>
                                <span className="text-lg font-bold text-gray-900">{item.currency}</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-2xl font-bold text-primary">
                                    {item.total.toLocaleString()} {item.currency}
                                </p>
                                {item.currency !== 'DZD' && (
                                    <p className="text-sm text-gray-500">
                                        ≈ {item.totalDZD.toLocaleString()} DZD
                                    </p>
                                )}
                                <div className="pt-2 mt-2 border-t border-gray-100 text-xs text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Commandes:</span>
                                        <span className="font-semibold">{item.orderCount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Moy./Commande:</span>
                                        <span className="font-semibold">
                                            {(item.total / item.orderCount).toLocaleString()} {item.currency}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-sm">
                            <tr>
                                <th className="px-6 py-3 font-medium">Devise</th>
                                <th className="px-6 py-3 font-medium text-right">Montant</th>
                                <th className="px-6 py-3 font-medium text-right">Équivalent DZD</th>
                                <th className="px-6 py-3 font-medium text-center">Commandes</th>
                                <th className="px-6 py-3 font-medium text-center">Passagers</th>
                                <th className="px-6 py-3 font-medium text-right">Moy./Commande</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {revenueData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Aucun revenu trouvé pour cette période
                                    </td>
                                </tr>
                            ) : (
                                revenueData.map((item: any) => (
                                    <tr key={item.currency} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {item.currency === 'DZD' ? '🇩🇿' : item.currency === 'SAR' ? '🇸🇦' : '🇪🇺'} {item.currency}
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-primary">
                                            {item.total.toLocaleString()} {item.currency}
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-green-600">
                                            {item.totalDZD.toLocaleString()} DZD
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-600">
                                            {item.orderCount}
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-600">
                                            {item.passengerCount}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-700">
                                            {(item.total / item.orderCount).toLocaleString()} {item.currency}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RevenueReport;
