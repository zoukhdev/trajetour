import { Stack } from 'expo-router';
import { useLanguage } from '../../../../context/LanguageContext';

export default function OperationsLayout() {
    const { t } = useLanguage();

    return (
        <Stack screenOptions={{ headerShown: true }}>
            <Stack.Screen
                name="rooms"
                options={{ title: t('menu.rooms_list'), headerBackTitle: t('common.back') }}
            />
            <Stack.Screen
                name="form"
                options={{ title: t('menu.new_room'), headerBackTitle: t('common.back') }}
            />
        </Stack>
    );
}
