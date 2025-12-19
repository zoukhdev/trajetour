import { Stack } from 'expo-router';
import { useLanguage } from '../../../context/LanguageContext';

export default function MenuLayout() {
    const { t } = useLanguage();

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="finance" options={{ headerShown: false }} />
            <Stack.Screen name="operations" options={{ headerShown: false }} />
            <Stack.Screen
                name="users"
                options={{
                    headerShown: true,
                    title: t('profile.users_management'),
                    headerBackTitle: t('common.back')
                }}
            />
            <Stack.Screen
                name="agency"
                options={{
                    headerShown: true,
                    title: t('profile.agency_settings'),
                    headerBackTitle: t('common.back')
                }}
            />
            <Stack.Screen
                name="exchange-rates"
                options={{
                    headerShown: true,
                    title: t('menu.exchange_rates'),
                    headerBackTitle: t('common.back')
                }}
            />
        </Stack>
    );
}
