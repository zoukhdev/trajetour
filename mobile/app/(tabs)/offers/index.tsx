import { useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '../../../context/DataContext';
import { useLanguage } from '../../../context/LanguageContext';
import { ThemedText } from '../../../components/ui/ThemedText';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Plus, Search, MapPin, Calendar, Tag, Trash2, Pencil, Users } from 'lucide-react-native';
import { Offer } from '../../../types';

export default function OffersListScreen() {
    const router = useRouter();
    const { offers, deleteOffer, refreshData } = useData();
    const { t } = useLanguage();
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    }, [refreshData]);

    const filteredOffers = offers.filter(offer =>
        offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.destination.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = (id: string) => {
        Alert.alert(
            t('common.delete'),
            t('offers.confirm_delete'),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('common.delete'),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteOffer(id);
                        } catch (error) {
                            Alert.alert(t('common.error'), t('common.error_occurred'));
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800';
            case 'Draft': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 shadow-sm z-10 flex-row justify-between items-center">
                <ThemedText variant="h2" className="text-gray-900">{t('common.offers')}</ThemedText>
                <TouchableOpacity
                    onPress={() => router.push('/(tabs)/offers/form')}
                    className="bg-purple-600 px-3 py-2 rounded-lg flex-row items-center gap-2 shadow-md"
                >
                    <Plus size={18} color="white" />
                    <ThemedText className="text-white font-bold text-sm">{t('common.new')}</ThemedText>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="px-4 py-3 bg-white border-b border-gray-100">
                <View className="relative">
                    <Input
                        placeholder={t('common.search')}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        containerClassName="mb-0"
                        startIcon={<Search size={20} color="#9CA3AF" />}
                    />
                </View>
            </View>

            <ScrollView
                className="flex-1 p-4"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {filteredOffers.length === 0 ? (
                    <View className="flex-1 items-center justify-center py-20 opacity-50">
                        <View className="bg-gray-100 p-6 rounded-full mb-4">
                            <Tag size={48} color="#9CA3AF" />
                        </View>
                        <ThemedText className="text-gray-500 font-medium">Aucune offre trouvée</ThemedText>
                    </View>
                ) : (
                    filteredOffers.map((offer) => (
                        <View key={offer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
                            <View className="p-4 border-b border-gray-50">
                                <View className="flex-row justify-between items-start mb-2">
                                    <View className="flex-1 mr-2">
                                        <ThemedText className="font-bold text-lg text-gray-900 mb-1">{offer.title}</ThemedText>
                                        <View className="flex-row items-center gap-1">
                                            <MapPin size={14} color="#6B7280" />
                                            <ThemedText className="text-xs text-gray-500">{offer.destination}</ThemedText>
                                        </View>
                                    </View>
                                    <View className={`px-2 py-1 rounded-full ${getStatusColor(offer.status)}`}>
                                        <ThemedText className="text-xs font-bold uppercase">{offer.status === 'Active' ? 'Active' : offer.status === 'Draft' ? 'Brouillon' : 'Arch'}</ThemedText>
                                    </View>
                                </View>

                                <View className="flex-row items-center justify-between mt-3">
                                    <View className="flex-row items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg">
                                        <Users size={14} color="#7E22CE" />
                                        <ThemedText className="text-xs font-bold text-purple-700">{offer.disponibilite} places</ThemedText>
                                    </View>
                                    <View>
                                        <ThemedText className="font-bold text-purple-600 text-lg">{offer.price.toLocaleString()} DA</ThemedText>
                                    </View>
                                </View>
                            </View>

                            <View className="px-4 py-3 bg-gray-50 flex-row justify-between items-center">
                                <View className="flex-row items-center gap-2">
                                    <Calendar size={14} color="#6B7280" />
                                    <ThemedText className="text-xs text-gray-500">
                                        {new Date(offer.startDate).toLocaleDateString()} - {new Date(offer.endDate).toLocaleDateString()}
                                    </ThemedText>
                                </View>
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        onPress={() => router.push({ pathname: '/(tabs)/offers/form', params: { id: offer.id } })}
                                        className="bg-white border border-gray-200 p-2 rounded-lg"
                                    >
                                        <Pencil size={16} color="#4B5563" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDelete(offer.id)}
                                        className="bg-red-50 border border-red-100 p-2 rounded-lg"
                                    >
                                        <Trash2 size={16} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
