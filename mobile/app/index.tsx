import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace('/login');
        } else {
            router.replace('/(tabs)');
        }
    }, [user, loading]);

    // Return null while loading to avoid showing a second splash screen
    // The animated splash just finished, so we don't need another loading indicator
    return null;
}
