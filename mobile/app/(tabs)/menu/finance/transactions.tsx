import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useLanguage } from '../../../../context/LanguageContext';
import { useData } from '../../../../context/DataContext';
import { ThemedText } from '../../../../components/ui/ThemedText';
import { Input } from '../../../../components/ui/Input';
import { Search, Filter, TrendingUp, TrendingDown } from 'lucide-react-native';

export default function TransactionsScreen() {
    const { t } = useLanguage();
    const { transactions } = useData();
    const { type: initialType } = useLocalSearchParams<{ type?: string }>();

    // Normalise initialType to uppercase if it comes as 'revenue'/'expense' or lowercase
    const normalizedInitialType = (initialType === 'revenue' ? 'IN' : initialType === 'expense' ? 'OUT' : initialType?.toUpperCase()) as 'IN' | 'OUT' | 'ALL';

    // State
    const [filterType, setFilterType] = useState<string>(normalizedInitialType || 'ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = transactions.filter(tx => {
        const matchesType = filterType === 'ALL' || tx.type === filterType;
        const matchesSearch =
            (tx.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tx.source || '').toLowerCase().includes(searchQuery.toLowerCase());

        return matchesType && matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header Filter */}
            <View className="bg-white p-4 border-b border-gray-100 gap-3">
                {/* Filter Chips */}
                <View className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={() => setFilterType('ALL')}
                        className={`px-4 py-2 rounded-full border ${filterType === 'ALL' ? 'bg-gray-800 border-gray-800' : 'bg-white border-gray-200'}`}
                    >
                        <ThemedText className={`font-semibold text-xs ${filterType === 'ALL' ? 'text-white' : 'text-gray-600'}`}>Tous</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFilterType('IN')}
                        className={`px-4 py-2 rounded-full border flex-row items-center gap-1 ${filterType === 'IN' ? 'bg-green-600 border-green-600' : 'bg-white border-gray-200'}`}
                    >
                        <TrendingUp size={14} color={filterType === 'IN' ? 'white' : '#16A34A'} />
                        <ThemedText className={`font-semibold text-xs ${filterType === 'IN' ? 'text-white' : 'text-gray-600'}`}>Recettes</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFilterType('OUT')}
                        className={`px-4 py-2 rounded-full border flex-row items-center gap-1 ${filterType === 'OUT' ? 'bg-red-600 border-red-600' : 'bg-white border-gray-200'}`}
                    >
                        <TrendingDown size={14} color={filterType === 'OUT' ? 'white' : '#DC2626'} />
                        <ThemedText className={`font-semibold text-xs ${filterType === 'OUT' ? 'text-white' : 'text-gray-600'}`}>Dépenses</ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View className="flex-row gap-3">
                    <View className="flex-1 relative">
                        <View className="absolute left-3 top-3.5 z-10">
                            <Search size={18} color="#9CA3AF" />
                        </View>
                        <Input
                            placeholder={t('common.search')}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            containerClassName="mb-0"
                            className="pl-10"
                        />
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 p-4">
                {filtered.length === 0 ? (
                    <View className="items-center justify-center py-12">
                        <Filter size={48} color="#E5E7EB" />
                        <ThemedText className="text-gray-400 mt-4">Aucune transaction trouvée</ThemedText>
                    </View>
                ) : (
                    filtered.map((tx) => (
                        <View key={tx.id} className="bg-white p-4 rounded-xl border border-gray-100 mb-3 flex-row items-center justify-between">
                            <View className="flex-1 pr-2">
                                <ThemedText className="font-[Inter_600SemiBold] text-gray-900" numberOfLines={1}>{tx.description}</ThemedText>
                                <View className="flex-row items-center gap-2 mt-1">
                                    <View className="bg-gray-100 px-2 py-0.5 rounded">
                                        <ThemedText className="text-[10px] text-gray-500 uppercase font-bold">{tx.source}</ThemedText>
                                    </View>
                                    <ThemedText className="text-xs text-gray-400">• {new Date(tx.date).toLocaleDateString()}</ThemedText>
                                </View>
                            </View>
                            <View className="items-end">
                                <ThemedText className={`font-[Outfit_700Bold] text-base ${tx.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'IN' ? '+' : '-'} {(tx.amountDZD || tx.amount).toLocaleString()}
                                </ThemedText>
                                <ThemedText className="text-[10px] text-gray-400 font-medium">
                                    {tx.currency !== 'DZD' ? `${tx.amount} ${tx.currency}` : 'DZD'}
                                </ThemedText>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

