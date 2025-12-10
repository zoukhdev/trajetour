import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useExchangeRates } from '../../context/ExchangeRateContext';
import { ArrowLeft, Printer, CreditCard, TrendingUp } from 'lucide-react';
import { generateInvoice } from '../../services/pdfGenerator';
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import type { PaymentMethod, Currency } from '../../types';
import { allocatePaymentFIFO } from '../../utils/paymentAllocation';

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { orders, clients, agencies, updateOrder, bankAccounts, addTransaction, addPayment } = useData();
    const { language } = useLanguage();
    const { getLatestRate, getRateForDate } = useExchangeRates();
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // Payment form state
    const [paymentCurrency, setPaymentCurrency] = useState<Currency>('DZD');
    const [paymentExchangeRate, setPaymentExchangeRate] = useState(1);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const paymentAmountDZD = paymentCurrency === 'DZD' ? paymentAmount : paymentAmount * paymentExchangeRate;

    // Update exchange rate when currency changes
    useEffect(() => {
        if (paymentCurrency !== 'DZD') {
            const today = new Date().toISOString().split('T')[0];
            const rate = getRateForDate(today, paymentCurrency);
            if (rate) {
                setPaymentExchangeRate(rate);
            } else {
                const latestRate = getLatestRate(paymentCurrency);
                setPaymentExchangeRate(latestRate);
            }
        } else {
            setPaymentExchangeRate(1);
        }
    }, [paymentCurrency, getRateForDate, getLatestRate]);

    const order = orders.find(o => o.id === id);
    const client = order ? clients.find(c => c.id === order.clientId) : undefined;
    const agency = order?.agencyId ? agencies.find(a => a.id === order.agencyId) : undefined;

    if (!order || !client) {
        return <div className="p-6">Commande non trouvée</div>;
    }

    const paidAmount = order.payments.reduce((sum, p) => sum + Number(p.amountDZD), 0);
    const remainingAmount = order.totalAmount - paidAmount;

    const handlePrint = async () => {
        try {
            await generateInvoice(order, client, agency, language);
        } catch (error) {
            console.error("Error generating PDF:", error);
        }
    };

    return (
        <div className="space-y-6">
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
                            onClick={() => setIsPaymentModalOpen(true)}
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
                                <span className="text-gray-500">Payé</span>
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
                                    <div key={payment.id} className="flex justify-between items-start text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                                        <div>
                                            <span className="block font-medium">
                                                {payment.currency === 'DZD'
                                                    ? `${payment.amountDZD.toLocaleString()} DZD`
                                                    : `${payment.amount.toLocaleString()} ${payment.currency} (≈ ${payment.amountDZD.toLocaleString()} DZD)`
                                                }
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(payment.date).toLocaleDateString()} - {payment.method}
                                                {payment.currency !== 'DZD' && payment.exchangeRateUsed && (
                                                    <span className="ml-1 text-gray-400">
                                                        (Taux: {payment.exchangeRateUsed})
                                                    </span>
                                                )}
                                            </span>
                                        </div>
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
                title="Ajouter un Paiement"
            >
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const method = formData.get('method') as PaymentMethod;
                    const accountId = formData.get('accountId') as string;

                    if (paymentAmountDZD > 0 && order) {
                        try {
                            // 1. Create Payment using new API
                            await addPayment({
                                id: Math.random().toString(36).substr(2, 9), // ID will be overwritten by backend
                                amount: paymentAmount,
                                currency: paymentCurrency,
                                amountDZD: paymentAmountDZD,
                                exchangeRateUsed: paymentCurrency !== 'DZD' ? paymentExchangeRate : 1,
                                exchangeRateDate: new Date().toISOString().split('T')[0],
                                method: method,
                                date: new Date().toISOString()
                            }, order.id);

                            // 2. Update Order Status
                            // Calculate new status locally for immediate feedback
                            // (In a full backend implementation, the backend would trigger this, but we keep frontend logic for now)
                            const newPaidAmount = paidAmount + paymentAmountDZD;
                            // Tolerance for float math
                            const newStatus = (order.totalAmount - newPaidAmount) <= 5 ? 'Payé' : 'Partiel';

                            if (order.status !== newStatus) {
                                await updateOrder({
                                    ...order,
                                    status: newStatus as any
                                });
                            }

                            // 3. Create Transaction linked to Account
                            if (accountId) {
                                addTransaction({
                                    id: Math.random().toString(36).substr(2, 9),
                                    type: 'IN',
                                    amount: paymentAmountDZD,
                                    currency: paymentCurrency,
                                    exchangeRateUsed: paymentExchangeRate,
                                    amountDZD: paymentAmountDZD,
                                    source: 'Order',
                                    referenceId: order.id,
                                    description: `Paiement ${client?.fullName} (CMD-${order.id.substr(0, 6)})`,
                                    date: new Date().toISOString(),
                                    accountId: accountId
                                });
                            }

                            // 4. FIFO: If this is an agency order, apply FIFO allocation
                            if (order.agencyId && paymentAmountDZD > 0) {
                                // We need to re-fetch orders or use current state to ensure we have latest data
                                // allocatePaymentFIFO is a pure function operating on the list of orders
                                const allocations = allocatePaymentFIFO(
                                    {
                                        amountDZD: paymentAmountDZD,
                                        agencyId: order.agencyId
                                    },
                                    orders // This comes from context
                                );

                                // Update all affected orders
                                for (const allocation of allocations) {
                                    const orderToUpdate = orders.find(o => o.id === allocation.orderId);
                                    if (orderToUpdate) {
                                        // We only update status on backend, balance is calculated
                                        if (orderToUpdate.status !== allocation.newStatus) {
                                            await updateOrder({
                                                ...orderToUpdate,
                                                status: allocation.newStatus
                                            });
                                        }
                                    }
                                }
                            }

                            // Reset form
                            setPaymentAmount(0);
                            setPaymentCurrency('DZD');
                            setIsPaymentModalOpen(false);

                        } catch (error) {
                            console.error("Failed to add payment:", error);
                            // Optionally show error toast to user
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
                                    <p className="text-sm font-bold text-gray-900">
                                        1 {paymentCurrency} = {paymentExchangeRate.toFixed(2)} DZD
                                    </p>
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        >
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
                            Confirmer
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default OrderDetails;
