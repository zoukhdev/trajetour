import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { useData } from '../../../../context/DataContext';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { ThemedText } from '../../../../components/ui/ThemedText';
import { Input } from '../../../../components/ui/Input';
import { Search, Filter, Eye, Trash2, CheckCircle, XCircle, Calendar, CreditCard, X } from 'lucide-react-native';

export default function PaymentsScreen() {
    const { t } = useLanguage();
    const { orders, clients, validatePayment, updateOrder } = useData();
    const { user: currentUser } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [viewingPayment, setViewingPayment] = useState<any | null>(null);

    // Flatten payments from all orders
    const allPayments = orders.flatMap(order =>
        (order.payments || []).map(payment => {
            const client = clients.find(c => c.id === order.clientId);
            return {
                ...payment,
                orderId: order.id,
                clientName: client?.fullName || 'Client Inconnu',
                orderTotal: order.totalAmount,
                // Ensure date is a string
                date: payment.date || payment.paymentDate || new Date().toISOString()
            };
        })
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredPayments = allPayments.filter(payment =>
        payment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.id && payment.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleValidate = async (paymentId: string, orderId: string, isValidated: boolean) => {
        Alert.alert(
            isValidated ? t('common.validate') : "Invalider",
            `Voulez-vous vraiment ${isValidated ? 'valider' : 'invalider'} ce paiement ?`,
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.confirm'),
                    onPress: async () => {
                        try {
                            await validatePayment(paymentId, orderId, isValidated);
                            setViewingPayment((prev: any) => prev ? { ...prev, isValidated } : null);
                        } catch (error) {
                            Alert.alert(t('common.error'), "Erreur lors de la mise à jour");
                        }
                    }
                }
            ]
        );
    };

    const handleDelete = (paymentId: string, orderId: string) => {
        Alert.alert(
            t('common.delete'),
            "Êtes-vous sûr de vouloir supprimer ce paiement ? Cela affectera le solde de la commande.",
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        const order = orders.find(o => o.id === orderId);
                        if (order) {
                            const updatedPayments = order.payments.filter(p => p.id !== paymentId);
                            // Start simple: just update logic.
                            // Recalc status logic is ideally shared but let's replicate specific logic here for now
                            // or just let backend handle it?
                            // Since we use updateOrder logic in frontend in PaymentList from webapp:

                            const totalPaid = updatedPayments.filter(p => p.isValidated).reduce((sum, p) => sum + (p.amountDZD || 0), 0);
                            let newStatus: 'paid' | 'pending' | 'partially_paid' | 'cancelled' | 'confirmed' = 'pending';
                            // Mapping status strings is tricky. Let's look at types.
                            // Order.status type is: 'pending' | 'confirmed' | 'cancelled' | 'paid' | 'partially_paid'
                            if (totalPaid >= order.totalAmount) newStatus = 'paid';
                            else if (totalPaid > 0) newStatus = 'partially_paid';

                            try {
                                await updateOrder({
                                    ...order,
                                    payments: updatedPayments,
                                    status: newStatus
                                });
                                Alert.alert(t('common.success'), "Paiement supprimé");
                            } catch (e) {
                                Alert.alert(t('common.error'), "Erreur suppression");
                            }
                        }
                    }
                }
            ]
        );
    };

    const isAdmin = currentUser?.role === 'admin';

    // Helper for Status Badge
    const renderStatusBadge = (isValidated?: boolean) => {
        if (isValidated === true) {
            return (
                <View className="bg-green-100 px-2 py-1 rounded-full flex-row items-center gap-1">
                    <CheckCircle size={12} color="#166534" />
                    <ThemedText className="text-xs font-bold text-green-800">Validé</ThemedText>
                </View>
            );
        } else if (isValidated === false) {
            return (
                <View className="bg-red-100 px-2 py-1 rounded-full flex-row items-center gap-1">
                    <XCircle size={12} color="#991B1B" />
                    <ThemedText className="text-xs font-bold text-red-800">Rejeté</ThemedText>
                </View>
            );
        } else {
            return (
                <View className="bg-gray-100 px-2 py-1 rounded-full flex-row items-center gap-1">
                    <Filter size={12} color="#4B5563" />
                    <ThemedText className="text-xs font-bold text-gray-700">En Attente</ThemedText>
                </View>
            );
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header & Search */}
            <View className="bg-white p-4 border-b border-gray-100">
                <ThemedText className="text-xl font-[Outfit_700Bold] text-gray-900 mb-4">
                    Historique des Paiements
                </ThemedText>
                <View className="flex-row gap-3">
                    <View className="flex-1 relative">
                        <Input
                            placeholder={t('common.search') + " (Client, Ref...)"}
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                            containerClassName="mb-0"
                            startIcon={<Search size={20} color="#9CA3AF" />}
                        />
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 p-4">
                {filteredPayments.length === 0 ? (
                    <View className="items-center justify-center py-10">
                        <ThemedText className="text-gray-400 italic">Aucun paiement trouvé</ThemedText>
                    </View>
                ) : (
                    filteredPayments.map((p, idx) => (
                        <TouchableOpacity
                            key={p.id || idx}
                            onPress={() => setViewingPayment(p)}
                            className="bg-white p-4 rounded-xl border border-gray-100 mb-3"
                        >
                            <View className="flex-row justify-between items-start mb-2">
                                <View>
                                    <ThemedText className="font-[Inter_600SemiBold] text-gray-900 text-base">{p.clientName}</ThemedText>
                                    <ThemedText className="text-xs text-blue-600 font-medium">CMD-{p.orderId?.substring(0, 6)}</ThemedText>
                                </View>
                                <ThemedText className="font-[Outfit_700Bold] text-green-600 text-lg">
                                    {(p.amountDZD || 0).toLocaleString()} DA
                                </ThemedText>
                            </View>

                            <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-50">
                                <View className="flex-row items-center gap-2">
                                    <Calendar size={14} color="#9CA3AF" />
                                    <ThemedText className="text-xs text-gray-500">
                                        {new Date(p.date).toLocaleDateString()}
                                    </ThemedText>
                                </View>
                                <View className="flex-row items-center gap-2">
                                    <View className="bg-blue-50 px-2 py-1 rounded-md flex-row items-center gap-1">
                                        <CreditCard size={12} color="#1D4ED8" />
                                        <ThemedText className="text-xs text-blue-700 font-medium">{p.method}</ThemedText>
                                    </View>
                                    {renderStatusBadge(p.isValidated)}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Detail Modal */}
            <Modal
                visible={!!viewingPayment}
                transparent
                animationType="slide"
                onRequestClose={() => setViewingPayment(null)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <ThemedText className="text-xl font-[Outfit_700Bold] text-gray-900">
                                Détails du Paiement
                            </ThemedText>
                            <TouchableOpacity
                                onPress={() => setViewingPayment(null)}
                                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                            >
                                <X size={18} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {viewingPayment && (
                            <View className="gap-4 mb-6">
                                <View className="bg-gray-50 p-4 rounded-xl flex-row justify-between items-center">
                                    <View>
                                        <ThemedText className="text-gray-500 text-xs uppercase mb-1">Montant</ThemedText>
                                        <ThemedText className="text-2xl font-[Outfit_700Bold] text-green-600">
                                            {(viewingPayment.amountDZD || 0).toLocaleString()} DA
                                        </ThemedText>
                                        {viewingPayment.currency !== 'DZD' && (
                                            <ThemedText className="text-xs text-gray-400">
                                                orig: {viewingPayment.amount} {viewingPayment.currency}
                                            </ThemedText>
                                        )}
                                    </View>
                                    {renderStatusBadge(viewingPayment.isValidated)}
                                </View>

                                <View className="flex-row gap-4">
                                    <View className="flex-1 bg-white border border-gray-100 p-3 rounded-lg">
                                        <ThemedText className="text-gray-400 text-xs mb-1">Client</ThemedText>
                                        <ThemedText className="font-semibold">{viewingPayment.clientName}</ThemedText>
                                    </View>
                                    <View className="flex-1 bg-white border border-gray-100 p-3 rounded-lg">
                                        <ThemedText className="text-gray-400 text-xs mb-1">Commande</ThemedText>
                                        <ThemedText className="font-semibold text-blue-600">#{viewingPayment.orderId?.substring(0, 8)}</ThemedText>
                                    </View>
                                </View>

                                <View className="flex-row gap-4">
                                    <View className="flex-1 bg-white border border-gray-100 p-3 rounded-lg">
                                        <ThemedText className="text-gray-400 text-xs mb-1">Date</ThemedText>
                                        <ThemedText className="font-semibold">{new Date(viewingPayment.date).toLocaleDateString()}</ThemedText>
                                    </View>
                                    <View className="flex-1 bg-white border border-gray-100 p-3 rounded-lg">
                                        <ThemedText className="text-gray-400 text-xs mb-1">Méthode</ThemedText>
                                        <ThemedText className="font-semibold">{viewingPayment.method}</ThemedText>
                                    </View>
                                </View>

                                {/* Admin Actions */}
                                {isAdmin && (
                                    <View className="mt-4 pt-4 border-t border-gray-100">
                                        <ThemedText className="font-bold text-gray-900 mb-3">Actions Admin</ThemedText>

                                        <View className="flex-row gap-2 mb-2">
                                            {viewingPayment.isValidated !== true && (
                                                <TouchableOpacity
                                                    onPress={() => handleValidate(viewingPayment.id, viewingPayment.orderId, true)}
                                                    className="flex-1 bg-green-50 py-3 rounded-lg items-center border border-green-100"
                                                >
                                                    <ThemedText className="text-green-700 font-semibold">Valider</ThemedText>
                                                </TouchableOpacity>
                                            )}
                                            {viewingPayment.isValidated !== false && (
                                                <TouchableOpacity
                                                    onPress={() => handleValidate(viewingPayment.id, viewingPayment.orderId, false)}
                                                    className="flex-1 bg-orange-50 py-3 rounded-lg items-center border border-orange-100"
                                                >
                                                    <ThemedText className="text-orange-700 font-semibold">Rejeter</ThemedText>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <TouchableOpacity
                                            onPress={() => {
                                                setViewingPayment(null);
                                                handleDelete(viewingPayment.id, viewingPayment.orderId);
                                            }}
                                            className="bg-red-50 py-3 rounded-lg items-center border border-red-100 mt-2"
                                        >
                                            <View className="flex-row items-center gap-2">
                                                <Trash2 size={16} color="#B91C1C" />
                                                <ThemedText className="text-red-700 font-semibold">Supprimer ce paiement</ThemedText>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

