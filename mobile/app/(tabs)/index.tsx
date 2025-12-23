import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { ThemedText } from '../../components/ui/ThemedText';
import {
    ShoppingCart,
    Users,
    Tag,
    TrendingUp,
    Plus,
    CreditCard,
    FileText,
    Clock
} from 'lucide-react-native';
import { useState, useCallback } from 'react';

export default function Dashboard() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const router = useRouter();
    const {
        orders,
        clients,
        offers,
        refreshData
    } = useData();

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    }, [refreshData]);

    // Calculate Stats
    const totalRevenue = orders.reduce((sum, order) => {
        // This is simplified. In a real app, sum "paid" amounts from payments
        // For now, let's sum the `total` of orders as a placeholder/estimate
        // Or better: sum the `payments` array if available
        const orderPaid = order.payments?.reduce((pSum, p) => pSum + (p.amountDZD || 0), 0) || 0;
        return sum + orderPaid;
    }, 0);

    const pendingOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;

    // Recent Activities (Just taking last 5 orders for now)
    const recentActivity = [...orders]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    const stats = [
        {
            label: t('common.total_revenue'),
            value: `${totalRevenue.toLocaleString()} DA`,
            icon: TrendingUp,
            color: '#10b981',
            bg: '#ecfdf5'
        },
        {
            label: t('common.pending_orders'),
            value: pendingOrdersCount.toString(),
            icon: ShoppingCart,
            color: '#f59e0b',
            bg: '#fffbeb'
        },
        {
            label: t('common.total_clients'),
            value: clients.length.toString(),
            icon: Users,
            color: '#3b82f6',
            bg: '#eff6ff'
        },
        {
            label: t('common.active_offers'),
            value: offers.length.toString(),
            icon: Tag,
            color: '#8b5cf6',
            bg: '#f5f3ff'
        },
    ];

    const quickActions = [
        { label: t('orders.new_order'), icon: Plus, route: '/(tabs)/orders/form', color: '#2563EB' },
        { label: t('clients.new_client'), icon: Users, route: '/(tabs)/clients/form', color: '#10B981' },
        { label: t('offers.new_offer'), icon: Tag, route: '/(tabs)/offers/form', color: '#8B5CF6' },
    ];

    return (
        <ScrollView
            className="flex-1 bg-gray-50 p-4"
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header - Title removed as it's in the nav bar */}
            <View className="mb-6 flex-row justify-between items-center">
                <View>
                    <ThemedText className="text-gray-500 mt-1">
                        Bonjour, <ThemedText className="font-bold">{user?.username}</ThemedText>
                    </ThemedText>
                </View>
                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                    <ThemedText className="text-blue-600 font-bold text-lg">
                        {user?.username?.charAt(0).toUpperCase()}
                    </ThemedText>
                </View>
            </View>

            {/* Stats Grid */}
            <View className="flex-row flex-wrap gap-4 mb-8">
                {stats.filter(stat => {
                    if (user?.role === 'agent') {
                        // Agent: Only show pending orders, hide total revenue (and others if needed)
                        // User request: "only : a. in the tableau de bord : commandes en attente"
                        return stat.label === t('common.pending_orders');
                    }
                    return true;
                }).map((stat, index) => (
                    <View key={index} className="w-[47%] bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <View className="w-10 h-10 rounded-full items-center justify-center mb-3" style={{ backgroundColor: stat.bg }}>
                            <stat.icon size={20} color={stat.color} />
                        </View>
                        <ThemedText className="text-gray-500 text-xs font-[Inter_500Medium] uppercase tracking-wide">
                            {stat.label}
                        </ThemedText>
                        <ThemedText className="text-gray-900 text-lg font-[Outfit_700Bold] mt-1" numberOfLines={1} adjustsFontSizeToFit>
                            {stat.value}
                        </ThemedText>
                    </View>
                ))}
            </View>

            {/* Quick Actions */}
            <View className="mb-8">
                <ThemedText className="text-sm font-[Outfit_600SemiBold] text-gray-500 uppercase tracking-wider mb-3 ml-1">
                    {t('common.quick_actions')}
                </ThemedText>
                <View className="flex-row gap-4">
                    {quickActions.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 items-center justify-center flex-1"
                            onPress={() => router.push(action.route as any)}
                        >
                            <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mb-2">
                                <action.icon size={20} color={action.color} />
                            </View>
                            <ThemedText className="text-xs font-semibold text-center text-gray-700">
                                {action.label}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Recent Activity */}
            <View className="mb-20">
                <ThemedText className="text-sm font-[Outfit_600SemiBold] text-gray-500 uppercase tracking-wider mb-3 ml-1">
                    {t('common.recent_activity')}
                </ThemedText>
                {recentActivity.length > 0 ? (
                    recentActivity.map((order) => (
                        <TouchableOpacity
                            key={order.id}
                            className="bg-white p-4 rounded-xl border border-gray-100 mb-3 flex-row items-center justify-between"
                            onPress={() => router.push({ pathname: '/(tabs)/orders/form', params: { id: order.id } })}
                        >
                            <View className="flex-row items-center gap-3">
                                <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
                                    <FileText size={18} color="#3b82f6" />
                                </View>
                                <View>
                                    <ThemedText className="font-[Inter_600SemiBold] text-gray-900">
                                        Commande #{order.id.substring(0, 8)}
                                    </ThemedText>
                                    <View className="flex-row items-center gap-1">
                                        <Clock size={12} color="#9CA3AF" />
                                        <ThemedText className="text-xs text-gray-500">{order.date}</ThemedText>
                                    </View>
                                </View>
                            </View>
                            <View className={`px-2 py-1 rounded-md ${order.status === 'paid' ? 'bg-green-100' :
                                order.status === 'confirmed' ? 'bg-blue-100' : 'bg-yellow-100'
                                }`}>
                                <ThemedText className={`text-xs font-bold capitalize ${order.status === 'paid' ? 'text-green-700' :
                                    order.status === 'confirmed' ? 'text-blue-700' : 'text-yellow-700'
                                    }`}>
                                    {order.status}
                                </ThemedText>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View className="p-8 items-center justify-center">
                        <ThemedText className="text-gray-400 italic">Aucune activité récente</ThemedText>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
