import { Tabs } from 'expo-router';
import { Chrome as Home, Users, Briefcase, ShoppingCart, Building2, Tag, Menu } from 'lucide-react-native';
import { useLanguage } from '../../context/LanguageContext';

export default function TabLayout() {
    const { t } = useLanguage();

    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#2563EB' }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: t('common.dashboard'),
                    tabBarIcon: ({ color }: { color: string }) => <Home size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: t('common.orders'),
                    headerShown: false,
                    tabBarIcon: ({ color }: { color: string }) => <ShoppingCart size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="clients"
                options={{
                    title: t('common.clients'),
                    headerShown: false,
                    tabBarIcon: ({ color }: { color: string }) => <Users size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="agencies"
                options={{
                    title: t('common.agencies'),
                    headerShown: false,
                    tabBarIcon: ({ color }: { color: string }) => <Briefcase size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="offers"
                options={{
                    title: t('common.offers'),
                    headerShown: false,
                    tabBarIcon: ({ color }: { color: string }) => <Tag size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="suppliers"
                options={{
                    title: t('common.suppliers'),
                    headerShown: false,
                    tabBarIcon: ({ color }: { color: string }) => <Building2 size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="menu"
                options={{
                    title: t('common.menu'),
                    headerShown: false,
                    tabBarIcon: ({ color }: { color: string }) => <Menu size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
// Trigger HMR update
