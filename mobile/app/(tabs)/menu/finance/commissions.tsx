import { View, ScrollView } from 'react-native';
import { useLanguage } from '../../../../context/LanguageContext';
import { ThemedText } from '../../../../components/ui/ThemedText';

export default function CommissionsScreen() {
    const { t } = useLanguage();

    const commissions = [
        { id: 1, entity: 'Agence B', type: 'Partner', amount: '45,000 DA', sales: 12 },
        { id: 2, entity: 'Guide Ahmed', type: 'Guide', amount: '12,000 DA', sales: 1 },
    ];

    return (
        <ScrollView className="flex-1 bg-gray-50 p-4">
            <View className="flex-row justify-between items-center mb-6">
                <ThemedText className="text-sm font-[Outfit_600SemiBold] text-gray-500 uppercase tracking-wider">
                    {t('menu.commissions_overview')}
                </ThemedText>
                <ThemedText className="text-purple-600 font-bold">Total: 57,000 DA</ThemedText>
            </View>

            {commissions.map(c => (
                <View key={c.id} className="bg-white p-4 rounded-xl border border-gray-100 mb-3 flex-row justify-between items-center">
                    <View>
                        <ThemedText className="font-[Inter_600SemiBold] text-gray-900">{c.entity}</ThemedText>
                        <ThemedText className="text-xs text-gray-500">{c.type} • {c.sales} ventes</ThemedText>
                    </View>
                    <ThemedText className="font-[Outfit_700Bold] text-purple-600 text-lg">
                        {c.amount}
                    </ThemedText>
                </View>
            ))}
        </ScrollView>
    );
}
