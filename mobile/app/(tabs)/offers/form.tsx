import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useData } from '../../../context/DataContext';
import { useLanguage } from '../../../context/LanguageContext';
import { ThemedText } from '../../../components/ui/ThemedText';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft, Check, Calendar as CalendarIcon, MapPin } from 'lucide-react-native';
import { Offer } from '../../../types';

export default function OfferFormScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { offers, addOffer, updateOffer } = useData();
    const { t } = useLanguage();
    const isEditMode = !!id;

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<Partial<Offer>>({
        title: '',
        type: 'Omra',
        destination: '',
        price: 0,
        disponibilite: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        hotel: '',
        transport: 'Avion',
        description: '',
        status: 'Active',
        inclusions: {
            visa: false,
            transfer: false,
            assurance: false,
            guide: false,
            photos: false,
            excursions: false,
            petitDejeuner: false,
            dejeuner: false,
            diner: false,
            bagages: false,
        },
    });

    useEffect(() => {
        if (isEditMode && id) {
            const offer = offers.find(o => o.id === id);
            if (offer) {
                setFormData({
                    ...offer,
                    inclusions: offer.inclusions || {
                        visa: false,
                        transfer: false,
                        assurance: false,
                        guide: false,
                        photos: false,
                        excursions: false,
                        petitDejeuner: false,
                        dejeuner: false,
                        diner: false,
                        bagages: false,
                    }
                });
            }
        }
    }, [id, isEditMode, offers]);

    const updateField = (key: keyof Offer, value: any) => {
        setFormData(prev => ({
            ...prev,
            [key]: (key === 'price' || key === 'disponibilite') ? Number(value) : value
        }));
    };

    const updateInclusion = (key: keyof NonNullable<Offer['inclusions']>) => {
        setFormData(prev => ({
            ...prev,
            inclusions: {
                ...prev.inclusions!,
                [key]: !prev.inclusions![key]
            }
        }));
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.destination) {
            Alert.alert(t('common.error'), t('common.required_fields'));
            return;
        }

        setLoading(true);
        try {
            if (isEditMode && id) {
                await updateOffer({ id, ...formData } as Offer);
                Alert.alert(t('common.success'), t('offers.saved'));
            } else {
                const newOffer: Offer = {
                    id: Math.random().toString(36).substr(2, 9),
                    ...formData as Omit<Offer, 'id'>
                };
                await addOffer(newOffer);
                Alert.alert(t('common.success'), t('offers.saved'));
            }
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert(t('common.error'), t('common.save_error'));
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <View className="space-y-4">
            <Input label={t('offers.title')} value={formData.title} onChangeText={v => updateField('title', v)} placeholder="Ex: Omra Ramadan" />

            <View className="flex-row gap-4">
                <View className="flex-1">
                    <ThemedText className="text-sm font-medium text-gray-700 mb-1">{t('offers.type')}</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row pb-2">
                        {['Omra', 'Haj', 'Voyage Organisé', 'Visa'].map(type => (
                            <TouchableOpacity
                                key={type}
                                onPress={() => updateField('type', type)}
                                className={`mr-2 px-3 py-2 rounded-lg border ${formData.type === type ? 'bg-purple-100 border-purple-300' : 'bg-white border-gray-200'}`}
                            >
                                <ThemedText className={`text-xs ${formData.type === type ? 'text-purple-800 font-bold' : 'text-gray-600'}`}>{type}</ThemedText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            <Input label={t('offers.destination')} value={formData.destination} onChangeText={v => updateField('destination', v)} startIcon={<MapPin size={18} color="#9CA3AF" />} />

            <View className="flex-row gap-4">
                <Input label={t('offers.start_date')} containerClassName="flex-1" value={formData.startDate} onChangeText={v => updateField('startDate', v)} placeholder="YYYY-MM-DD" />
                <Input label={t('offers.end_date')} containerClassName="flex-1" value={formData.endDate} onChangeText={v => updateField('endDate', v)} placeholder="YYYY-MM-DD" />
            </View>

            <View className="flex-row gap-4">
                <Input label={t('offers.price')} containerClassName="flex-1" keyboardType="numeric" value={formData.price?.toString()} onChangeText={v => updateField('price', v)} />
                <Input label={t('offers.availability')} containerClassName="flex-1" keyboardType="numeric" value={formData.disponibilite?.toString()} onChangeText={v => updateField('disponibilite', v)} />
            </View>

            <View>
                <ThemedText className="text-sm font-medium text-gray-700 mb-1">{t('offers.transport')}</ThemedText>
                <View className="flex-row gap-2">
                    {['Avion', 'Bus', 'Sans Transport'].map(tr => (
                        <TouchableOpacity
                            key={tr}
                            onPress={() => updateField('transport', tr)}
                            className={`flex-1 px-3 py-2 rounded-lg border items-center ${formData.transport === tr ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}`}
                        >
                            <ThemedText className={`text-xs ${formData.transport === tr ? 'text-blue-800 font-bold' : 'text-gray-600'}`}>{tr}</ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <Input label={t('common.description')} value={formData.description} onChangeText={v => updateField('description', v)} multiline numberOfLines={3} containerClassName="h-24" />
        </View>
    );

    const renderStep2 = () => (
        <View className="space-y-6">
            <View>
                <ThemedText variant="h3" className="mb-4">{t('offers.inclusions')}</ThemedText>
                <View className="flex-row flex-wrap gap-3">
                    {Object.keys(formData.inclusions || {}).map((key) => {
                        const isIncluded = formData.inclusions?.[key as keyof NonNullable<Offer['inclusions']>];
                        return (
                            <TouchableOpacity
                                key={key}
                                onPress={() => updateInclusion(key as keyof NonNullable<Offer['inclusions']>)}
                                className={`px-4 py-2 rounded-full border flex-row items-center gap-2 ${isIncluded ? 'bg-green-100 border-green-300' : 'bg-white border-gray-200'
                                    }`}
                            >
                                {isIncluded && <Check size={14} color="#15803d" />}
                                <ThemedText className={`capitalize ${isIncluded ? 'text-green-800 font-medium' : 'text-gray-600'}`}>
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View>
                <ThemedText variant="h3" className="mb-4">{t('offers.status')}</ThemedText>
                <View className="flex-row gap-3">
                    {['Active', 'Draft', 'Archived'].map(s => (
                        <TouchableOpacity
                            key={s}
                            onPress={() => updateField('status', s)}
                            className={`flex-1 px-3 py-3 rounded-xl border items-center ${formData.status === s
                                ? s === 'Active' ? 'bg-green-50 border-green-300' : s === 'Draft' ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-100 border-gray-300'
                                : 'bg-white border-gray-200'
                                }`}
                        >
                            <ThemedText className={`font-bold ${formData.status === s
                                ? s === 'Active' ? 'text-green-800' : s === 'Draft' ? 'text-yellow-800' : 'text-gray-800'
                                : 'text-gray-500'
                                }`}>
                                {s === 'Active' ? t('common.active') : s === 'Draft' ? t('common.draft') : t('common.archived')}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="px-4 pt-4 pb-4 border-b border-gray-100 flex-row justify-between items-center bg-white shadow-sm z-10">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#374151" />
                    </TouchableOpacity>
                    <ThemedText variant="h3">{isEditMode ? t('offers.edit_offer') : t('offers.new_offer')}</ThemedText>
                </View>
            </View>

            {/* Step Indicator */}
            <View className="flex-row justify-center py-4 bg-gray-50 border-b border-gray-100">
                <View className="flex-row items-center gap-2">
                    <View className={`w-8 h-8 rounded-full items-center justify-center ${currentStep >= 1 ? 'bg-purple-600' : 'bg-gray-300'}`}>
                        <ThemedText className="text-white font-bold">1</ThemedText>
                    </View>
                    <View className={`w-12 h-1 ${currentStep >= 2 ? 'bg-purple-600' : 'bg-gray-300'}`} />
                    <View className={`w-8 h-8 rounded-full items-center justify-center ${currentStep >= 2 ? 'bg-purple-600' : 'bg-gray-300'}`}>
                        <ThemedText className="text-white font-bold">2</ThemedText>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 p-4">
                {currentStep === 1 ? renderStep1() : renderStep2()}
            </ScrollView>

            <View className="p-4 border-t border-gray-100 bg-white flex-row gap-4">
                {currentStep === 2 && (
                    <Button
                        title={t('common.previous')}
                        variant="outline"
                        className="flex-1"
                        onPress={() => setCurrentStep(1)}
                    />
                )}
                <Button
                    title={currentStep === 1 ? t('common.next') : (isEditMode ? t('common.save') : t('common.create'))}
                    className="flex-1"
                    onPress={() => currentStep === 1 ? setCurrentStep(2) : handleSubmit()}
                    loading={loading}
                />
            </View>
        </View>
    );
}
