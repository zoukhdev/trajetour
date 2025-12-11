import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useExchangeRates } from '../../context/ExchangeRateContext';
import { ArrowLeft, Printer, CreditCard, TrendingUp, Pencil } from 'lucide-react';
import { generateInvoice } from '../../services/pdfGenerator';
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import type { PaymentMethod, Currency, Order } from '../../types';

// Import API directly for custom calls if needed, though useData has some
import api from '../../services/api';

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { orders, clients, agencies, bankAccounts } = useData();
    const { language } = useLanguage();
    const { getLatestRate, getRateForDate } = useExchangeRates();

    // Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<any>(null); // Track payment being edited

    // Payment form state
    const [paymentCurrency, setPaymentCurrency] = useState<Currency>('DZD');
    const [paymentExchangeRate, setPaymentExchangeRate] = useState(1);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const paymentAmountDZD = paymentCurrency === 'DZD' ? paymentAmount : paymentAmount * paymentExchangeRate;

    // Load initial values for Edit
    useEffect(() => {
        if (editingPayment) {
            setPaymentCurrency(editingPayment.currency);
            setPaymentAmount(editingPayment.amount);
            setPaymentExchangeRate(editingPayment.exchangeRateUsed || 1);
        } else {
            // Reset for new payment
            setPaymentCurrency('DZD');
            setPaymentAmount(0);
            setPaymentExchangeRate(1);
        }
    }, [editingPayment, isPaymentModalOpen]);

    // Update exchange rate when currency changes (only if NOT editing to preserve historical rate, or maybe we want to update it?)
    // If editing, we might want to keep the used rate or allow update. user says "modify ... in case of wrong payment".
    // Usually we want to correct it.
    useEffect(() => {
        if (!editingPayment && paymentCurrency !== 'DZD') {
            // Only auto-fetch if NEW payment
            const today = new Date().toISOString().split('T')[0];
            const rate = getRateForDate(today, paymentCurrency);
            if (rate) {
                setPaymentExchangeRate(rate);
            } else {
                const latestRate = getLatestRate(paymentCurrency);
                setPaymentExchangeRate(latestRate);
            }
        } else if (!editingPayment) {
            setPaymentExchangeRate(1);
        }
    }, [paymentCurrency, getRateForDate, getLatestRate, editingPayment]);

    const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);

    // Prefer fetched data which contains relatedRooms
    const contextOrder = orders.find(o => o.id === id);
    const order = fetchedOrder || contextOrder;

    // Always fetch to get relatedRooms and fresh data
    const fetchOrder = () => {
        if (id) {
            setLoading(true);
            import('../../services/api').then(({ ordersAPI }) => {
                ordersAPI.getById(id)
                    .then(setFetchedOrder)
                    .catch(err => console.error("Failed to fetch order:", err))
                    .finally(() => setLoading(false));
            });
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const client = order ? clients.find(c => c.id === order.clientId) : undefined;
    const agency = order?.agencyId ? agencies.find(a => a.id === order.agencyId) : undefined;

    if (loading && !order) return <div className="p-6">Chargement...</div>;

    if (!order) {
        return <div className="p-6">Commande non trouvée (ID: {id})</div>;
    }

    if (!client) {
        return <div className="p-6">Client non trouvé pour cette commande (ID Client: {order.clientId})</div>;
    }

    // Only count validated payments
    const paidAmount = order.payments.filter(p => p.isValidated).reduce((sum, p) => sum + Number(p.amountDZD), 0);
    const remainingAmount = order.totalAmount - paidAmount;

    const handlePrint = async () => {
        try {
            await generateInvoice(order, client, agency, language);
        } catch (error) {
            console.error("Error generating PDF:", error);
        }
    };

    const handleEditClick = (payment: any) => {
        setEditingPayment(payment);
        setIsPaymentModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/orders')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
                >
                    <ArrowLeft size={20} />
                    <span>Retour</span>
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <Printer size={20} />
                        <span>Imprimer</span>
                    </button>
                    {remainingAmount > 0 && (
                        <button
                            onClick={() => {
                                setEditingPayment(null);
                                setIsPaymentModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-white bg-primary rounded-lg hover:bg-blue-700"
                        >
                            <CreditCard size={20} />
                            <span>Ajouter Paiement</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Détails de la Commande</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="block text-gray-500">Référence</span>
                                <span className="font-medium">CMD-{order.id.substr(0, 6).toUpperCase()}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Date</span>
                                <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Client</span>
                                <span className="font-medium">{client.fullName}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Agence</span>
                                <span className="font-medium">{agency?.name || '-'}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="block text-gray-500">Notes</span>
                                <p className="text-gray-700 whitespace-pre-wrap">{order.notes || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Order Items Table - kept as is */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-gray-500">Description</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-center">Qté</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-right">Prix Unit.</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {order.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4">{item.description}</td>
                                        <td className="px-6 py-4 text-center">{item.quantity}</td>
                                        <td className="px-6 py-4 text-right">{item.unitPrice.toLocaleString()} DZD</td>
                                        <td className="px-6 py-4 text-right font-medium">{item.amount.toLocaleString()} DZD</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-right font-bold text-gray-900">Total</td>
                                    <td className="px-6 py-4 text-right font-bold text-primary">{order.totalAmount.toLocaleString()} DZD</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Passenger Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Passagers ({order.passengers?.length || 0})</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 font-medium text-gray-500">Nom & Prénom</th>
                                        <th className="px-4 py-2 font-medium text-gray-500">Passeport</th>
                                        <th className="px-4 py-2 font-medium text-gray-500">Téléphone</th>
                                        <th className="px-4 py-2 font-medium text-gray-500 text-right">Chambre</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(order.passengers || []).map((p: any, idx: number) => {
                                        // Lookup room details from relatedRooms
                                        const room = (order as any).relatedRooms?.find((r: any) => r.id === p.assignedRoomId);
                                        return (
                                            <tr key={idx}>
                                                <td className="px-4 py-3">{p.firstName} {p.lastName}</td>
                                                <td className="px-4 py-3">{p.passportNumber}</td>
                                                <td className="px-4 py-3">{p.phoneNumber}</td>
                                                <td className="px-4 py-3 text-right">
                                                    {room ? (
                                                        <span className="inline-flex flex-col items-end">
                                                            <span className="font-medium text-primary">{room.hotel_name} - {room.room_number}</span>
                                                            <span className="text-xs text-gray-500">{room.gender} • {room.price} DZD</span>
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Paiement</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total</span>
                                <span className="font-medium">{order.totalAmount.toLocaleString()} DZD</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Payé (Validé)</span>
                                <span className="font-medium text-green-600">{paidAmount.toLocaleString()} DZD</span>
                            </div>
                            <div className="pt-3 border-t border-gray-100 flex justify-between font-bold">
                                <span>Reste</span>
                                <span className={remainingAmount > 0 ? "text-red-600" : "text-green-600"}>
                                    {remainingAmount.toLocaleString()} DZD
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payment History */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Historique</h3>
                        <div className="space-y-4">
                            {order.payments.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-2">Aucun paiement</p>
                            ) : (
                                order.payments.map((payment) => (
                                    <div key={payment.id} className="flex justify-between items-start text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0 group">
                                        <div className="flex-1">
                                            <span className="block font-medium">
                                                {payment.currency === 'DZD'
                                                    ? `${payment.amountDZD.toLocaleString()} DZD`
                                                    : `${payment.amount.toLocaleString()} ${payment.currency} (≈ ${payment.amountDZD.toLocaleString()} DZD)`
                                                }
                                            </span>
                                            <span className="text-xs text-gray-500 flex gap-2">
                                                <span>{new Date(payment.date).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>{payment.method}</span>
                                            </span>
                                            <div className="flex gap-2 text-xs mt-1">
                                                <span className={`px-1.5 py-0.5 rounded ${payment.isValidated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {payment.isValidated ? 'Validé' : 'En attente'}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleEditClick(payment)}
                                            className="p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Modifier"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title={editingPayment ? "Modifier le Paiement" : "Ajouter un Paiement"}
            >
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const method = formData.get('method') as PaymentMethod;
                    const accountId = formData.get('accountId') as string;

                    if (paymentAmountDZD > 0 && order) {
                        try {
                            if (editingPayment) {
                                // EDIT MODE
                                await api.put(`/payments/${editingPayment.id}`, {
                                    amount: paymentAmount,
                                    currency: paymentCurrency,
                                    exchangeRate: paymentExchangeRate,
                                    method,
                                    accountId,
                                    // other fields?
                                });
                                // Refresh current order
                                fetchOrder();
                                alert('Paiement modifié (remis en attente de validation).');
                            } else {
                                // CREATE MODE
                                await api.post('/payments', {
                                    orderId: order.id,
                                    amount: paymentAmount,
                                    currency: paymentCurrency,
                                    exchangeRate: paymentExchangeRate,
                                    method,
                                    paymentDate: new Date().toISOString(),
                                    accountId
                                });
                                // Refresh current order
                                fetchOrder();
                                alert('Paiement ajouté (en attente de validation).');
                            }

                            // Reset & Close
                            setEditingPayment(null);
                            setPaymentAmount(0);
                            setPaymentCurrency('DZD');
                            setIsPaymentModalOpen(false);
                            fetchOrder(); // Ensure UI is fresh

                        } catch (error) {
                            console.error("Failed to save payment:", error);
                            alert("Erreur lors de l'enregistrement du paiement.");
                        }
                    }
                }} className="space-y-4">
                    {/* Currency Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Devise du paiement</label>
                        <select
                            value={paymentCurrency}
                            onChange={(e) => setPaymentCurrency(e.target.value as Currency)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        >
                            <option value="DZD">🇩🇿 DZD (Dinar Algérien)</option>
                            <option value="SAR">🇸🇦 SAR (Riyal Saoudien)</option>
                            <option value="EUR">🇪🇺 EUR (Euro)</option>
                        </select>
                    </div>

                    {/* Exchange Rate Display */}
                    {paymentCurrency !== 'DZD' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={16} className="text-blue-600" />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-600">Taux de change</p>
                                    {editingPayment ? (
                                        <input
                                            type="number"
                                            value={paymentExchangeRate}
                                            onChange={(e) => setPaymentExchangeRate(parseFloat(e.target.value))}
                                            className="border rounded p-1 text-sm w-24"
                                        />
                                    ) : (
                                        <p className="text-sm font-bold text-gray-900">
                                            1 {paymentCurrency} = {paymentExchangeRate.toFixed(2)} DZD
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Montant ({paymentCurrency})
                        </label>
                        <input
                            type="number"
                            required
                            min="0.01"
                            step="0.01"
                            value={paymentAmount || ''}
                            onChange={(e) => setPaymentAmount(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="0.00"
                        />
                        {paymentCurrency !== 'DZD' && paymentAmount > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                                ≈ {paymentAmountDZD.toLocaleString()} DZD
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mode de Paiement</label>
                        <select
                            name="method"
                            required
                            defaultValue={editingPayment?.method}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        >
                            <option value="Cash">Espèces</option>
                            <option value="CCP">CCP</option>
                            <option value="Baridimob">Baridimob</option>
                            <option value="Bank Transfer">Virement Bancaire</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Compte de Réception</label>
                        <select
                            name="accountId"
                            required
                            defaultValue={editingPayment?.accountId || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        >
                            <option value="">-- Sélectionner un compte --</option>
                            {bankAccounts.map(account => (
                                <option key={account.id} value={account.id}>
                                    {account.name} ({account.currency})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsPaymentModalOpen(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {editingPayment ? "Modifier" : "Confirmer"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default OrderDetails;
