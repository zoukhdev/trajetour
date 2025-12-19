import { Stack } from 'expo-router';

export default function ClientsLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ title: 'Clients', headerShown: false }} />
            <Stack.Screen name="form" options={{ presentation: 'modal', title: 'Client' }} />
        </Stack>
    );
}
