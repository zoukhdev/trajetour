import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useExchangeRates } from '../../../context/ExchangeRateContext';
import { ThemedText } from '../../../components/ui/ThemedText';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Printer, CreditCard, ArrowLeft, Users, FileText, Wallet, CheckCircle, Clock, User, Trash2, Edit3, Check, X } from 'lucide-react-native';
import type { Payment, Currency, PaymentMethod, Order } from '../../../types';

// Simple Payment Modal Component
const PaymentModal = ({
    visible,
    onClose,
    onSave,
    orderCurrency,
    accounts
}: {
    visible: boolean;
    onClose: () => void;
    onSave: (payment: Partial<Payment>) => void;
    orderCurrency: Currency;
    accounts: any[];
}) => {
    const { getLatestRate } = useExchangeRates();
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState<Currency>('DZD');
    const [method, setMethod] = useState<PaymentMethod>('Cash');
    const [accountId, setAccountId] = useState('');
    const [exchangeRate, setExchangeRate] = useState(1);
    const [amountDZD, setAmountDZD] = useState(0);

    useEffect(() => {
        if (currency !== 'DZD') {
            const rate = getLatestRate(currency);
            setExchangeRate(rate);
            setAmountDZD((parseFloat(amount) || 0) * rate);
        } else {
            setExchangeRate(1);
            setAmountDZD(parseFloat(amount) || 0);
        }
    }, [currency, amount, getLatestRate]);

    const handleSave = () => {
        if (!amount || !method) {
            Alert.alert('Erreur', 'Veuillez remplir le montant et le mode de paiement');
            return;
        }

        onSave({
            amount: parseFloat(amount),
            currency,
            method,
            accountId,
            exchangeRateUsed: exchangeRate,
            amountDZD,
            date: new Date().toISOString()
        });

        setAmount('');
        setAccountId('');
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View className="flex-1 bg-white pt-6">
                <View className="px-4 pb-4 border-b border-gray-100 flex-row justify-between items-center">
                    <ThemedText variant="h3">Ajouter un Paiement</ThemedText>
                    <TouchableOpacity onPress={onClose}>
                        <ThemedText className="text-blue-600">Fermer</ThemedText>
                    </TouchableOpacity>
                </View>

                <ScrollView className="p-4">
                    <View className="mb-4">
                        <ThemedText className="text-sm font-medium text-gray-700 mb-2">Devise</ThemedText>
                        <View className="flex-row gap-2">
                            {['DZD', 'EUR', 'SAR'].map(c => (
                                <TouchableOpacity
                                    key={c}
                                    onPress={() => setCurrency(c as Currency)}
                                    className={`flex-1 py-2 items-center rounded-lg border ${currency === c
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-white border-gray-200'
                                        }`}
                                >
                                    <ThemedText className={`font-bold ${currency === c ? 'text-blue-700' : 'text-gray-500'}`}>
                                        {c}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View className="mb-4">
                        <ThemedText className="text-sm font-medium text-gray-700 mb-2">Montant</ThemedText>
                        <Input
                            placeholder="0.00"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                        />
                        {currency !== 'DZD' && (
                            <ThemedText className="text-xs text-gray-400 mt-1">
                                Taux: {exchangeRate} | ≈ {amountDZD.toLocaleString()} DZD
                            </ThemedText>
                        )}
                    </View>

                    <View className="mb-4">
                        <ThemedText className="text-sm font-medium text-gray-700 mb-2">Mode</ThemedText>
                        <View className="flex-row gap-2 flex-wrap">
                            {['Cash', 'CCP', 'Baridimob', 'Bank Transfer'].map(m => (
                                <TouchableOpacity
                                    key={m}
                                    onPress={() => setMethod(m as PaymentMethod)}
                                    className={`px-3 py-2 rounded-lg border ${method === m
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-white border-gray-200'
                                        }`}
                                >
                                    <ThemedText className={`text-sm ${method === m ? 'text-blue-700' : 'text-gray-600'}`}>
                                        {m}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View className="mb-6">
                        <ThemedText className="text-sm font-medium text-gray-700 mb-2">Compte de Réception</ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                            {accounts.map(acc => (
                                <TouchableOpacity
                                    key={acc.id}
                                    onPress={() => setAccountId(acc.id)}
                                    className={`px-4 py-3 rounded-lg border ${accountId === acc.id
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-white border-gray-200'
                                        }`}
                                >
                                    <ThemedText className={`font-medium ${accountId === acc.id ? 'text-blue-900' : 'text-gray-800'}`}>
                                        {acc.name}
                                    </ThemedText>
                                    <ThemedText className="text-xs text-gray-500">{acc.currency}</ThemedText>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <Button
                        title="Confirmer le Paiement"
                        onPress={handleSave}
                        size="lg"
                    />
                </ScrollView>
            </View>
        </Modal>
    );
};

export default function OrderDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { orders, clients, bankAccounts, addPayment, deleteOrder, updatePassengerPrice } = useData();
    const { user } = useAuth();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingPassengerId, setEditingPassengerId] = useState<string | null>(null);
    const [editedPrice, setEditedPrice] = useState('');
    const [isSavingPrice, setIsSavingPrice] = useState(false);

    const orderId = Array.isArray(id) ? id[0] : id;
    const order = orders.find(o => o.id === orderId);

    const client = order ? clients.find(c => c.id === order.clientId) : undefined;

    const paidAmountDZD = Array.isArray(order?.payments)
        ? order.payments.filter(p => p.isValidated !== false).reduce((sum, p) => sum + (p.amountDZD || 0), 0)
        : 0;
    const totalDZD = order?.totalAmountDZD || order?.totalAmount || 0;
    const remainingAmountDZD = totalDZD - paidAmountDZD;
    const isPaid = remainingAmountDZD <= 1;

    const handleAddPayment = async (paymentData: Partial<Payment>) => {
        if (!order) return;
        try {
            await addPayment(paymentData as Payment, order.id);
            setShowPaymentModal(false);
            Alert.alert("Succès", "Paiement ajouté avec succès");
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Impossible d'ajouter le paiement");
        }
    };

    const handleDeleteOrder = () => {
        if (!order) return;
        Alert.alert(
            "Suppression",
            "Êtes-vous sûr de vouloir supprimer cette commande et tous les paiements/transactions associés ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteOrder(order.id);
                            router.replace('/(tabs)/orders');
                        } catch (error) {
                            Alert.alert("Erreur", "Impossible de supprimer la commande");
                        }
                    }
                }
            ]
        );
    };

    const handleStartEditPrice = (passengerId: string, currentPrice: number) => {
        setEditingPassengerId(passengerId);
        setEditedPrice(currentPrice.toString());
    };

    const handleSavePrice = async (passengerId: string) => {
        if (!order) return;
        const newPrice = parseFloat(editedPrice);
        if (isNaN(newPrice)) return;

        setIsSavingPrice(true);
        try {
            await updatePassengerPrice(passengerId, order.id, newPrice);
            setEditingPassengerId(null);
        } catch (error) {
            Alert.alert("Erreur", "Impossible de mettre à jour le prix");
        } finally {
            setIsSavingPrice(false);
        }
    };

    const isPassportExpiringSoon = (expiry: string) => {
        if (!expiry) return false;
        const expiryDate = new Date(expiry);
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        return expiryDate < sixMonthsFromNow;
    };

    if (!order) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ThemedText>Commande introuvable</ThemedText>
                <Button title="Retour" onPress={() => router.back()} variant="outline" className="mt-4" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 flex-row justify-between items-center shadow-sm z-10">
                <TouchableOpacity onPress={() => router.back()} className="flex-row items-center gap-2">
                    <ArrowLeft size={20} color="#374151" />
                    <ThemedText className="text-lg font-semibold text-gray-700">Retour</ThemedText>
                </TouchableOpacity>
                <View className="flex-row items-center gap-4">
                    {user?.role === 'admin' && (
                        <TouchableOpacity onPress={handleDeleteOrder}>
                            <Trash2 size={20} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => Alert.alert("Imprimer", "Fonctionnalité PDF bientôt disponible")}>
                        <Printer size={20} color="#374151" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Status & Summary Card */}
                <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
                    <View className="flex-row justify-between items-start mb-2">
                        <View>
                            <ThemedText className="text-xs text-gray-500 uppercase tracking-widest mb-1">Référence</ThemedText>
                            <ThemedText className="text-xl font-bold bg-gray-100 px-2 py-1 rounded overflow-hidden">
                                {order.reference || order.id.substring(0, 6).toUpperCase()}
                            </ThemedText>
                        </View>
                        <View className={`px-3 py-1 rounded-full ${isPaid ? 'bg-green-100' : 'bg-red-100'}`}>
                            <ThemedText className={`font-bold text-xs ${isPaid ? 'text-green-800' : 'text-red-800'}`}>
                                {isPaid ? 'PAYÉ' : 'NON PAYÉ'}
                            </ThemedText>
                        </View>
                    </View>

                    <View className="mt-4 space-y-3">
                        <View className="flex-row items-center gap-2">
                            <Users size={16} color="#6B7280" />
                            <ThemedText className="text-gray-900 font-medium">{client?.fullName || 'Client inconnu'}</ThemedText>
                        </View>
                        <View className="flex-row items-center gap-2">
                            <FileText size={16} color="#6B7280" />
                            <ThemedText className="text-gray-600">
                                {order.passengers?.length || 0} Passager{(order.passengers?.length || 0) > 1 ? 's' : ''}
                            </ThemedText>
                        </View>
                    </View>

                    {(remainingAmountDZD > 0 || user?.role === 'admin' || user?.role === 'agent') && (
                        <TouchableOpacity
                            onPress={() => setShowPaymentModal(true)}
                            className="mt-4 bg-blue-600 py-3 rounded-lg flex-row justify-center items-center gap-2 shadow-sm"
                        >
                            <CreditCard size={18} color="white" />
                            <ThemedText className="text-white font-bold">Ajouter un Paiement</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Passengers Detail Section */}
                <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
                    <ThemedText className="font-semibold text-gray-900 mb-4">Passagers & Chambres</ThemedText>
                    {(order.passengers || []).map((p, index) => (
                        <View key={p.id || index} className="mb-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                            <View className="flex-row justify-between items-start">
                                <View className="flex-row items-center gap-2 flex-1">
                                    <View className="bg-gray-100 p-2 rounded-full">
                                        <User size={16} color="#6B7280" />
                                    </View>
                                    <View className="flex-1">
                                        <ThemedText className="font-bold text-gray-900">{p.firstName} {p.lastName}</ThemedText>
                                        <ThemedText className="text-xs text-gray-500 uppercase">
                                            {p.ageCategory === 'INF' ? 'BÉBÉ' : p.ageCategory === 'CHD' ? 'ENFANT' : 'ADULTE'}
                                            {p.birthDate ? ` • ${p.birthDate}` : ''}
                                        </ThemedText>
                                    </View>
                                </View>

                                {editingPassengerId === p.id ? (
                                    <View className="flex-row items-center gap-2">
                                        <Input
                                            value={editedPrice}
                                            onChangeText={setEditedPrice}
                                            keyboardType="numeric"
                                            className="w-24 h-9 py-0 px-2 text-sm mb-0"
                                            containerClassName="mb-0"
                                        />
                                        <TouchableOpacity
                                            onPress={() => handleSavePrice(p.id)}
                                            disabled={isSavingPrice}
                                            className="bg-green-100 p-2 rounded-full"
                                        >
                                            <Check size={14} color="#16A34A" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => setEditingPassengerId(null)}
                                            className="bg-red-100 p-2 rounded-full"
                                        >
                                            <X size={14} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View className="flex-row items-center gap-2">
                                        <View className="items-end">
                                            <ThemedText className="text-sm font-bold text-blue-600">
                                                {(p.finalPrice || 0).toLocaleString()} DZD
                                            </ThemedText>
                                            <ThemedText className="text-[10px] text-gray-400">Prix Chambre</ThemedText>
                                        </View>
                                        {user?.role === 'admin' && (
                                            <TouchableOpacity
                                                onPress={() => handleStartEditPrice(p.id, p.finalPrice || 0)}
                                                className="bg-gray-50 p-2 rounded-full"
                                            >
                                                <Edit3 size={14} color="#6B7280" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </View>

                            <View className="mt-3 pl-10">
                                <View className="flex-row items-center gap-2">
                                    <ThemedText className="text-xs text-gray-600">Passeport: {p.passportNumber || '-'}</ThemedText>
                                    {p.passportExpiry && (
                                        <ThemedText className="text-xs text-gray-400"> (Exp: {p.passportExpiry})</ThemedText>
                                    )}
                                </View>
                                {p.passportExpiry && isPassportExpiringSoon(p.passportExpiry) && (
                                    <ThemedText className="text-[10px] text-red-500 font-bold mt-1">
                                        ⚠️ Le passeport expire dans moins de 6 mois
                                    </ThemedText>
                                )}
                            </View>
                        </View>
                    ))}
                    {(order.passengers || []).length === 0 && (
                        <ThemedText className="text-gray-400 italic text-center py-2">Aucun passager</ThemedText>
                    )}
                </View>

                {/* Financial Summary */}
                <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
                    <ThemedText className="font-semibold text-gray-900 mb-3">Détails Financiers</ThemedText>

                    <View className="flex-row justify-between mb-2">
                        <ThemedText className="text-gray-500">Total Commande</ThemedText>
                        <ThemedText className="font-bold">{totalDZD.toLocaleString()} DZD</ThemedText>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <ThemedText className="text-gray-500">Montant Payé</ThemedText>
                        <ThemedText className="font-bold text-green-600">{(paidAmountDZD || 0).toLocaleString()} DZD</ThemedText>
                    </View>
                    <View className="border-t border-gray-100 pt-2 mt-1 flex-row justify-between">
                        <ThemedText className="text-gray-900 font-bold">Reste à Payer</ThemedText>
                        <ThemedText className={`font-bold text-lg ${remainingAmountDZD > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {(remainingAmountDZD || 0).toLocaleString()} DZD
                        </ThemedText>
                    </View>
                </View>

                {/* Payment History */}
                <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-20">
                    <View className="flex-row justify-between items-center mb-4">
                        <ThemedText className="font-semibold text-gray-900">Historique Paiements</ThemedText>
                        <TouchableOpacity onPress={() => setShowPaymentModal(true)}>
                            <ThemedText className="text-blue-600 font-medium">+ Ajouter</ThemedText>
                        </TouchableOpacity>
                    </View>

                    {(order.payments || []).length === 0 ? (
                        <ThemedText className="text-gray-400 italic text-center py-4">Aucun paiement enregistré</ThemedText>
                    ) : (
                        (order.payments || []).map((p, idx) => (
                            <View key={idx} className="flex-row items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                <View className="flex-row items-center gap-3">
                                    <View className="bg-blue-50 p-2 rounded-full">
                                        <Wallet size={16} color="#2563EB" />
                                    </View>
                                    <View>
                                        <ThemedText className="font-medium text-gray-900">
                                            {p.amount.toLocaleString()} {p.currency}
                                        </ThemedText>
                                        <ThemedText className="text-xs text-gray-500">
                                            {new Date(p.paymentDate || '').toLocaleDateString()} • {p.method}
                                        </ThemedText>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${p.isValidated ? 'bg-green-50' : 'bg-yellow-50'}`}>
                                        {p.isValidated ? <CheckCircle size={10} color="#16A34A" /> : <Clock size={10} color="#CA8A04" />}
                                        <ThemedText className={`text-[10px] font-bold ${p.isValidated ? 'text-green-700' : 'text-yellow-700'}`}>
                                            {p.isValidated ? 'VALIDÉ' : 'EN ATTENTE'}
                                        </ThemedText>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {(remainingAmountDZD > 0 || user?.role === 'admin' || user?.role === 'agent') && (
                <View className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 shadow-lg pb-8">
                    <Button
                        title="Ajouter un Paiement"
                        onPress={() => setShowPaymentModal(true)}
                        variant="primary"
                        icon={<CreditCard size={20} color="white" />}
                    />
                </View>
            )}

            <PaymentModal
                visible={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSave={handleAddPayment}
                orderCurrency={order.orderCurrency}
                accounts={bankAccounts}
            />
        </View>
    );
}
