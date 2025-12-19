import { View, ScrollView } from 'react-native';
import { useLanguage } from '../../../../context/LanguageContext';
import { ThemedText } from '../../../../components/ui/ThemedText';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react-native';

export default function BilanScreen() {
    const { t } = useLanguage();

    // Mock Data - In real app, fetch from API
    const stats = [
        { label: t('menu.revenue_total'), value: '15,250,000 DA', icon: TrendingUp, color: '#10b981', bg: '#ecfdf5' },
        { label: t('menu.expenses_total'), value: '8,450,000 DA', icon: TrendingDown, color: '#ef4444', bg: '#fef2f2' },
        { label: t('menu.net_profit'), value: '6,800,000 DA', icon: DollarSign, color: '#6366f1', bg: '#eef2ff' },
        { label: t('menu.caisse_balance'), value: '2,300,000 DA', icon: Wallet, color: '#f59e0b', bg: '#fffbeb' },
    ];

    return (
        <ScrollView className="flex-1 bg-gray-50 p-4">
            <View className="flex-row flex-wrap gap-4">
                {stats.map((stat, index) => (
                    <View key={index} className="w-[47%] bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <View className="w-10 h-10 rounded-full items-center justify-center mb-3" style={{ backgroundColor: stat.bg }}>
                            <stat.icon size={20} color={stat.color} />
                        </View>
                        <ThemedText className="text-gray-500 text-xs font-[Inter_500Medium] uppercase tracking-wide">
                            {stat.label}
                        </ThemedText>
                        <ThemedText className="text-gray-900 text-lg font-[Outfit_700Bold] mt-1">
                            {stat.value}
                        </ThemedText>
                    </View>
                ))}
            </View>

            {/* Charts would go here (using react-native-chart-kit or victory-native) */}
            <View className="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 items-center justify-center h-64">
                <ThemedText className="text-gray-400 italic">Chart Placeholder</ThemedText>
            </View>
        </ScrollView>
    );
}
