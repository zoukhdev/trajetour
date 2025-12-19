import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useData } from '../../../context/DataContext';
import { useExchangeRates } from '../../../context/ExchangeRateContext';
import { ThemedText } from '../../../components/ui/ThemedText';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Printer, CreditCard, ArrowLeft, Users, FileText, Wallet, CheckCircle, Clock } from 'lucide-react-native';
import type { Payment, Currency, PaymentMethod } from '../../../types';

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
    const { getLatestRate, getRateForDate } = useExchangeRates();
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState<Currency>('DZD');
    const [method, setMethod] = useState<PaymentMethod>('Cash');
    const [accountId, setAccountId] = useState('');
    const [exchangeRate, setExchangeRate] = useState(1);
    const [amountDZD, setAmountDZD] = useState(0);

    // Update DZD amount and Exchange Rate
    useEffect(() => {
        if (currency !== 'DZD') {
            const rate = getLatestRate(currency);
            setExchangeRate(rate);
            setAmountDZD((parseFloat(amount) || 0) * rate);
        } else {
            setExchangeRate(1);
            setAmountDZD(parseFloat(amount) || 0);
        }
    }, [currency, amount]);

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
            amountDZD, // Calculated
            date: new Date().toISOString()
        });

        // Reset
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
    const { orders, clients, agencies, bankAccounts, addPayment } = useData();
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const orderId = Array.isArray(id) ? id[0] : id;
    const order = orders.find(o => o.id === orderId);

    // Derived Data
    const client = order ? clients.find(c => c.id === order.clientId) : undefined;
    const agency = order?.agencyId ? agencies.find(a => a.id === order.agencyId) : undefined;

    // Calculations
    const paidAmountDZD = Array.isArray(order?.payments)
        ? order.payments.filter(p => p.isValidated !== false).reduce((sum, p) => sum + (p.amountDZD || 0), 0)
        : 0;
    const remainingAmountDZD = (order?.totalAmountDZD || 0) - paidAmountDZD;
    const isPaid = remainingAmountDZD <= 1; // Tolerance for float diffs

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
                <TouchableOpacity onPress={() => Alert.alert("Imprimer", "Fonctionnalité PDF bientôt disponible")}>
                    <Printer size={20} color="#374151" />
                </TouchableOpacity>
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
                </View>

                {/* Financial Summary */}
                <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
                    <ThemedText className="font-semibold text-gray-900 mb-3">Détails Financiers</ThemedText>

                    <View className="flex-row justify-between mb-2">
                        <ThemedText className="text-gray-500">Total Commande</ThemedText>
                        <ThemedText className="font-bold">{(order.totalAmountDZD || 0).toLocaleString()} DZD</ThemedText>
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
                                            {new Date(p.date).toLocaleDateString()} • {p.method}
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

            <View className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 shadow-lg pb-8">
                <Button
                    title={remainingAmountDZD > 0 ? "Ajouter un Paiement" : "Commande Soldée"}
                    onPress={() => setShowPaymentModal(true)}
                    variant={remainingAmountDZD > 0 ? 'primary' : 'outline'}
                    disabled={remainingAmountDZD <= 0}
                    icon={<CreditCard size={20} color={remainingAmountDZD > 0 ? "white" : "gray"} />}
                />
            </View>

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
