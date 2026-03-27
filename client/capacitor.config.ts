import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.trajetour.app',
    appName: 'Trajetour',
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
