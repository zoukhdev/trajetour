import { Stack } from 'expo-router';
import { useLanguage } from '../../../../context/LanguageContext';

export default function FinanceLayout() {
    const { t } = useLanguage();

    return (
        <Stack screenOptions={{ headerShown: true }}>
            <Stack.Screen
                name="bilan"
                options={{ title: t('menu.bilan'), headerBackTitle: t('common.back') }}
            />
            <Stack.Screen
                name="caisse"
                options={{ title: t('menu.caisse'), headerBackTitle: t('common.back') }}
            />
            <Stack.Screen
                name="transactions"
                options={{ title: t('menu.transactions'), headerBackTitle: t('common.back') }}
            />
            <Stack.Screen
                name="payments"
                options={{ title: t('menu.payments'), headerBackTitle: t('common.back') }}
            />
            <Stack.Screen
                name="commissions"
                options={{ title: t('menu.commissions'), headerBackTitle: t('common.back') }}
            />
        </Stack>
    );
}
