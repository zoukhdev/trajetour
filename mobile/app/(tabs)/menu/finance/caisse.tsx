import { View, ScrollView } from 'react-native';
import { useLanguage } from '../../../../context/LanguageContext';
import { ThemedText } from '../../../../components/ui/ThemedText';
import { Button } from '../../../../components/ui/Button';
import { Plus, Minus } from 'lucide-react-native';

export default function CaisseScreen() {
    const { t } = useLanguage();

    const transactions = [
        { id: 1, desc: 'Paiement Client #123', amount: '+ 50,000 DA', type: 'in', date: '2025-12-16' },
        { id: 2, desc: 'Achat Fournitures', amount: '- 5,000 DA', type: 'out', date: '2025-12-15' },
        { id: 3, desc: 'Paiement Guide', amount: '- 15,000 DA', type: 'out', date: '2025-12-14' },
    ];

    return (
        <View className="flex-1 bg-gray-50">
            <View className="bg-white p-6 border-b border-gray-100">
                <ThemedText className="text-gray-500 font-[Inter_500Medium] text-center mb-2">{t('menu.current_balance')}</ThemedText>
                <ThemedText className="text-gray-900 font-[Outfit_700Bold] text-4xl text-center">2,300,000 <ThemedText className="text-xl text-gray-400">DA</ThemedText></ThemedText>

                <View className="flex-row gap-4 mt-6">
                    <Button
                        title={t('menu.add_fund')}
                        icon={<Plus size={18} color="white" />}
                        className="flex-1 bg-green-600"
                        onPress={() => { }}
                    />
                    <Button
                        title={t('menu.withdraw')}
                        icon={<Minus size={18} color="white" />}
                        className="flex-1 bg-red-600"
                        onPress={() => { }}
                    />
                </View>
            </View>

            <ScrollView className="flex-1 p-4">
                <ThemedText className="text-sm font-[Outfit_600SemiBold] text-gray-500 uppercase tracking-wider mb-4">
                    {t('menu.recent_transactions')}
                </ThemedText>

                {transactions.map(tx => (
                    <View key={tx.id} className="bg-white p-4 rounded-xl border border-gray-100 mb-3 flex-row items-center justify-between">
                        <View>
                            <ThemedText className="font-[Inter_600SemiBold] text-gray-900">{tx.desc}</ThemedText>
                            <ThemedText className="text-xs text-gray-500 mt-1">{tx.date}</ThemedText>
                        </View>
                        <ThemedText className={`font-[Outfit_700Bold] ${tx.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.amount}
                        </ThemedText>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}
