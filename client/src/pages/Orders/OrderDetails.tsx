import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useExchangeRates } from '../../context/ExchangeRateContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Printer, CreditCard, TrendingUp, Pencil, Check, X, Upload, FileCheck, Image } from 'lucide-react';
import { generateInvoice } from '../../services/pdfGenerator';
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import type { PaymentMethod, Currency, Order } from '../../types';

// Import API directly for custom calls if needed, though useData has some
import api, { passengersAPI } from '../../services/api';

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { orders, clients, agencies, bankAccounts } = useData();
    const { language } = useLanguage();
    const { user } = useAuth();
    const { getLatestRate, getRateForDate } = useExchangeRates();

    // Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<any>(null); // Track payment being edited

    // Passenger price editing state
    const [editingPassengerId, setEditingPassengerId] = useState<string | null>(null);
    const [editedPrice, setEditedPrice] = useState<number>(0);
    const [isSavingPrice, setIsSavingPrice] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState<{ id: string, type: 'passport' | 'photo' } | null>(null);

    // Payment form state
    // ... (rest of the state remains same)

    const handleDocumentUpload = async (passengerId: string, file: File, type: 'passport' | 'photo') => {
        if (!order?.id) return;
        setUploadingDoc({ id: passengerId, type });
        try {
            await passengersAPI.uploadDocument(order.id, passengerId, file, type);
            fetchOrder(); // Refresh data
        } catch (error: any) {
            console.error('Upload failed:', error);
            alert('Échec du téléchargement: ' + (error.response?.data?.error || error.message));
        } finally {
            setUploadingDoc(null);
        }
    };
    const [paymentCurrency, setPaymentCurrency] = useState<Currency>('DZD');
    const [paymentExchangeRate, setPaymentExchangeRate] = useState(1);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
    const paymentAmountDZD = paymentCurrency === 'DZD' ? paymentAmount : paymentAmount * paymentExchangeRate;

    // Load initial values for Edit
    useEffect(() => {
        if (editingPayment) {
            setPaymentCurrency(editingPayment.currency);
            setPaymentAmount(editingPayment.amount);
            setPaymentExchangeRate(editingPayment.exchangeRateUsed || 1);
            setPaymentMethod(editingPayment.method);
        } else {
            // Reset for new payment
            setPaymentCurrency('DZD');
            setPaymentAmount(0);
            setPaymentExchangeRate(1);
            setPaymentMethod('Cash');
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
    const paidAmount = (order.payments || []).filter(p => p.isValidated).reduce((sum, p) => sum + Number(p.amountDZD), 0);
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

    const handleStartEditPrice = (passengerId: string, currentPrice: number) => {
        setEditingPassengerId(passengerId);
        setEditedPrice(currentPrice || 0);
    };

    const handleCancelEditPrice = () => {
        setEditingPassengerId(null);
        setEditedPrice(0);
    };

    const handleSavePrice = async (passengerId: string) => {
        if (!order?.id) return;

        setIsSavingPrice(true);
        try {
            // Update passenger price via API
            await api.put(`/passengers/${passengerId}`, {
                finalPrice: editedPrice,
                priceOverridden: true
            });

            // Refresh order to get updated data
            fetchOrder();
            setEditingPassengerId(null);
            setEditedPrice(0);
        } catch (error) {
            console.error('Failed to update passenger price:', error);
            alert('Erreur lors de la mise à jour du prix');
        } finally {
            setIsSavingPrice(false);
        }
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
                    {remainingAmount > 0 && (user?.role === 'admin' || user?.role === 'agent') && (
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
                                <span className="font-medium">CMD-{order.id.substring(0, 6).toUpperCase()}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Date</span>
                                <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500">Client</span>
                                <span className="font-medium">{client?.fullName || 'Chargement...'}</span>
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
                                {(order.items || []).map((item) => (
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
                                        <th className="px-4 py-2 font-medium text-gray-500">Documents</th>
                                        <th className="px-4 py-2 font-medium text-gray-500 text-right">Prix</th>
                                        {user?.role === 'admin' && (
                                            <th className="px-4 py-2 font-medium text-gray-500 text-center">Actions</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(order.passengers || []).map((p: any, idx: number) => {
                                        // Lookup room details from relatedRooms
                                        const room = (order as any).relatedRooms?.find((r: any) => r.id === p.assignedRoomId);
                                        const isEditing = editingPassengerId === p.id;

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
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {/* Passport Link/Upload */}
                                                        <div className="flex flex-col items-center">
                                                            {p.passportScanUrl ? (
                                                                <a href={p.passportScanUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-green-50 text-green-600 rounded-md border border-green-100 hover:bg-green-100 transition-colors" title='Voir le passeport'>
                                                                    <FileCheck className="w-4 h-4" />
                                                                </a>
                                                            ) : (
                                                                <button
                                                                    onClick={() => document.getElementById(`upload-passport-${p.id}`)?.click()}
                                                                    disabled={uploadingDoc?.id === p.id}
                                                                    className={`p-1.5 bg-red-50 text-red-600 rounded-md border border-red-100 hover:bg-red-100 transition-colors ${uploadingDoc?.id === p.id && uploadingDoc?.type === 'passport' ? 'animate-pulse' : ''}`}
                                                                    title="Télécharger Passeport"
                                                                >
                                                                    <Upload className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <span className="text-[10px] uppercase font-bold text-gray-400 mt-1">Pass.</span>
                                                            <input
                                                                id={`upload-passport-${p.id}`}
                                                                type="file"
                                                                className="hidden"
                                                                onChange={(e) => e.target.files?.[0] && handleDocumentUpload(p.id, e.target.files[0], 'passport')}
                                                                accept="image/*,application/pdf"
                                                            />
                                                        </div>

                                                        {/* Photo Link/Upload */}
                                                        <div className="flex flex-col items-center">
                                                            {p.photoUrl ? (
                                                                <a href={p.photoUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100 hover:bg-blue-100 transition-colors" title='Voir la photo'>
                                                                    <Image className="w-4 h-4" />
                                                                </a>
                                                            ) : (
                                                                <button
                                                                    onClick={() => document.getElementById(`upload-photo-${p.id}`)?.click()}
                                                                    disabled={uploadingDoc?.id === p.id}
                                                                    className={`p-1.5 bg-red-50 text-red-600 rounded-md border border-red-100 hover:bg-red-100 transition-colors ${uploadingDoc?.id === p.id && uploadingDoc?.type === 'photo' ? 'animate-pulse' : ''}`}
                                                                    title="Télécharger Photo"
                                                                >
                                                                    <Upload className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <span className="text-[10px] uppercase font-bold text-gray-400 mt-1">Photo</span>
                                                            <input
                                                                id={`upload-photo-${p.id}`}
                                                                type="file"
                                                                className="hidden"
                                                                onChange={(e) => e.target.files?.[0] && handleDocumentUpload(p.id, e.target.files[0], 'photo')}
                                                                accept="image/*"
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={editedPrice}
                                                            onChange={(e) => setEditedPrice(Number(e.target.value))}
                                                            className="w-28 px-2 py-1 border border-blue-300 rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            autoFocus
                                                            disabled={isSavingPrice}
                                                        />
                                                    ) : (
                                                        <span className="font-medium text-gray-900">
                                                            {(p.finalPrice || 0).toLocaleString()} DZD
                                                        </span>
                                                    )}
                                                </td>
                                                {user?.role === 'admin' && (
                                                    <td className="px-4 py-3 text-center">
                                                        {isEditing ? (
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() => handleSavePrice(p.id)}
                                                                    disabled={isSavingPrice}
                                                                    className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                                                                    title="Enregistrer"
                                                                >
                                                                    <Check size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={handleCancelEditPrice}
                                                                    disabled={isSavingPrice}
                                                                    className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                                                                    title="Annuler"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleStartEditPrice(p.id, p.finalPrice)}
                                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                                title="Modifier le prix"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                        )}
                                                    </td>
                                                )}
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
                                        {(user?.role === 'admin' || user?.role === 'agent') && (
                                            <button
                                                onClick={() => handleEditClick(payment)}
                                                className="p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Modifier"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        )}
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
                    if (!order) return;

                    const formData = new FormData(e.currentTarget);
                    const accountId = formData.get('accountId') as string;

                    const fileInput = (e.currentTarget as HTMLFormElement).querySelector('input[type="file"]') as HTMLInputElement;
                    const receiptFile = fileInput?.files?.[0];

                    if (paymentAmount > 0) {
                        try {
                            if (editingPayment) {
                                await api.put(`/payments/${editingPayment.id}`, {
                                    amount: paymentAmount,
                                    currency: paymentCurrency,
                                    exchangeRate: paymentExchangeRate,
                                    method: paymentMethod,
                                    accountId,
                                });
                                alert('Paiement modifié (remis en attente de validation).');
                            } else {
                                if (paymentMethod !== 'Cash') {
                                    if (!receiptFile) {
                                        alert('Veuillez télécharger une preuve de paiement pour ce mode de paiement.');
                                        return;
                                    }
                                    const uploadData = new FormData();
                                    uploadData.append('receipt', receiptFile);
                                    uploadData.append('amount', paymentAmount.toString());
                                    uploadData.append('method', paymentMethod);

                                    await import('../../services/api').then(({ paymentsAPI }) =>
                                        paymentsAPI.uploadReceipt(order.id, uploadData)
                                    );
                                    alert('Paiement ajouté avec reçu (en attente de validation).');
                                } else {
                                    await api.post('/payments', {
                                        orderId: order.id,
                                        amount: paymentAmount,
                                        currency: paymentCurrency,
                                        exchangeRate: paymentExchangeRate,
                                        method: paymentMethod,
                                        paymentDate: new Date().toISOString(),
                                        accountId
                                    });
                                    alert('Paiement ajouté (en attente de validation).');
                                }
                            }
                            // Reset
                            setEditingPayment(null);
                            setPaymentAmount(0);
                            setPaymentCurrency('DZD');
                            setPaymentMethod('Cash');
                            setIsPaymentModalOpen(false);
                            fetchOrder();
                        } catch (error: any) {
                            console.error("Failed to save payment:", error);
                            alert("Erreur lors de l'enregistrement du paiement: " + (error.message || 'Inconnue'));
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
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        >
                            <option value="Cash">Espèces</option>
                            <option value="CCP">CCP</option>
                            <option value="Baridimob">Baridimob</option>
                            <option value="Bank Transfer">Virement Bancaire</option>
                        </select>
                    </div>

                    {/* Receipt Upload (Only visible for new payments if method is not Cash, or make it dynamic) */}
                    {/* We can't easily detect method change here without state if using defaultValue. 
                        Let's add state for method if needed, or just show it but require it conditionally?
                        Ideally, we bind method to state. */}

                    {!editingPayment && paymentMethod !== 'Cash' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preuve de Paiement (Reçu) <span className="text-red-500">*</span></label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary transition-colors cursor-pointer bg-gray-50 hover:bg-white"
                                onClick={() => document.getElementById('receipt-upload')?.click()}
                            >
                                <div className="space-y-1 text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600 justify-center">
                                        <label htmlFor="receipt-upload" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-blue-500 focus-within:outline-none">
                                            <span>Télécharger un fichier</span>
                                            <input id="receipt-upload" name="receipt" type="file" className="sr-only" accept="image/*,application/pdf" required />
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, PDF jusqu'à 5MB</p>
                                    <p className="text-xs text-orange-600 mt-2 font-medium">Requis pour virement, CCP, Baridimob</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {user?.role === 'admin' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Compte de Réception</label>
                            <select
                                name="accountId"
                                required
                                defaultValue={editingPayment?.accountId || ''}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            >
                                <option value="">-- Sélectionner un compte --</option>
                                {(bankAccounts || []).map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.name} ({account.currency})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
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
