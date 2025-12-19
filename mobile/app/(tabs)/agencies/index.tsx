import { useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '../../../context/DataContext';
import { useLanguage } from '../../../context/LanguageContext';
import { ThemedText } from '../../../components/ui/ThemedText';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Search, Plus, Briefcase, User, MapPin, Phone } from 'lucide-react-native';

export default function AgenciesList() {
    const router = useRouter();
    const { agencies, refreshData } = useData();
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refreshData();
        } catch (error) {
            console.error('Failed to refresh data:', error);
        } finally {
            setRefreshing(false);
        }
    }, [refreshData]);

    const filteredAgencies = agencies.filter(agency =>
        agency.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <View className="flex-1 bg-gray-50">
            <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 shadow-sm z-10">
                <View className="flex-row justify-between items-center mb-4">
                    <ThemedText variant="h2" className="text-gray-900">{t('agencies.title')}</ThemedText>
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/agencies/form')}
                        className="bg-blue-600 w-10 h-10 rounded-full items-center justify-center shadow-md active:bg-blue-700"
                    >
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <View className="relative">
                    <View className="absolute left-3 top-3 z-10">
                        <Search size={20} color="#9CA3AF" />
                    </View>
                    <Input
                        placeholder={t('common.search')}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        containerClassName="mb-0"
                        className="pl-10 bg-gray-50 border-gray-100"
                    />
                </View>
            </View>

            <ScrollView
                className="flex-1 p-4"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {filteredAgencies.length === 0 ? (
                    <View className="flex-1 items-center justify-center py-20 opacity-50">
                        <View className="bg-gray-100 p-6 rounded-full mb-4">
                            <Briefcase size={48} color="#9CA3AF" />
                        </View>
                        <ThemedText className="text-gray-500 font-medium">{t('agencies.no_agencies')}</ThemedText>
                        <ThemedText className="text-gray-400 text-sm mt-1">{t('agencies.new_agency')}</ThemedText>
                    </View>
                ) : (
                    filteredAgencies.map((agency) => (
                        <TouchableOpacity
                            key={agency.id}
                            onPress={() => router.push({ pathname: '/(tabs)/agencies/form', params: { id: agency.id } })}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3"
                        >
                            <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-row items-center gap-3">
                                    <View className={`w-12 h-12 rounded-full items-center justify-center ${agency.type === 'Agence' ? 'bg-purple-50' : 'bg-orange-50'
                                        }`}>
                                        {agency.logo ? (
                                            <Image
                                                source={{ uri: agency.logo }}
                                                className="w-12 h-12 rounded-full"
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            agency.type === 'Agence'
                                                ? <Briefcase size={20} color="#7C3AED" />
                                                : <User size={20} color="#C2410C" />
                                        )}
                                    </View>
                                    <View>
                                        <ThemedText className="font-bold text-gray-900 text-lg">{agency.name}</ThemedText>
                                        <View className={`self-start px-2 py-0.5 rounded-full mt-1 ${agency.type === 'Agence'
                                            ? 'bg-purple-100'
                                            : 'bg-orange-100'
                                            }`}>
                                            <ThemedText className={`text-[10px] font-bold ${agency.type === 'Agence'
                                                ? 'text-purple-700'
                                                : 'text-orange-700'
                                                }`}>
                                                {/* Translate the type here */}
                                                {agency.type === 'Agence' ? t('agencies.agency') : t('agencies.rabbateur')}
                                            </ThemedText>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View className="flex-row gap-4 mb-3 pl-1">
                                {agency.phone && (
                                    <View className="flex-row items-center gap-1.5">
                                        <Phone size={14} color="#6B7280" />
                                        <ThemedText className="text-sm text-gray-500">{agency.phone}</ThemedText>
                                    </View>
                                )}
                                {agency.address && (
                                    <View className="flex-row items-center gap-1.5 flex-1">
                                        <MapPin size={14} color="#6B7280" />
                                        <ThemedText className="text-sm text-gray-500" numberOfLines={1}>{agency.address}</ThemedText>
                                    </View>
                                )}
                            </View>

                            <View className="border-t border-gray-50 pt-3 flex-row justify-between items-center">
                                <View>
                                    <ThemedText className="text-xs text-gray-400">{t('agencies.credit_current')}</ThemedText>
                                    <ThemedText className="font-bold text-gray-900">{(agency.currentCredit || 0).toLocaleString()} DZD</ThemedText>
                                </View>
                                <Button
                                    title={t('common.edit')}
                                    size="sm"
                                    variant="outline"
                                    onPress={() => router.push({ pathname: '/(tabs)/agencies/form', params: { id: agency.id } })}
                                />
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
