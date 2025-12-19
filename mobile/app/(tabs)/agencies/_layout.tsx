import { Stack } from 'expo-router';

export default function AgenciesLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'white' },
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="form" options={{ presentation: 'modal' }} />
        </Stack>
    );
}
