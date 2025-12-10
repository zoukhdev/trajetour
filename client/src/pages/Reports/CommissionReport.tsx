import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Download, TrendingUp, DollarSign, Users, Building2, Calendar } from 'lucide-react';

const CommissionReport = () => {
    const { orders, agencies } = useData();
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedAgency, setSelectedAgency] = useState<string>('ALL');

    // Calculate commission data
    const commissionData = useMemo(() => {
        let filteredOrders = orders.filter(o => o.totalCommissionDZD && o.totalCommissionDZD > 0);

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

        // Filter by agency
        if (selectedAgency !== 'ALL') {
            filteredOrders = filteredOrders.filter(o => o.agencyId === selectedAgency);
        }

        // Aggregate by agency
        const byAgency = filteredOrders.reduce((acc, order) => {
            const agencyId = order.agencyId || 'DIRECT';
            const agencyName = agencyId === 'DIRECT'
                ? 'Vente Directe'
                : agencies.find(a => a.id === agencyId)?.name || 'Inconnue';

            if (!acc[agencyId]) {
                acc[agencyId] = {
                    agencyId,
                    agencyName,
                    totalCommission: 0,
                    orderCount: 0,
                    passengerCount: 0
                };
            }

            acc[agencyId].totalCommission += order.totalCommissionDZD || 0;
            acc[agencyId].orderCount += 1;
            acc[agencyId].passengerCount += order.passengers?.length || 0;

            return acc;
        }, {} as Record<string, any>);

        return Object.values(byAgency).sort((a: any, b: any) =>
            b.totalCommission - a.totalCommission
        );
    }, [orders, agencies, dateRange, selectedAgency]);

    const totalStats = useMemo(() => {
        return commissionData.reduce((acc, item: any) => ({
            totalCommission: acc.totalCommission + item.totalCommission,
            totalOrders: acc.totalOrders + item.orderCount,
            totalPassengers: acc.totalPassengers + item.passengerCount
        }), { totalCommission: 0, totalOrders: 0, totalPassengers: 0 });
    }, [commissionData]);

    const handleExport = () => {
        const csv = [
            ['Agence', 'Commissions (DZD)', 'Commandes', 'Passagers', 'Moy./Commande'],
            ...commissionData.map((item: any) => [
                item.agencyName,
                item.totalCommission.toFixed(2),
                item.orderCount,
                item.passengerCount,
                (item.totalCommission / item.orderCount).toFixed(2)
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-commissions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-display">Rapport des Commissions</h1>
                    <p className="text-sm text-gray-500 mt-1">Analyse des commissions par agence et période</p>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Building2 size={16} className="inline mr-1" />
                            Agence
                        </label>
                        <select
                            value={selectedAgency}
                            onChange={(e) => setSelectedAgency(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        >
                            <option value="ALL">Toutes les agences</option>
                            {agencies.map(agency => (
                                <option key={agency.id} value={agency.id}>{agency.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm opacity-90">Total Commissions</p>
                            <p className="text-2xl font-bold">
                                {totalStats.totalCommission.toLocaleString()} DZD
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
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

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm opacity-90">Passagers</p>
                            <p className="text-2xl font-bold">{totalStats.totalPassengers}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Commission Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-sm">
                            <tr>
                                <th className="px-6 py-3 font-medium">Agence</th>
                                <th className="px-6 py-3 font-medium text-right">Commissions (DZD)</th>
                                <th className="px-6 py-3 font-medium text-center">Commandes</th>
                                <th className="px-6 py-3 font-medium text-center">Passagers</th>
                                <th className="px-6 py-3 font-medium text-right">Moy./Commande</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {commissionData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Aucune commission trouvée pour cette période
                                    </td>
                                </tr>
                            ) : (
                                commissionData.map((item: any) => (
                                    <tr key={item.agencyId} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {item.agencyName}
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-green-600">
                                            {item.totalCommission.toLocaleString()} DZD
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-600">
                                            {item.orderCount}
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-600">
                                            {item.passengerCount}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-700">
                                            {(item.totalCommission / item.orderCount).toLocaleString()} DZD
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

export default CommissionReport;
