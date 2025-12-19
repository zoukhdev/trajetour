import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useData } from '../../../context/DataContext';
import { useLanguage } from '../../../context/LanguageContext';
import { ThemedText } from '../../../components/ui/ThemedText';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft, Camera, Briefcase, User } from 'lucide-react-native';
import { Agency } from '../../../types';

export default function AgencyFormScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { agencies, addAgency, updateAgency } = useData();
    const { t } = useLanguage();

    const isEditMode = !!id;
    const existingAgency = isEditMode ? agencies.find(a => a.id === id) : undefined;

    const [formData, setFormData] = useState<Partial<Agency>>({
        type: 'Agence',
        name: '',
        email: '',
        phone: '',
        address: '',
        invoicePrefix: '',
        invoiceFooter: '',
        logo: undefined
    });

    useEffect(() => {
        if (existingAgency) {
            setFormData(existingAgency);
        }
    }, [existingAgency]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            if (asset.base64) {
                const prefix = asset.mimeType || 'image/jpeg';
                const base64Image = `data:${prefix};base64,${asset.base64}`;
                setFormData(prev => ({ ...prev, logo: base64Image }));
            }
        }
    };

    const handleSubmit = async () => {
        if (!formData.name?.trim()) {
            Alert.alert(t('common.error'), t('common.required_fields'));
            return;
        }

        try {
            if (isEditMode && existingAgency) {
                await updateAgency({
                    ...existingAgency,
                    ...formData as Agency
                });
                Alert.alert(t('common.success'), t('agencies.saved'));
            } else {
                const newAgency: Agency = {
                    id: Math.random().toString(36).substring(2, 9),
                    name: formData.name!,
                    type: formData.type as 'Agence' | 'Rabbateur',
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    logo: formData.logo,
                    invoicePrefix: formData.invoicePrefix,
                    invoiceFooter: formData.invoiceFooter,
                    subscription: 'Standard',
                    creditStart: 0,
                    currentCredit: 0
                };
                await addAgency(newAgency);
                Alert.alert(t('common.success'), t('agencies.saved'));
            }
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert(t('common.error'), t('common.save_error'));
        }
    };

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="px-4 pt-4 pb-4 border-b border-gray-100 flex-row justify-between items-center bg-white shadow-sm z-10">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#374151" />
                    </TouchableOpacity>
                    <ThemedText variant="h3">{isEditMode ? t('agencies.edit_agency') : t('agencies.new_agency')}</ThemedText>
                </View>
                <TouchableOpacity onPress={handleSubmit}>
                    <ThemedText className="text-blue-600 font-semibold text-lg">
                        {isEditMode ? t('common.save') : t('common.new')}
                    </ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
                {/* Type Selection */}
                <View className="mb-6 bg-gray-50 p-1 rounded-xl flex-row">
                    <TouchableOpacity
                        onPress={() => setFormData({ ...formData, type: 'Agence' })}
                        className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-lg ${formData.type === 'Agence' ? 'bg-white shadow-sm' : ''
                            }`}
                    >
                        <Briefcase size={18} color={formData.type === 'Agence' ? '#4F46E5' : '#6B7280'} />
                        <ThemedText className={`font-medium ${formData.type === 'Agence' ? 'text-indigo-600' : 'text-gray-500'}`}>
                            {t('agencies.agency')}
                        </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setFormData({ ...formData, type: 'Rabbateur' })}
                        className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-lg ${formData.type === 'Rabbateur' ? 'bg-white shadow-sm' : ''
                            }`}
                    >
                        <User size={18} color={formData.type === 'Rabbateur' ? '#EA580C' : '#6B7280'} />
                        <ThemedText className={`font-medium ${formData.type === 'Rabbateur' ? 'text-orange-600' : 'text-gray-500'}`}>
                            {t('agencies.rabbateur')}
                        </ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Logo Upload */}
                <View className="items-center mb-6">
                    <TouchableOpacity onPress={pickImage} className="relative">
                        <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center overflow-hidden border border-gray-200">
                            {formData.logo ? (
                                <Image source={{ uri: formData.logo }} className="w-full h-full" resizeMode="cover" />
                            ) : (
                                <Camera size={32} color="#9CA3AF" />
                            )}
                        </View>
                        <View className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-2 border-white">
                            <Camera size={12} color="white" />
                        </View>
                    </TouchableOpacity>
                    <ThemedText className="text-xs text-gray-500 mt-2">{t('agency.logo')}</ThemedText>
                </View>

                {/* Main Fields */}
                <View className="space-y-4 mb-8">
                    <View>
                        <ThemedText className="text-sm font-medium text-gray-700 mb-1">{t('agency.name')} *</ThemedText>
                        <Input
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            placeholder={t('agency.name')}
                        />
                    </View>

                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <ThemedText className="text-sm font-medium text-gray-700 mb-1">{t('agency.phone')}</ThemedText>
                            <Input
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                placeholder="0000 00 00 00"
                                keyboardType="phone-pad"
                            />
                        </View>
                        <View className="flex-1">
                            <ThemedText className="text-sm font-medium text-gray-700 mb-1">{t('agency.email')}</ThemedText>
                            <Input
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                                placeholder="agence@mail.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View>
                        <ThemedText className="text-sm font-medium text-gray-700 mb-1">{t('agency.address')}</ThemedText>
                        <Input
                            value={formData.address}
                            onChangeText={(text) => setFormData({ ...formData, address: text })}
                            placeholder={t('agency.address')}
                        />
                    </View>
                </View>

                {/* Invoice Settings */}
                <View className="mb-20">
                    <ThemedText className="text-lg font-semibold text-gray-900 mb-4 pt-4 border-t border-gray-100">{t('agency.invoice_settings')}</ThemedText>

                    <View className="mb-4">
                        <ThemedText className="text-sm font-medium text-gray-700 mb-1">{t('agency.prefix')}</ThemedText>
                        <Input
                            value={formData.invoicePrefix}
                            onChangeText={(text) => setFormData({ ...formData, invoicePrefix: text })}
                            placeholder="Ex: INV-2024-"
                        />
                    </View>

                    <View>
                        <ThemedText className="text-sm font-medium text-gray-700 mb-1">{t('agency.footer')}</ThemedText>
                        <Input
                            value={formData.invoiceFooter}
                            onChangeText={(text) => setFormData({ ...formData, invoiceFooter: text })}
                            placeholder="Texte légal, RC, NIF..."
                            multiline
                            numberOfLines={3}
                            containerClassName="h-24"
                        />
                    </View>
                </View>

                <Button title={isEditMode ? t('common.save') : t('common.new')} onPress={handleSubmit} size="lg" className="mb-8" />
            </ScrollView>
        </View>
    );
}
