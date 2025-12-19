import AsyncStorage from '@react-native-async-storage/async-storage';

export const clientStorage = {
    getItem: async (key: string) => {
        try {
            const value = await AsyncStorage.getItem(key);
            return value ?? null;
        } catch (e) {
            console.error('Storage Read Error', e);
            return null;
        }
    },
    setItem: async (key: string, value: string) => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (e) {
            console.error('Storage Write Error', e);
        }
    },
    removeItem: async (key: string) => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (e) {
            console.error('Storage Delete Error', e);
        }
    },
    clear: async () => {
        try {
            await AsyncStorage.clear();
        } catch (e) {
            console.error('Storage Clear Error', e);
        }
    }
};
