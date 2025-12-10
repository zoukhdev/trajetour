import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.wahatalrajaa.tour',
    appName: 'Wahat Alrajaa Tour',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    },
    android: {
        allowMixedContent: true,
        backgroundColor: '#ffffff'
    }
};

export default config;
