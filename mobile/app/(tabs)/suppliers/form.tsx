import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useData } from '../../../context/DataContext';
import { useLanguage } from '../../../context/LanguageContext';
import { ThemedText } from '../../../components/ui/ThemedText';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft, Building2, User, Phone, Mail, MapPin } from 'lucide-react-native';
import { Supplier } from '../../../types';

export default function SupplierFormScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { suppliers, addSupplier, updateSupplier } = useData();
    const { t } = useLanguage();

    const isEditMode = !!id;
    const existingSupplier = isEditMode ? suppliers.find(s => s.id === id) : undefined;

    const [formData, setFormData] = useState<Partial<Supplier>>({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        serviceType: 'Hotel'
    });

    useEffect(() => {
        if (existingSupplier) {
            setFormData(existingSupplier);
        }
    }, [existingSupplier]);

    const handleSubmit = async () => {
        if (!formData.name?.trim()) {
            Alert.alert(t('common.error'), t('common.required_fields'));
            return;
        }

        try {
            if (isEditMode && existingSupplier) {
                await updateSupplier({
                    ...existingSupplier,
                    ...formData as Supplier
                });
                Alert.alert(t('common.success'), t('suppliers.saved'));
            } else {
                const newSupplier: Supplier = {
                    id: Math.random().toString(36).substring(2, 9),
                    name: formData.name!,
                    contactPerson: formData.contactPerson || '',
                    phone: formData.phone || '',
                    email: formData.email || '',
                    address: formData.address || '',
                    serviceType: formData.serviceType || 'Hotel'
                };
                await addSupplier(newSupplier);
                Alert.alert(t('common.success'), t('suppliers.saved'));
            }
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert(t('common.error'), t('common.save_error'));
        }
    };

    const serviceTypes = ['Hotel', 'Transport', 'Visa', 'Autre'];

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="px-4 pt-4 pb-4 border-b border-gray-100 flex-row justify-between items-center bg-white shadow-sm z-10">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#374151" />
                    </TouchableOpacity>
                    <ThemedText variant="h3">{isEditMode ? t('suppliers.edit_supplier') : t('suppliers.new_supplier')}</ThemedText>
                </View>
                <TouchableOpacity onPress={handleSubmit}>
                    <ThemedText className="text-purple-600 font-semibold text-lg">
                        {isEditMode ? t('common.save') : t('common.new')}
                    </ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
                <View className="mb-6">
                    <ThemedText className="text-sm font-medium text-gray-700 mb-2">{t('suppliers.service_type')}</ThemedText>
                    <View className="flex-row flex-wrap gap-2">
                        {serviceTypes.map((type) => (
                            <TouchableOpacity
                                key={type}
                                onPress={() => setFormData({ ...formData, serviceType: type })}
                                className={`px-4 py-2 rounded-full border ${formData.serviceType === type
                                    ? 'bg-purple-50 border-purple-200'
                                    : 'bg-white border-gray-200'
                                    }`}
                            >
                                <ThemedText className={`text-sm font-medium ${formData.serviceType === type ? 'text-purple-700' : 'text-gray-600'
                                    }`}>
                                    {type}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View className="space-y-4 mb-8">
                    <View>
                        <ThemedText className="text-sm font-medium text-gray-700 mb-1">{t('suppliers.name')} *</ThemedText>
                        <Input
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            placeholder="Ex: Hilton Makkah"
                            startIcon={<Building2 size={18} color="#9CA3AF" />}
                        />
                    </View>

                    <View>
                        <ThemedText className="text-sm font-medium text-gray-700 mb-1">{t('suppliers.contact_person')}</ThemedText>
                        <Input
                            value={formData.contactPerson}
                            onChangeText={(text) => setFormData({ ...formData, contactPerson: text })}
                            placeholder={t('suppliers.contact_placeholder')}
                            startIcon={<User size={18} color="#9CA3AF" />}
                        />
                    </View>

                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <ThemedText className="text-sm font-medium text-gray-700 mb-1">{t('suppliers.phone')}</ThemedText>
                            <Input
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                placeholder="0000 00 00 00"
                                keyboardType="phone-pad"
                                startIcon={<Phone size={18} color="#9CA3AF" />}
                            />
                        </View>
                        <View className="flex-1">
                            <ThemedText className="text-sm font-medium text-gray-700 mb-1">{t('suppliers.email')}</ThemedText>
                            <Input
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                                placeholder="contact@supplier.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                startIcon={<Mail size={18} color="#9CA3AF" />}
                            />
                        </View>
                    </View>

                    <View>
                        <ThemedText className="text-sm font-medium text-gray-700 mb-1">{t('suppliers.address')}</ThemedText>
                        <Input
                            value={formData.address}
                            onChangeText={(text) => setFormData({ ...formData, address: text })}
                            placeholder={t('suppliers.address')}
                            multiline
                            numberOfLines={2}
                            containerClassName="h-20"
                            startIcon={<MapPin size={18} color="#9CA3AF" />}
                        />
                    </View>
                </View>

                <Button title={isEditMode ? t('common.save') : t('common.new')} onPress={handleSubmit} size="lg" className="mb-8" />
            </ScrollView>
        </View>
    );
}
