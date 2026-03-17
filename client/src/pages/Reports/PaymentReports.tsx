import { useState, useEffect } from 'react';
import { reportsAPI } from '../../services/api';
import { TrendingUp, DollarSign, CheckCircle, Clock, XCircle, Users, Calendar } from 'lucide-react';

interface ReportData {
    dateRange: { start: string; end: string };
    summary: {
        totalPayments: number;
        validatedCount: number;
        pendingCount: number;
        rejectedCount: number;
        totalValidatedDZD: number;
        totalPendingDZD: number;
        totalOrders: number;
        totalClients: number;
    };
    methodBreakdown: Array<{
        method: string;
        count: number;
        totalValidated: number;
        totalPending: number;
        totalAmount: number;
    }>;
    dailyTrend: Array<{
        date: string;
        paymentCount: number;
        validatedAmount: number;
        pendingAmount: number;
    }>;
    topClients: Array<{
        name: string;
        type: string;
        paymentCount: number;
        totalPaid: number;
    }>;
    agencyBreakdown: Array<{
        agencyName: string;
        paymentCount: number;
        totalValidated: number;
    }>;
}

const PaymentReports = () => {
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await reportsAPI.getPaymentReports(dateRange);
            setReportData(data);
        } catch (error) {
            console.error('Failed to fetch reports', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    if (loading || !reportData) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Chargement des rapports...</p>
                </div>
            </div>
        );
    }

    const { summary, methodBreakdown, dailyTrend, topClients, agencyBreakdown } = reportData;

    // Calculate percentages for method breakdown chart
    const totalMethodAmount = methodBreakdown.reduce((sum, m) => sum + m.totalAmount, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 font-display">Rapports de Paiements</h1>
                <div className="flex gap-2 items-center">
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <span className="text-gray-400 text-sm">→</span>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <button
                        onClick={fetchReports}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                        Appliquer
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Total Paiements</p>
                            <p className="text-2xl font-bold text-gray-900">{summary.totalPayments}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                            <TrendingUp className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Montant Validé</p>
                            <p className="text-2xl font-bold text-green-600">
                                {summary.totalValidatedDZD.toLocaleString()} DZD
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{summary.validatedCount} validés</p>
                        </div>
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">En Attente</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {summary.totalPendingDZD.toLocaleString()} DZD
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{summary.pendingCount} en attente</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
                            <Clock className="text-orange-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Clients</p>
                            <p className="text-2xl font-bold text-gray-900">{summary.totalClients}</p>
                            <p className="text-xs text-gray-400 mt-1">{summary.totalOrders} commandes</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                            <Users className="text-purple-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Method Breakdown */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Répartition par Mode de Paiement</h3>
                    <div className="space-y-4">
                        {methodBreakdown.map((method, idx) => {
                            const percentage = totalMethodAmount > 0 ? (method.totalAmount / totalMethodAmount) * 100 : 0;
                            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                            return (
                                <div key={method.method}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">{method.method}</span>
                                        <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className={`h-3 rounded-full ${colors[idx % colors.length]} transition-all`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                                        <span>{method.count} paiements</span>
                                        <span className="font-medium">{method.totalAmount.toLocaleString()} DZD</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top Clients */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Clients</h3>
                    <div className="space-y-3">
                        {topClients.slice(0, 10).map((client, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">{client.name}</p>
                                        <p className="text-xs text-gray-500">{client.paymentCount} paiement(s)</p>
                                    </div>
                                </div>
                                <span className="font-mono text-sm font-bold text-green-600">
                                    {client.totalPaid.toLocaleString()} DZD
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Daily Trend Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tendance Quotidienne</h3>
                {dailyTrend.length > 0 ? (
                    <div className="space-y-2">
                        {dailyTrend.map((day) => (
                            <div key={day.date} className="flex items-center gap-4">
                                <div className="w-24 text-sm text-gray-600 flex items-center gap-2">
                                    <Calendar size={14} className="text-gray-400" />
                                    {new Date(day.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                                </div>
                                <div className="flex-1 flex gap-2">
                                    <div
                                        className="bg-green-500 h-8 rounded flex items-center justify-center text-white text-xs font-medium"
                                        style={{ width: `${(day.validatedAmount / Math.max(...dailyTrend.map(d => d.validatedAmount + d.pendingAmount))) * 100}%`, minWidth: day.validatedAmount > 0 ? '40px' : '0' }}
                                    >
                                        {day.validatedAmount > 0 && `${(day.validatedAmount / 1000).toFixed(0)}K`}
                                    </div>
                                    <div
                                        className="bg-orange-500 h-8 rounded flex items-center justify-center text-white text-xs font-medium"
                                        style={{ width: `${(day.pendingAmount / Math.max(...dailyTrend.map(d => d.validatedAmount + d.pendingAmount))) * 100}%`, minWidth: day.pendingAmount > 0 ? '40px' : '0' }}
                                    >
                                        {day.pendingAmount > 0 && `${(day.pendingAmount / 1000).toFixed(0)}K`}
                                    </div>
                                </div>
                                <span className="w-20 text-right text-sm text-gray-600">{day.paymentCount} pmt(s)</span>
                            </div>
                        ))}
                        <div className="flex gap-4 mt-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                <span>Validé</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                                <span>En attente</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-8">Aucune donnée disponible pour cette période</p>
                )}
            </div>

            {/* Agency Breakdown (Admin only) */}
            {agencyBreakdown.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Performance par Agence</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold text-xs">
                                <tr>
                                    <th className="px-4 py-3">Agence</th>
                                    <th className="px-4 py-3 text-center">Paiements</th>
                                    <th className="px-4 py-3 text-right">Total Validé (DZD)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {agencyBreakdown.map((agency, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{agency.agencyName}</td>
                                        <td className="px-4 py-3 text-center">{agency.paymentCount}</td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-green-600">
                                            {agency.totalValidated.toLocaleString()} DZD
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentReports;
