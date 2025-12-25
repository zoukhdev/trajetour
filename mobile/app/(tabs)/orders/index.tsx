import { useState } from 'react';
import { View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { ThemedText } from '../../../components/ui/ThemedText';
import { Input } from '../../../components/ui/Input';
import { Search, Plus, ShoppingCart, Calendar, Trash2 } from 'lucide-react-native';
import type { Order } from '../../../types';

export default function OrdersList() {
    const { orders, clients, refreshData, deleteOrder } = useData();
    const { user } = useAuth();
    const router = useRouter();
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    };

    const handleDeleteOrder = (order: Order) => {
        if (!order.id) return;

        Alert.alert(
            "Suppression",
            `Êtes-vous sûr de vouloir supprimer la commande ${order.reference || order.id.substring(0, 6).toUpperCase()} ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteOrder(order.id);
                            // refreshData is called inside deleteOrder usually, but safe to refresh
                            await refreshData();
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Erreur", "Impossible de supprimer la commande");
                        }
                    }
                }
            ]
        );
    };

    const getClientName = (clientId: string) => {
        return clients.find(c => c.id === clientId)?.fullName || 'Client Inconnu';
    };

    const filteredOrders = (orders || []).filter(order => {
        if (!order) return false;
        const clientName = getClientName(order.clientId).toLowerCase();
        return clientName.includes(searchTerm.toLowerCase()) ||
            (order.reference || '').toLowerCase().includes(searchTerm.toLowerCase());
    });

    const renderItem = ({ item }: { item: Order }) => {
        const paidAmount = (item.payments || []).reduce((sum, p) => sum + (p.amountDZD || 0), 0);
        // Fallback to 0 if totalAmountDZD is undefined
        const total = item.totalAmountDZD || item.totalAmount || 0;
        const remaining = total - paidAmount;

        // Calculate payment status dynamically
        let paymentStatus = 'Non payé';
        if (paidAmount >= total && total > 0) {
            paymentStatus = 'Payé';
        } else if (paidAmount > 0 && paidAmount < total) {
            paymentStatus = 'Partiel';
        }

        let statusColor = 'bg-gray-100 text-gray-800';
        if (paymentStatus === 'Payé') statusColor = 'bg-green-100 text-green-800';
        else if (paymentStatus === 'Partiel') statusColor = 'bg-yellow-100 text-yellow-800';
        else if (paymentStatus === 'Non payé') statusColor = 'bg-red-100 text-red-800';

        return (
            <TouchableOpacity
                className="bg-white p-4 mb-3 rounded-xl mx-4 shadow-sm border border-gray-100"
                onPress={() => router.push({ pathname: '/(tabs)/orders/[id]', params: { id: item.id } })}
            >
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                        <ThemedText className="font-bold text-gray-900 text-lg">
                            {getClientName(item.clientId)}
                        </ThemedText>
                        <ThemedText className="text-gray-500 text-xs">
                            {t('orders.ref')}-{item.reference || (item.id || '').substring(0, 6).toUpperCase()}
                        </ThemedText>
                    </View>
                    <View className={`px-2 py-1 rounded-full ${statusColor.split(' ')[0]}`}>
                        <ThemedText className={`text-xs font-medium ${statusColor.split(' ')[1]}`}>
                            {paymentStatus}
                        </ThemedText>
                    </View>
                    {user?.role === 'admin' && (
                        <TouchableOpacity
                            onPress={() => handleDeleteOrder(item)}
                            className="ml-2 p-1 bg-red-50 rounded-full"
                        >
                            <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                </View>

                <View className="flex-row items-center gap-2 mb-3">
                    <Calendar size={14} color="#9CA3AF" />
                    <ThemedText className="text-gray-500 text-sm">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                    </ThemedText>
                </View>

                <View className="flex-row justify-between items-center border-t border-gray-50 pt-3">
                    <View>
                        <ThemedText className="text-gray-400 text-xs uppercase">{t('orders.total')}</ThemedText>
                        <ThemedText className="font-bold text-gray-900">
                            {total.toLocaleString()} DZD
                        </ThemedText>
                    </View>
                    {remaining > 0 && (
                        <View className="items-end">
                            <ThemedText className="text-red-400 text-xs uppercase">{t('orders.remaining')}</ThemedText>
                            <ThemedText className="font-bold text-red-600">
                                {remaining.toLocaleString()} DZD
                            </ThemedText>
                        </View>
                    )}
                    {remaining <= 0 && (
                        <View className="items-end">
                            <ThemedText className="text-green-400 text-xs uppercase">{t('orders.paid')}</ThemedText>
                            <ThemedText className="font-bold text-green-600">
                                {paidAmount.toLocaleString()} DZD
                            </ThemedText>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white p-4 pt-12 border-b border-gray-100">
                <View className="flex-row justify-between items-center mb-4">
                    <ThemedText variant="h2">{t('orders.title')}</ThemedText>
                    <TouchableOpacity
                        className="bg-blue-600 w-10 h-10 rounded-full items-center justify-center shadow-sm"
                        onPress={() => router.push('/(tabs)/orders/form')}
                    >
                        <Plus size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="relative">
                    <View className="absolute left-3 top-3 z-10">
                        <Search size={20} color="#9CA3AF" />
                    </View>
                    <Input
                        placeholder={t('common.search')}
                        className="pl-10 bg-gray-50 border-0"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        containerClassName="mb-0"
                    />
                </View>
            </View>

            <FlatList
                data={filteredOrders}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerClassName="py-4"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                            <ShoppingCart size={32} color="#9CA3AF" />
                        </View>
                        <ThemedText className="text-gray-400">{t('orders.no_orders')}</ThemedText>
                    </View>
                }
            />
        </View>
    );
}
