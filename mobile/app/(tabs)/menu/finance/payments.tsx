import { View, ScrollView } from 'react-native';
import { useLanguage } from '../../../../context/LanguageContext';
import { ThemedText } from '../../../../components/ui/ThemedText';
import { Button } from '../../../../components/ui/Button';

export default function PaymentsScreen() {
    const { t } = useLanguage();

    const payments = [
        { id: 1, client: 'Mohamed Ali', order: 'CMD-203', amount: '150,000 DA', status: 'Pending', dueDate: '2025-12-20' },
        { id: 2, client: 'Sarah Ben', order: 'CMD-199', amount: '80,000 DA', status: 'Overdue', dueDate: '2025-12-10' },
    ];

    return (
        <ScrollView className="flex-1 bg-gray-50 p-4">
            <ThemedText className="text-sm font-[Outfit_600SemiBold] text-gray-500 uppercase tracking-wider mb-4">
                {t('menu.pending_payments')}
            </ThemedText>

            {payments.map(p => (
                <View key={p.id} className="bg-white p-4 rounded-xl border border-gray-100 mb-3">
                    <View className="flex-row justify-between items-start mb-2">
                        <View>
                            <ThemedText className="font-[Inter_600SemiBold] text-gray-900 text-lg">{p.client}</ThemedText>
                            <ThemedText className="text-xs text-blue-600 font-medium">{p.order}</ThemedText>
                        </View>
                        <View className={`px-2 py-1 rounded-md ${p.status === 'Overdue' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                            <ThemedText className={`text-xs font-bold ${p.status === 'Overdue' ? 'text-red-700' : 'text-yellow-700'}`}>
                                {p.status}
                            </ThemedText>
                        </View>
                    </View>

                    <View className="flex-row justify-between items-end mt-2">
                        <View>
                            <ThemedText className="text-xs text-gray-400">Montant dû</ThemedText>
                            <ThemedText className="text-xl font-[Outfit_700Bold] text-gray-900">{p.amount}</ThemedText>
                        </View>
                        <Button title={t('common.pay')} size="sm" className="px-6" onPress={() => { }} />
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}
