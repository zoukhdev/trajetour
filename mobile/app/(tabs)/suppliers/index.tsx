import { useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '../../../context/DataContext';
import { useLanguage } from '../../../context/LanguageContext';
import { ThemedText } from '../../../components/ui/ThemedText';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Search, Plus, Building2, Phone, Mail, MapPin, Package } from 'lucide-react-native';

export default function SupplierList() {
    const router = useRouter();
    const { suppliers, refreshData, deleteSupplier } = useData();
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

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            t('common.delete'),
            `${t('common.confirm_delete')} ${name} ?`,
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('common.delete'),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteSupplier(id);
                        } catch (error) {
                            Alert.alert(t('common.error'), t('common.error_occurred'));
                        }
                    }
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-gray-50">
            <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 shadow-sm z-10">
                <View className="flex-row justify-between items-center mb-4">
                    <ThemedText variant="h2" className="text-gray-900">{t('suppliers.title')}</ThemedText>
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/suppliers/form')}
                        className="bg-purple-600 w-10 h-10 rounded-full items-center justify-center shadow-md active:bg-purple-700"
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
                {filteredSuppliers.length === 0 ? (
                    <View className="flex-1 items-center justify-center py-20 opacity-50">
                        <View className="bg-gray-100 p-6 rounded-full mb-4">
                            <Building2 size={48} color="#9CA3AF" />
                        </View>
                        <ThemedText className="text-gray-500 font-medium">{t('suppliers.no_suppliers')}</ThemedText>
                        <ThemedText className="text-gray-400 text-sm mt-1">{t('suppliers.new_supplier')}</ThemedText>
                    </View>
                ) : (
                    filteredSuppliers.map((supplier) => (
                        <TouchableOpacity
                            key={supplier.id}
                            onPress={() => router.push({ pathname: '/(tabs)/suppliers/form', params: { id: supplier.id } })}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3"
                        >
                            <View className="flex-row items-start justify-between mb-3">
                                <View className="flex-row items-center gap-3">
                                    <View className="w-10 h-10 rounded-lg bg-blue-50 items-center justify-center">
                                        <Building2 size={20} color="#2563EB" />
                                    </View>
                                    <View>
                                        <ThemedText className="font-bold text-gray-900 text-base">{supplier.name}</ThemedText>
                                        <View className="bg-gray-100 self-start px-2 py-0.5 rounded-full mt-1">
                                            <ThemedText className="text-xs text-gray-600 font-medium">
                                                {supplier.serviceType}
                                            </ThemedText>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View className="space-y-2 mb-4 pl-1">
                                <View className="flex-row items-center gap-2">
                                    <View className="w-6 h-6 rounded-full bg-gray-50 items-center justify-center">
                                        <ThemedText className="text-[10px] font-bold text-gray-500">CP</ThemedText>
                                    </View>
                                    <ThemedText className="text-sm text-gray-600 flex-1">{supplier.contactPerson}</ThemedText>
                                </View>
                                {supplier.phone && (
                                    <View className="flex-row items-center gap-2">
                                        <View className="w-6 h-6 rounded-full bg-gray-50 items-center justify-center">
                                            <Phone size={12} color="#6B7280" />
                                        </View>
                                        <ThemedText className="text-sm text-gray-600">{supplier.phone}</ThemedText>
                                    </View>
                                )}
                                {supplier.email && (
                                    <View className="flex-row items-center gap-2">
                                        <View className="w-6 h-6 rounded-full bg-gray-50 items-center justify-center">
                                            <Mail size={12} color="#6B7280" />
                                        </View>
                                        <ThemedText className="text-sm text-gray-600" numberOfLines={1}>{supplier.email}</ThemedText>
                                    </View>
                                )}
                                {supplier.address && (
                                    <View className="flex-row items-center gap-2">
                                        <View className="w-6 h-6 rounded-full bg-gray-50 items-center justify-center">
                                            <MapPin size={12} color="#6B7280" />
                                        </View>
                                        <ThemedText className="text-sm text-gray-600" numberOfLines={1}>{supplier.address}</ThemedText>
                                    </View>
                                )}
                            </View>

                            <View className="flex-row gap-2">
                                <Button
                                    title={t('suppliers.contracts')}
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1"
                                    icon={<Package size={16} color="#4B5563" />}
                                    onPress={() => router.push(`/(tabs)/suppliers/${supplier.id}/contracts`)}
                                />
                                <Button
                                    title={t('common.delete')}
                                    variant="outline"
                                    size="sm"
                                    className="border-red-200 text-red-600 bg-red-50"
                                    onPress={() => handleDelete(supplier.id, supplier.name)}
                                />
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
