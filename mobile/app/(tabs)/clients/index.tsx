import { useState } from 'react';
import { View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '../../../context/DataContext';
import { useLanguage } from '../../../context/LanguageContext';
import { ThemedText } from '../../../components/ui/ThemedText';
import { Input } from '../../../components/ui/Input';
import { Search, Plus, User, Building2, ChevronRight } from 'lucide-react-native';
import type { Client } from '../../../types';

export default function ClientsList() {
    const { clients, refreshData } = useData();
    const router = useRouter();
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    console.log('ClientsList Rendered', { clientsCount: clients?.length, searchTerm });

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    };

    const filteredClients = (clients || []).filter(client => {
        if (!client) return false;
        return (client?.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (client?.mobileNumber || '').includes(searchTerm);
    });

    const renderItem = ({ item }: { item: Client }) => (
        <TouchableOpacity
            className="flex-row items-center bg-white p-4 mb-2 rounded-xl mx-4 shadow-sm border border-gray-100"
            onPress={() => router.push({ pathname: '/(tabs)/clients/form', params: { id: item.id } })}
        >
            <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${item.type === 'Entreprise' ? 'bg-purple-50' : 'bg-blue-50'}`}>
                {item.type === 'Entreprise' ?
                    <Building2 size={24} color="#7C3AED" /> :
                    <User size={24} color="#2563EB" />
                }
            </View>
            <View className="flex-1">
                <ThemedText className="font-[Outfit_600SemiBold] text-gray-900">{item.fullName}</ThemedText>
                <ThemedText className="text-gray-500 text-sm">{item.mobileNumber}</ThemedText>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white p-4 pt-12 border-b border-gray-100">
                <View className="flex-row justify-between items-center mb-4">
                    <ThemedText variant="h2">{t('clients.title')}</ThemedText>
                    <TouchableOpacity
                        className="bg-blue-600 w-10 h-10 rounded-full items-center justify-center shadow-sm"
                        onPress={() => router.push('/(tabs)/clients/form')}
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
                data={filteredClients}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerClassName="py-4"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                            <User size={32} color="#9CA3AF" />
                        </View>
                        <ThemedText className="text-gray-400">{t('clients.no_clients')}</ThemedText>
                    </View>
                }
            />
        </View>
    );
}
