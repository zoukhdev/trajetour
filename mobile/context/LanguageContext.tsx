import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import { clientStorage } from '../services/storage';
import { translations, Language } from '../i18n/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    t: (key: string) => string;
    isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('fr');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        const saved = await clientStorage.getItem('language');
        if (saved) {
            setLanguageState(saved as Language);
        }
        setIsLoaded(true);
    };

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        await clientStorage.setItem('language', lang);

        const isRTL = lang === 'ar';
        if (I18nManager.isRTL !== isRTL) {
            I18nManager.allowRTL(isRTL);
            I18nManager.forceRTL(isRTL);
            // In a real production app we might need to reload the app
            // Updates.reloadAsync(); 
            // For now, we assume simple text swap, but layout change usually needs restart
        }
    };

    const t = (path: string) => {
        const keys = path.split('.');
        let value: any = translations[language];

        for (const key of keys) {
            if (value && value[key]) {
                value = value[key];
            } else {
                return path;
            }
        }
        return value as string;
    };

    // Removed loading gate - render immediately with default language
    // Language loads asynchronously without blocking
    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, isRTL: language === 'ar' }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
