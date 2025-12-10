import { useState, useEffect } from 'react';
import type { Order, OrderStatus } from '../../types';
import axios from 'axios';
import { Plus, Search, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

// Utility to format currency
const formatMoney = (amount: number, currency = 'DZD') => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency }).format(amount);
};

const OrderListV2 = () => {
    // const { user, hasPermission } = useAuth(); // Unused for now
    // const { convertToDZD } = useExchangeRates(); // Unused for now

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(''); // Unused for now

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/orders');
            // Ensure data structure is robust
            const fetchedOrders = response.data.data.map((order: any) => ({
                ...order,
                // Ensure totals are numbers
                totalAmount: Number(order.totalAmount),
                totalAmountDZD: Number(order.totalAmountDZD || order.totalAmount), // Fallback if missing
                payments: order.payments || []
            }));
            setOrders(fetchedOrders);
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Filter logic
    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.agencyId || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: OrderStatus, remaining: number) => {
        // Audit Fix: If remaining is <= 5 DZD, force Paid visual even if status says otherwise
        const isPaid = status === 'Payé' || remaining <= 5;

        if (isPaid) return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Payé</span>;
        if (status === 'Partiel') return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Partiel</span>;
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Non payé</span>;
    };

    /*
    const handleDelete = async (id: string) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) return;
        try {
            // await axios.delete(`/api/orders/${id}`); // Implement API first
            alert('Delete implementation pending backend support');
            // setOrders(orders.filter(o => o.id !== id));
        } catch (err) {
            alert('Erreur lors de la suppression');
        }
    };
    */

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 font-display">Commandes (V2)</h1>
                    <p className="text-gray-500 text-sm">Gestion des réservations - Nouvelle Interface</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        to="/orders/new"
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Plus size={20} />
                        <span>Nouvelle Commande</span>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher par référence, client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                    {(['ALL', 'Payé', 'Partiel', 'Non payé'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === status
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {status === 'ALL' ? 'Tout' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-sm">
                            <tr>
                                <th className="px-6 py-3 font-medium">Référence</th>
                                <th className="px-6 py-3 font-medium">Client</th>
                                <th className="px-6 py-3 font-medium">Agence</th>
                                <th className="px-6 py-3 font-medium text-right">Montant Total</th>
                                <th className="px-6 py-3 font-medium text-right">Payé</th>
                                <th className="px-6 py-3 font-medium text-right">Reste</th>
                                <th className="px-6 py-3 font-medium text-center">Statut</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                        Chargement en cours...
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                        Aucune commande trouvée.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => {
                                    // Calculate financials explicitly for display (trust but verify frontend calc)
                                    const totalDZD = order.totalAmount; // Assuming base orders are in DZD for simplicty or converted? 
                                    // Logic Check: Order total is usually fixed in DZD at creation or follows currency. 
                                    // For now, assume order.totalAmount is the main value.

                                    const paidAmountDZD = order.payments
                                        .filter((p: any) => p.isValidated)
                                        .reduce((sum: number, p: any) => sum + Number(p.amountDZD), 0);
                                    const remainingDZD = totalDZD - paidAmountDZD;

                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                                #{order.id.slice(0, 8)}...
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{order.clientName}</div>
                                                <div className="text-xs text-gray-500">{order.clientMobile}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {/* Requires Agency Name join or fetch. For now showing ID or placeholder */}
                                                {order.agencyId ? 'Agence' : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                {formatMoney(totalDZD)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-green-600 font-medium">
                                                {formatMoney(paidAmountDZD)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-red-600 font-medium">
                                                {remainingDZD <= 0 ? '-' : formatMoney(remainingDZD)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {getStatusBadge(order.status, remainingDZD)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        to={`/orders/${order.id}`} // Point to existing details for now, or V2 details later
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg tooltip"
                                                        title="Voir détails"
                                                    >
                                                        <Eye size={18} />
                                                    </Link>
                                                    {/* can add edit/delete if needed */}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrderListV2;
