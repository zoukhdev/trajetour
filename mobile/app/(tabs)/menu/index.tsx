import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { ThemedText } from '../../../components/ui/ThemedText';
import {
    Users,
    Settings,
    LogOut,
    Globe,
    ChevronRight,
    Building2,
    Briefcase,
    Wallet,
    TrendingUp,
    TrendingDown,
    CreditCard,
    PieChart,
    FileText,
    BedDouble
} from 'lucide-react-native';

export default function MenuScreen() {
    const { logout, user } = useAuth();
    const router = useRouter();
    const { language, setLanguage, t } = useLanguage();

    const handleLogout = () => {
        Alert.alert(
            t('common.logout'),
            t('profile.logout_confirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.logout'),
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/login');
                    }
                }
            ]
        );
    };

    const toggleLanguage = async () => {
        const newLang = language === 'fr' ? 'ar' : 'fr';
        await setLanguage(newLang);
    };

    const menuSections = [
        {
            title: t('menu.finance'),
            items: [
                { icon: PieChart, label: t('menu.bilan'), route: '/(tabs)/menu/finance/bilan', color: '#6366f1' },
                { icon: Wallet, label: t('menu.caisse'), route: '/(tabs)/menu/finance/caisse', color: '#10b981' },
                { icon: TrendingUp, label: t('menu.revenues'), route: '/(tabs)/menu/finance/transactions?type=revenue', color: '#22c55e' },
                { icon: TrendingDown, label: t('menu.expenses'), route: '/(tabs)/menu/finance/transactions?type=expense', color: '#ef4444' },
                { icon: CreditCard, label: t('menu.payments'), route: '/(tabs)/menu/finance/payments', color: '#f59e0b' },
                { icon: FileText, label: t('menu.commissions'), route: '/(tabs)/menu/finance/commissions', color: '#8b5cf6' },
            ]
        },
        {
            title: t('menu.operations'),
            items: [
                { icon: BedDouble, label: t('menu.rooms_list'), route: '/(tabs)/menu/operations/rooms', color: '#ec4899' },
            ]
        },
        {
            title: t('menu.admin'),
            items: [
                { icon: Users, label: t('profile.users_management'), route: '/(tabs)/menu/users', color: '#3b82f6' },
                { icon: Building2, label: t('profile.agency_settings'), route: '/(tabs)/menu/agency', color: '#64748b' },
                { icon: TrendingUp, label: t('menu.exchange_rates'), route: '/(tabs)/menu/exchange-rates', color: '#10b981' },
            ]
        }
    ];

    return (
        <View className="flex-1 bg-gray-50">
            <View className="bg-white px-6 pt-12 pb-6 border-b border-gray-100 shadow-sm">
                <ThemedText variant="h2" className="text-gray-900">{t('common.menu')}</ThemedText>
                <ThemedText className="text-gray-500 mt-1">{user?.username || 'Utilisateur'}</ThemedText>
            </View>

            <ScrollView className="flex-1 p-4">
                {menuSections.map((section, index) => {
                    // Filter items for agents
                    let filteredItems = section.items;

                    if (user?.role === 'agent') {
                        // Hide all Finance items
                        if (section.title === t('menu.finance')) {
                            return null;
                        }

                        // Filter Admin items
                        if (section.title === t('menu.admin')) {
                            filteredItems = section.items.filter(item =>
                                item.route !== '/(tabs)/menu/users' &&
                                item.route !== '/(tabs)/menu/agency'
                            );

                            if (filteredItems.length === 0) return null;
                        }
                    }

                    if (filteredItems.length === 0) return null;

                    return (
                        <View key={index} className="mb-6">
                            <ThemedText className="text-sm font-[Outfit_600SemiBold] text-gray-500 uppercase tracking-wider mb-3 ml-1">
                                {section.title}
                            </ThemedText>
                            <View className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                {filteredItems.map((item, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        onPress={() => router.push(item.route as any)}
                                        className={`flex-row items-center p-4 ${idx !== filteredItems.length - 1 ? 'border-b border-gray-50' : ''}`}
                                    >
                                        <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: `${item.color}15` }}>
                                            <item.icon size={20} color={item.color} />
                                        </View>
                                        <ThemedText className="flex-1 text-base font-[Inter_500Medium] text-gray-900">
                                            {item.label}
                                        </ThemedText>
                                        <ChevronRight size={20} color="#E5E7EB" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    );
                })}

                <View className="mb-8">
                    <ThemedText className="text-sm font-[Outfit_600SemiBold] text-gray-500 uppercase tracking-wider mb-3 ml-1">
                        {t('common.settings')}
                    </ThemedText>
                    <View className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                        <TouchableOpacity
                            onPress={toggleLanguage}
                            className="flex-row items-center p-4 border-b border-gray-50"
                        >
                            <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mr-4">
                                <Globe size={20} color="#F97316" />
                            </View>
                            <View className="flex-1">
                                <ThemedText className="text-base font-[Inter_500Medium] text-gray-900">
                                    {t('profile.language')}
                                </ThemedText>
                                <ThemedText className="text-xs text-gray-500">
                                    {language === 'fr' ? 'Français' : 'العربية'}
                                </ThemedText>
                            </View>
                            <ChevronRight size={20} color="#E5E7EB" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleLogout}
                            className="flex-row items-center p-4"
                        >
                            <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mr-4">
                                <LogOut size={20} color="#EF4444" />
                            </View>
                            <ThemedText className="flex-1 text-base font-[Inter_500Medium] text-red-600">
                                {t('common.logout')}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
