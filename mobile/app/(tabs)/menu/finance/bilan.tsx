import { View, ScrollView, Dimensions } from 'react-native';
import { useLanguage } from '../../../../context/LanguageContext';
import { useData } from '../../../../context/DataContext';
import { ThemedText } from '../../../../components/ui/ThemedText';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react-native';
import { Svg, Rect, Text as SvgText, Line } from 'react-native-svg';

export default function BilanScreen() {
    const { t } = useLanguage();
    const { transactions, bankAccounts } = useData();

    // 1. Calculate Summary Stats
    const totalRevenue = transactions
        .filter(t => t.type === 'IN')
        .reduce((sum, t) => sum + (t.amountDZD || t.amount), 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'OUT')
        .reduce((sum, t) => sum + (t.amountDZD || t.amount), 0);

    const netProfit = totalRevenue - totalExpenses;

    // Calculate Total Caisse (Total Net)
    const caisseBalance = bankAccounts.reduce((sum, account) => {
        if (account.currency === 'DZD') return sum + account.balance;
        return sum + (account.balanceDZD || 0);
    }, 0);

    const stats = [
        { label: t('menu.revenue_total'), value: totalRevenue.toLocaleString() + ' DA', icon: TrendingUp, color: '#10b981', bg: '#ecfdf5' },
        { label: t('menu.expenses_total'), value: totalExpenses.toLocaleString() + ' DA', icon: TrendingDown, color: '#ef4444', bg: '#fef2f2' },
        { label: t('menu.net_profit'), value: netProfit.toLocaleString() + ' DA', icon: DollarSign, color: '#6366f1', bg: '#eef2ff' },
        { label: t('menu.caisse_balance'), value: caisseBalance.toLocaleString() + ' DA', icon: Wallet, color: '#f59e0b', bg: '#fffbeb' },
    ];

    // 2. Prepare Chart Data (Last 6 Months)
    const getLast6MonthsData = () => {
        const months = [];
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            const label = d.toLocaleDateString('fr-FR', { month: 'short' });

            // Filter transactions for this month
            const monthTransactions = transactions.filter(t => t.date.startsWith(monthKey));
            const income = monthTransactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + (t.amountDZD || t.amount), 0);
            const expense = monthTransactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + (t.amountDZD || t.amount), 0);

            months.push({ label, income, expense });
        }
        return months;
    };

    const chartData = getLast6MonthsData();
    const maxVal = Math.max(...chartData.map(d => Math.max(d.income, d.expense)), 1000); // Avoid 0 div

    // Simple SVG Bar Chart Logic
    const screenWidth = Dimensions.get('window').width - 64; // Padding
    const height = 180;
    const barWidth = 10;
    const spacing = (screenWidth - (chartData.length * barWidth * 2)) / (chartData.length + 1);

    return (
        <ScrollView className="flex-1 bg-gray-50 p-4">
            <View className="flex-row flex-wrap gap-4">
                {stats.map((stat, index) => (
                    <View key={index} className="w-[47%] bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <View className="w-10 h-10 rounded-full items-center justify-center mb-3" style={{ backgroundColor: stat.bg }}>
                            <stat.icon size={20} color={stat.color} />
                        </View>
                        <ThemedText className="text-gray-500 text-xs font-[Inter_500Medium] uppercase tracking-wide" numberOfLines={1}>
                            {stat.label}
                        </ThemedText>
                        <ThemedText className="text-gray-900 text-lg font-[Outfit_700Bold] mt-1" numberOfLines={1} adjustsFontSizeToFit>
                            {stat.value}
                        </ThemedText>
                    </View>
                ))}
            </View>

            {/* CHART */}
            <View className="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <ThemedText className="text-lg font-[Outfit_700Bold] text-gray-900 mb-6">Aperçu Recettes vs Dépenses</ThemedText>

                <View className="items-center">
                    <Svg height={height + 30} width={screenWidth}>
                        {/* Axes */}
                        <Line x1="0" y1={height} x2={screenWidth} y2={height} stroke="#E5E7EB" strokeWidth="1" />

                        {chartData.map((d, i) => {
                            const x = spacing + (i * (barWidth * 2 + spacing));
                            const hIncome = (d.income / maxVal) * height;
                            const hExpense = (d.expense / maxVal) * height;

                            return (
                                <View key={i}>
                                    {/* Income Bar (Green) */}
                                    <Rect
                                        x={x}
                                        y={height - hIncome}
                                        width={barWidth}
                                        height={hIncome}
                                        fill="#10B981"
                                        rx={4}
                                    />
                                    {/* Expense Bar (Red) */}
                                    <Rect
                                        x={x + barWidth + 4}
                                        y={height - hExpense}
                                        width={barWidth}
                                        height={hExpense}
                                        fill="#EF4444"
                                        rx={4}
                                    />
                                    {/* Label */}
                                    <SvgText
                                        x={x + barWidth}
                                        y={height + 20}
                                        fontSize="10"
                                        fill="#6B7280"
                                        textAnchor="middle"
                                    >
                                        {d.label}
                                    </SvgText>
                                </View>
                            );
                        })}
                    </Svg>
                </View>

                {/* Legend */}
                <View className="flex-row justify-center gap-6 mt-2">
                    <View className="flex-row items-center gap-2">
                        <View className="w-3 h-3 rounded-full bg-green-500" />
                        <ThemedText className="text-xs text-gray-500">Recettes</ThemedText>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <View className="w-3 h-3 rounded-full bg-red-500" />
                        <ThemedText className="text-xs text-gray-500">Dépenses</ThemedText>
                    </View>
                </View>
            </View>
            <View className="h-10" />
        </ScrollView>
    );
}

