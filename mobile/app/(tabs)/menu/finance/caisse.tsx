import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLanguage } from '../../../../context/LanguageContext';
import { useData } from '../../../../context/DataContext';
import { ThemedText } from '../../../../components/ui/ThemedText';
import { Button } from '../../../../components/ui/Button';
import { Plus, Minus, Wallet, ArrowRight, ArrowLeft } from 'lucide-react-native';

export default function CaisseScreen() {
    const { t } = useLanguage();
    const { bankAccounts, transactions } = useData();

    // 1. Calculate Net Total in DZD
    const totalNetDZD = bankAccounts.reduce((sum, account) => {
        if (account.currency === 'DZD') return sum + account.balance;
        return sum + (account.balanceDZD || 0); // balanceDZD is pre-calculated in Context
    }, 0);

    // 2. Prepare Transactions
    const recentTransactions = transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20); // Show last 20

    // Helper for cards
    const getCurrencyColor = (curr: string) => {
        switch (curr) {
            case 'DZD': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100', icon: '#15803d' };
            case 'EUR': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: '#1d4ed8' };
            case 'SAR': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', icon: '#c2410c' };
            default: return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100', icon: '#4b5563' };
        }
    };

    return (
        <ScrollView className="flex-1 bg-gray-50">
            {/* NET TOTAL BANNER */}
            <View className="bg-blue-600 p-6 rounded-b-3xl shadow-lg pt-12">
                <ThemedText className="text-white/70 text-sm font-medium uppercase tracking-wider text-center mb-1">
                    Total Net (DZD)
                </ThemedText>
                <ThemedText className="text-white font-[Outfit_700Bold] text-4xl text-center mb-6">
                    {totalNetDZD.toLocaleString()} <ThemedText className="text-xl text-white/50">DA</ThemedText>
                </ThemedText>

                {/* Breakdown by Currency */}
                <View className="flex-row justify-center gap-4 flex-wrap">
                    {['DZD', 'EUR', 'SAR'].map(curr => {
                        const total = bankAccounts
                            .filter(a => a.currency === curr)
                            .reduce((sum, a) => sum + a.balance, 0);

                        // Don't show if 0
                        if (total === 0 && curr !== 'DZD') return null;

                        return (
                            <View key={curr} className="bg-white/20 px-3 py-2 rounded-lg backdrop-blur-sm items-center min-w-[30%] border border-white/10">
                                <ThemedText className="text-white/80 text-xs font-bold mb-0.5">{curr}</ThemedText>
                                <ThemedText className="text-white font-bold text-base">{total.toLocaleString()}</ThemedText>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* ACTION BUTTONS */}
            <View className="flex-row gap-4 px-4 -mt-6">
                <Button
                    title={t('menu.add_fund')}
                    icon={<Plus size={18} color="white" />}
                    className="flex-1 bg-green-600 shadow-md border-2 border-white"
                    onPress={() => Alert.alert("Coming Soon", "Use Transactions Screen to add funds")}
                />
                <Button
                    title={t('menu.withdraw')}
                    icon={<Minus size={18} color="white" />}
                    className="flex-1 bg-red-600 shadow-md border-2 border-white"
                    onPress={() => Alert.alert("Coming Soon", "Use Transactions Screen to withdraw")}
                />
            </View>

            {/* BANK ACCOUNTS CAROUSEL */}
            <View className="mt-6 px-4">
                <ThemedText className="text-sm font-[Outfit_600SemiBold] text-gray-500 uppercase tracking-wider mb-4">
                    Comptes Bancaires
                </ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-4">
                    {bankAccounts.map(acc => {
                        const style = getCurrencyColor(acc.currency);
                        return (
                            <View key={acc.id} className={`w-40 p-4 rounded-2xl border mr-3 ${style.bg} ${style.border}`}>
                                <View className="flex-row justify-between items-start mb-2">
                                    <View className="bg-white p-2 rounded-full w-8 h-8 items-center justify-center">
                                        <Wallet size={14} color={style.icon} />
                                    </View>
                                    <ThemedText className={`text-xs font-bold ${style.text}`}>{acc.currency}</ThemedText>
                                </View>
                                <ThemedText className="text-gray-900 font-bold text-lg mb-0.5" numberOfLines={1}>
                                    {acc.balance.toLocaleString()}
                                </ThemedText>
                                <ThemedText className="text-gray-500 text-xs" numberOfLines={1}>
                                    {acc.name}
                                </ThemedText>
                            </View>
                        );
                    })}
                    {/* Add Account Placeholder */}
                    <TouchableOpacity className="w-16 items-center justify-center border border-dashed border-gray-300 rounded-2xl mr-4 bg-white">
                        <Plus size={24} color="#D1D5DB" />
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* TRANSACTIONS LIST */}
            <View className="flex-1 px-4 mt-2">
                <ThemedText className="text-sm font-[Outfit_600SemiBold] text-gray-500 uppercase tracking-wider mb-4">
                    {t('menu.recent_transactions')}
                </ThemedText>

                {recentTransactions.map(tx => (
                    <View key={tx.id} className="bg-white p-4 rounded-xl border border-gray-100 mb-3 flex-row items-center justify-between shadow-sm">
                        <View className="flex-1 pr-4">
                            <ThemedText className="font-[Inter_600SemiBold] text-gray-900" numberOfLines={1}>{tx.description}</ThemedText>
                            <View className="flex-row items-center gap-1 mt-1">
                                <ThemedText className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</ThemedText>
                                <ThemedText className="text-xs text-gray-300">•</ThemedText>
                                <ThemedText className="text-xs text-gray-500">{tx.source}</ThemedText>
                            </View>
                        </View>
                        <View className="items-end">
                            <ThemedText className={`font-[Outfit_700Bold] text-base ${tx.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.type === 'IN' ? '+' : '-'} {(tx.amountDZD || tx.amount).toLocaleString()}
                            </ThemedText>
                            <View className={`px-1.5 py-0.5 rounded ${tx.type === 'IN' ? 'bg-green-50' : 'bg-red-50'} mt-1`}>
                                <ThemedText className={`text-[10px] font-bold ${tx.type === 'IN' ? 'text-green-700' : 'text-red-700'}`}>
                                    {tx.type === 'IN' ? 'ENTRÉE' : 'SORTIE'}
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                ))}

                {recentTransactions.length === 0 && (
                    <View className="bg-white p-8 rounded-xl border border-dashed border-gray-200 items-center justify-center">
                        <ThemedText className="text-gray-400 italic">Aucune transaction récente</ThemedText>
                    </View>
                )}
            </View>

            <View className="h-20" />
        </ScrollView>
    );
}

