import "../global.css";
import { Slot, Stack } from "expo-router";
import { View, ActivityIndicator, Alert } from "react-native";
import { useFonts } from 'expo-font';
import { Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { AuthProvider } from '../context/AuthContext';
import { DataProvider } from '../context/DataContext';
import { ExchangeRateProvider } from '../context/ExchangeRateContext';
import { LanguageProvider } from '../context/LanguageContext';
import { useState, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import AnimatedSplashScreen from '../components/AnimatedSplashScreen';
import { clientStorage } from '../services/storage';
import { StatusBar } from 'expo-status-bar';
import JailMonkey from 'jail-monkey';

// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const SPLASH_SHOWN_KEY = 'hasShownAnimatedSplash';

export default function Layout() {
    const [showAnimatedSplash, setShowAnimatedSplash] = useState(false);
    const [isCheckingStorage, setIsCheckingStorage] = useState(true);
    const [fontsLoaded] = useFonts({
        Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
        Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold,
        Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold,
    });

    // Check if splash has been shown before (persists across app restarts)
    useEffect(() => {
        const checkSplashStatus = async () => {
            try {
                const hasShown = await clientStorage.getItem(SPLASH_SHOWN_KEY);
                // Show splash only if never shown before (first install)
                setShowAnimatedSplash(!hasShown);
            } catch (error) {
                console.error('Error checking splash status:', error);
                // On error, show splash to be safe
                setShowAnimatedSplash(true);
            } finally {
                setIsCheckingStorage(false);
            }
        };

        checkSplashStatus();
    }, []);

    // SECURITY FIX: Root/Jailbreak Detection
    useEffect(() => {
        const checkDeviceSecurity = () => {
            if (JailMonkey.isJailBroken()) {
                console.warn('⚠️ WARNING: App is running on a rooted/jailbroken device');
                // Option 1: Just warn (current approach)
                Alert.alert(
                    'Security Warning',
                    'This device appears to be rooted/jailbroken. Some security features may be compromised.',
                    [{ text: 'I Understand', style: 'default' }]
                );
                // Option 2: Block app entirely (uncomment if needed)
                // Alert.alert(
                //     'Security Error',
                //     'This app cannot run on rooted/jailbroken devices.',
                //     [{ text: 'Exit', onPress: () => BackHandler.exitApp() }]
                // );
            }
        };

        checkDeviceSecurity();
    }, []);

    useEffect(() => {
        if (fontsLoaded && !isCheckingStorage) {
            console.log('📱 Layout: Fonts loaded, hiding native splash');
            // Hide the native splash screen once fonts are loaded and storage check is done
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, isCheckingStorage]);

    if (!fontsLoaded || isCheckingStorage) {
        console.log('📱 Layout: Waiting for fonts to load or storage check');
        // Keep native splash visible while fonts load or checking storage
        return null;
    }

    if (showAnimatedSplash) {
        console.log('📱 Layout: Showing AnimatedSplashScreen');
        // Show animated video splash screen
        return (
            <AnimatedSplashScreen
                onComplete={async () => {
                    console.log('📱 Layout: AnimatedSplashScreen completed, saving to storage');
                    // Save to AsyncStorage - persists across app restarts
                    await clientStorage.setItem(SPLASH_SHOWN_KEY, 'true');
                    setShowAnimatedSplash(false);
                }}
            />
        );
    }

    console.log('📱 Layout: Showing main app with providers');
    return (
        <>
            {/* Status bar for main app - dark content on light background */}
            <StatusBar style="dark" backgroundColor="transparent" translucent />

            <AuthProvider>
                <LanguageProvider>
                    <ExchangeRateProvider>
                        <DataProvider>
                            <Stack screenOptions={{ headerShown: false }} />
                        </DataProvider>
                    </ExchangeRateProvider>
                </LanguageProvider>
            </AuthProvider>
        </>
    );
}
