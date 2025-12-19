import { Stack } from 'expo-router';

export default function OffersLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="form" options={{ presentation: 'modal' }} />
        </Stack>
    );
}
