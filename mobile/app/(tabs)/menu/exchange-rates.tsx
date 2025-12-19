import { View, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useExchangeRates } from '../../../context/ExchangeRateContext';
import { ThemedText } from '../../../components/ui/ThemedText';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { TrendingUp, DollarSign, Euro, Banknote } from 'lucide-react-native';

export default function ExchangeRatesScreen() {
    const { t } = useLanguage();
    const { currentRates, saveExchangeRate } = useExchangeRates();

    const [sarRate, setSarRate] = useState(currentRates?.SAR.toString() || '36.5');
    const [eurRate, setEurRate] = useState(currentRates?.EUR.toString() || '245');
    const [usdRate, setUsdRate] = useState(currentRates?.USD.toString() || '220');

    const handleSaveRates = () => {
        const sar = parseFloat(sarRate);
        const eur = parseFloat(eurRate);
        const usd = parseFloat(usdRate);

        if (isNaN(sar) || isNaN(eur) || isNaN(usd) || sar <= 0 || eur <= 0 || usd <= 0) {
            Alert.alert(t('common.error'), t('menu.invalid_rate'));
            return;
        }

        saveExchangeRate(sar, eur, usd);
        Alert.alert(t('common.success'), t('menu.rate_updated'));
    };

    const currentRatesDisplay = [
        { label: t('menu.sar_to_dzd'), value: currentRates?.SAR.toFixed(2) || '36.50', icon: Banknote, color: '#10b981' },
        { label: t('menu.eur_to_dzd'), value: currentRates?.EUR.toFixed(2) || '245.00', icon: Euro, color: '#3b82f6' },
        { label: t('menu.usd_to_dzd'), value: currentRates?.USD.toFixed(2) || '220.00', icon: DollarSign, color: '#f59e0b' },
    ];

    return (
        <ScrollView className="flex-1 bg-gray-50 p-4">
            {/* Current Rates Display */}
            <View className="mb-6">
                <ThemedText className="text-sm font-[Outfit_600SemiBold] text-gray-500 uppercase tracking-wider mb-3 ml-1">
                    {t('menu.current_rates')}
                </ThemedText>
                <View className="flex-row flex-wrap gap-4">
                    {currentRatesDisplay.map((rate, index) => (
                        <View key={index} className="w-[47%] bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <View className="flex-row items-center gap-2 mb-2">
                                <rate.icon size={18} color={rate.color} />
                                <ThemedText className="text-gray-600 text-xs font-[Inter_500Medium] uppercase">
                                    {rate.label}
                                </ThemedText>
                            </View>
                            <ThemedText className="text-gray-900 text-2xl font-[Outfit_700Bold]">
                                {rate.value}
                            </ThemedText>
                        </View>
                    ))}
                </View>
            </View>

            {/* Update Rates Form */}
            <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <View className="flex-row items-center gap-2 mb-6">
                    <TrendingUp size={20} color="#6366f1" />
                    <ThemedText className="text-base font-[Outfit_600SemiBold] text-gray-900">
                        {t('menu.update_rates')}
                    </ThemedText>
                </View>

                <View className="gap-4">
                    <View>
                        <ThemedText className="text-sm font-[Inter_500Medium] text-gray-700 mb-2">
                            {t('menu.sar_to_dzd')}
                        </ThemedText>
                        <Input
                            placeholder="36.50"
                            value={sarRate}
                            onChangeText={setSarRate}
                            keyboardType="decimal-pad"
                            startIcon={<Banknote size={18} color="#9CA3AF" />}
                        />
                    </View>

                    <View>
                        <ThemedText className="text-sm font-[Inter_500Medium] text-gray-700 mb-2">
                            {t('menu.eur_to_dzd')}
                        </ThemedText>
                        <Input
                            placeholder="245.00"
                            value={eurRate}
                            onChangeText={setEurRate}
                            keyboardType="decimal-pad"
                            startIcon={<Euro size={18} color="#9CA3AF" />}
                        />
                    </View>

                    <View>
                        <ThemedText className="text-sm font-[Inter_500Medium] text-gray-700 mb-2">
                            {t('menu.usd_to_dzd')}
                        </ThemedText>
                        <Input
                            placeholder="220.00"
                            value={usdRate}
                            onChangeText={setUsdRate}
                            keyboardType="decimal-pad"
                            startIcon={<DollarSign size={18} color="#9CA3AF" />}
                        />
                    </View>
                </View>

                <Button
                    title={t('common.save')}
                    onPress={handleSaveRates}
                    className="mt-6"
                />
            </View>
        </ScrollView>
    );
}
