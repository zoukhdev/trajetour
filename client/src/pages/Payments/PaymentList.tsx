import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Search, Filter, Trash2, Eye, Calendar, CheckCircle, XCircle } from 'lucide-react';
import Modal from '../../components/Modal';

const PaymentList = () => {
    const { orders, clients, updateOrder, validatePayment } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingPayment, setViewingPayment] = useState<any | undefined>(undefined);

    // Flatten payments from all orders
    const allPayments = orders.flatMap(order =>
        order.payments.map(payment => {
            const client = clients.find(c => c.id === order.clientId);
            return {
                ...payment,
                orderId: order.id,
                clientName: client?.fullName || 'Client Inconnu',
                clientType: client?.type,
                orderTotal: order.totalAmount
            };
        })
    );

    const filteredPayments = allPayments.filter(payment =>
        payment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleDelete = (paymentId: string, orderId: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce paiement ? Cela affectera le solde de la commande.')) {
            const order = orders.find(o => o.id === orderId);
            if (order) {
                const updatedPayments = order.payments.filter(p => p.id !== paymentId);

                // Recalculate status
                const totalPaid = updatedPayments.filter(p => p.isValidated).reduce((sum, p) => sum + p.amountDZD, 0);
                let newStatus: 'Payé' | 'Non payé' | 'Partiel' = 'Non payé';
                if (totalPaid >= order.totalAmount) newStatus = 'Payé';
                else if (totalPaid > 0) newStatus = 'Partiel';

                updateOrder({
                    ...order,
                    payments: updatedPayments,
                    status: newStatus
                });
            }
        }
    };

    const handleValidate = async (paymentId: string, orderId: string, isValidated: boolean) => {
        if (confirm(`Voulez-vous vraiment ${isValidated ? 'valider' : 'invalider'} ce paiement ?`)) {
            try {
                await validatePayment(paymentId, orderId, isValidated);
            } catch (error) {
                alert("Erreur lors de la validation du paiement");
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 font-display">Historique des Paiements</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher par client, commande..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="px-6 py-4">Référence</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Commande</th>
                                <th className="px-6 py-4">Montant (DZD)</th>
                                <th className="px-6 py-4">Mode</th>
                                <th className="px-6 py-4">Statut</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                                <Filter size={24} />
                                            </div>
                                            <p className="font-medium">Aucun paiement trouvé</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm text-gray-600">
                                            #{payment.id.substr(0, 8)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                {new Date(payment.date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-gray-900">{payment.clientName}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-600">
                                                CMD-{payment.orderId.substr(0, 6)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-green-600">
                                            {payment.amountDZD.toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                {payment.method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${payment.isValidated === undefined
                                                ? 'bg-gray-50 text-gray-700 border-gray-200'
                                                : payment.isValidated
                                                    ? 'bg-green-50 text-green-700 border-green-100'
                                                    : 'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                {payment.isValidated === undefined ? 'En Attente' : payment.isValidated ? 'Validé' : 'Non Validé'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setViewingPayment(payment)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Voir détails"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(payment.id, payment.orderId)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                {payment.isValidated === undefined && (
                                                    <>
                                                        <button
                                                            onClick={() => handleValidate(payment.id, payment.orderId, true)}
                                                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Valider"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleValidate(payment.id, payment.orderId, false)}
                                                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                            title="Invalider"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={!!viewingPayment}
                onClose={() => setViewingPayment(undefined)}
                title="Détails du Paiement"
            >
                {viewingPayment && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Paiement #{viewingPayment.id.substr(0, 8)}</h3>
                                <p className="text-sm text-gray-500">{new Date(viewingPayment.date).toLocaleDateString()} {new Date(viewingPayment.date).toLocaleTimeString()}</p>
                            </div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                {viewingPayment.amountDZD.toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD' })}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="block text-gray-500 mb-1">Client</span>
                                <span className="font-semibold text-gray-900">{viewingPayment.clientName}</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="block text-gray-500 mb-1">Commande</span>
                                <span className="font-semibold text-gray-900">CMD-{viewingPayment.orderId.substr(0, 6)}</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="block text-gray-500 mb-1">Mode de paiement</span>
                                <span className="font-semibold text-gray-900">{viewingPayment.method}</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="block text-gray-500 mb-1">Statut de Validation</span>
                                <span className={`font-semibold ${viewingPayment.isValidated === undefined
                                    ? 'text-gray-600'
                                    : viewingPayment.isValidated
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }`}>
                                    {viewingPayment.isValidated === undefined ? 'En Attente' : viewingPayment.isValidated ? 'Validé' : 'Non Validé'}
                                </span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="block text-gray-500 mb-1">Devise d'origine</span>
                                <span className="font-semibold text-gray-900">
                                    {viewingPayment.amount} {viewingPayment.currency}
                                    {viewingPayment.currency !== 'DZD' && (
                                        <span className="text-xs text-gray-500 block">
                                            (Taux: {viewingPayment.exchangeRate})
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setViewingPayment(undefined)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PaymentList;
