import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../../context/LanguageContext';
import { ThemedText } from '../../../components/ui/ThemedText';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft, Building2, Phone, Mail, MapPin, Globe, Check } from 'lucide-react-native';
import { clientStorage } from '../../../services/storage';

interface AgencyDetails {
    name: string;
    email: string;
    phone: string;
    address: string;
    logo: string;
    invoicePrefix: string;
    invoiceFooter: string;
}

export default function AgencySettingsScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<AgencyDetails>({
        name: 'Trajetour',
        email: 'contact@trajetour.com',
        phone: '0550 00 00 00',
        address: 'Alger, Algérie',
        logo: '',
        invoicePrefix: 'INV-',
        invoiceFooter: 'Merci de votre confiance.'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const saved = await clientStorage.getItem('my_agency_details');
            if (saved) {
                setFormData(JSON.parse(saved));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const updateField = (key: keyof AgencyDetails, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            Alert.alert(t('common.error'), t('agency.name_required'));
            return;
        }

        setLoading(true);
        try {
            await clientStorage.setItem('my_agency_details', JSON.stringify(formData));
            Alert.alert(t('agency.success'), t('agency.saved'));
            router.back();
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de sauvegarder');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            {/* Header */}
            <View className="px-4 pb-4 border-b border-gray-100 flex-row justify-between items-center bg-white shadow-sm pt-2">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#374151" />
                    </TouchableOpacity>
                    <ThemedText variant="h3">{t('agency.title')}</ThemedText>
                </View>
                <TouchableOpacity onPress={handleSubmit} disabled={loading}>
                    <ThemedText className={`font-semibold text-lg ${loading ? 'text-gray-400' : 'text-blue-600'}`}>
                        {loading ? '...' : t('common.save')}
                    </ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4" contentContainerClassName="pb-24">
                <View className="space-y-4 mb-6">
                    <View className="items-center mb-4">
                        <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center border-2 border-dashed border-gray-300">
                            <Building2 size={32} color="#9CA3AF" />
                        </View>
                        <ThemedText className="text-xs text-blue-600 mt-2 font-medium">Changer le logo</ThemedText>
                    </View>

                    <Input
                        label={t('agency.name')}
                        value={formData.name}
                        onChangeText={v => updateField('name', v)}
                        startIcon={<Building2 size={18} color="#9CA3AF" />}
                    />
                    <Input
                        label={t('agency.email')}
                        value={formData.email}
                        onChangeText={v => updateField('email', v)}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        startIcon={<Mail size={18} color="#9CA3AF" />}
                    />
                    <Input
                        label={t('agency.phone')}
                        value={formData.phone}
                        onChangeText={v => updateField('phone', v)}
                        keyboardType="phone-pad"
                        startIcon={<Phone size={18} color="#9CA3AF" />}
                    />
                    <Input
                        label={t('agency.address')}
                        value={formData.address}
                        onChangeText={v => updateField('address', v)}
                        startIcon={<MapPin size={18} color="#9CA3AF" />}
                    />
                    <Input
                        label={t('agency.logo')}
                        value={formData.logo}
                        onChangeText={v => updateField('logo', v)}
                        placeholder="https://..."
                        startIcon={<Globe size={18} color="#9CA3AF" />}
                    />
                </View>

                <View className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                    <ThemedText className="font-bold text-gray-900 mb-4">{t('agency.invoice_settings')}</ThemedText>
                    <Input
                        label={t('agency.prefix')}
                        value={formData.invoicePrefix}
                        onChangeText={v => updateField('invoicePrefix', v)}
                        placeholder="INV-"
                        containerClassName="bg-white"
                    />
                    <Input
                        label={t('agency.footer')}
                        value={formData.invoiceFooter}
                        onChangeText={v => updateField('invoiceFooter', v)}
                        multiline numberOfLines={2}
                        containerClassName="bg-white h-20"
                    />
                </View>

                <Button title={t('common.save')} onPress={handleSubmit} size="lg" loading={loading} />
            </ScrollView>
        </SafeAreaView>
    );
}
