import * as SecureStore from 'expo-secure-store';

// SECURITY FIX: Use encrypted SecureStore instead of plain AsyncStorage
// SecureStore uses:
// - Android: EncryptedSharedPreferences (AES-256)
// - iOS: Keychain
export const clientStorage = {
    getItem: async (key: string) => {
        try {
            const value = await SecureStore.getItemAsync(key);
            return value ?? null;
        } catch (e) {
            console.error('SecureStore Read Error', e);
            return null;
        }
    },
    setItem: async (key: string, value: string) => {
        try {
            await SecureStore.setItemAsync(key, value);
        } catch (e) {
            console.error('SecureStore Write Error', e);
        }
    },
    removeItem: async (key: string) => {
        try {
            await SecureStore.deleteItemAsync(key);
        } catch (e) {
            console.error('SecureStore Delete Error', e);
        }
    },
    clear: async () => {
        try {
            // SecureStore doesn't have a clear all method
            // You'd need to track keys separately if needed
            console.warn('SecureStore does not support clear() - delete keys individually');
        } catch (e) {
            console.error('SecureStore Clear Error', e);
        }
    }
};
