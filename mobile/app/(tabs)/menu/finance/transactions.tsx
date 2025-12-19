import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../../../context/LanguageContext';
import { ThemedText } from '../../../../components/ui/ThemedText';
import { Input } from '../../../../components/ui/Input';
import { Search, Filter } from 'lucide-react-native';

export default function TransactionsScreen() {
    const { t } = useLanguage();
    const { type } = useLocalSearchParams<{ type?: 'revenue' | 'expense' }>();

    const transactions = [
        { id: 1, label: 'Vente Omra #102', category: 'Ventes', amount: '180,000 DA', date: '2025-12-16', type: 'revenue' },
        { id: 2, label: 'Loyer Bureau', category: 'Charges Fixes', amount: '50,000 DA', date: '2025-12-01', type: 'expense' },
        { id: 3, label: 'Vente Billet #45', category: 'Billetterie', amount: '25,000 DA', date: '2025-12-15', type: 'revenue' },
        { id: 4, label: 'Facture Électricité', category: 'Utilitaires', amount: '12,000 DA', date: '2025-12-10', type: 'expense' },
    ];

    const filtered = type ? transactions.filter(t => t.type === type) : transactions;

    return (
        <View className="flex-1 bg-gray-50">
            <View className="bg-white p-4 border-b border-gray-100 flex-row gap-3">
                <View className="flex-1 relative">
                    <View className="absolute left-3 top-3.5 z-10">
                        <Search size={18} color="#9CA3AF" />
                    </View>
                    <Input placeholder={t('common.search')} containerClassName="mb-0" className="pl-10" />
                </View>
                <TouchableOpacity className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center border border-gray-200">
                    <Filter size={20} color="#374151" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
                {filtered.map((tx) => (
                    <View key={tx.id} className="bg-white p-4 rounded-xl border border-gray-100 mb-3 flex-row items-center justify-between">
                        <View>
                            <ThemedText className="font-[Inter_600SemiBold] text-gray-900">{tx.label}</ThemedText>
                            <ThemedText className="text-xs text-gray-500 mt-1">{tx.category} • {tx.date}</ThemedText>
                        </View>
                        <ThemedText className={`font-[Outfit_700Bold] ${tx.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === 'revenue' ? '+' : '-'} {tx.amount}
                        </ThemedText>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}
