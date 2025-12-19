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

        // Check if we are already in auth group to avoid loops
        // But index is root, so we decide where to go.

        if (!user) {
            router.replace('/login');
        } else {
            router.replace('/(tabs)');
        }
    }, [user, loading]);

    return (
        <View className="flex-1 items-center justify-center bg-white">
            <ActivityIndicator size="large" color="#2563EB" />
        </View>
    );
}
