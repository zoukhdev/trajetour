import { Stack } from 'expo-router';

export default function OrdersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Commandes', headerShown: false }} />
      <Stack.Screen name="form" options={{ presentation: 'modal', title: 'Nouvelle Commande' }} />
      <Stack.Screen name="[id]" options={{ title: 'Détails Commande' }} />
    </Stack>
  );
}
