import "../global.css";
import { Slot, Stack } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useFonts } from 'expo-font';
import { Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { AuthProvider } from '../context/AuthContext';
import { DataProvider } from '../context/DataContext';
import { ExchangeRateProvider } from '../context/ExchangeRateContext';
import { LanguageProvider } from '../context/LanguageContext';

export default function Layout() {
    const [fontsLoaded] = useFonts({
        Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
        Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold,
        Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold,
    });

    if (!fontsLoaded) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <AuthProvider>
            <LanguageProvider>
                <ExchangeRateProvider>
                    <DataProvider>
                        <Stack screenOptions={{ headerShown: false }} />
                    </DataProvider>
                </ExchangeRateProvider>
            </LanguageProvider>
        </AuthProvider>
    );
}
