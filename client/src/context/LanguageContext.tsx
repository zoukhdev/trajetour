import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';
import type { Language } from '../translations';

interface LanguageContextType {
    language: Language;
    direction: 'ltr' | 'rtl';
    setLanguage: (lang: Language) => void;
    t: (key: string, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('language');
        return (saved as Language) || 'fr';
    });

    const direction = language === 'ar' ? 'rtl' : 'ltr';

    useEffect(() => {
        localStorage.setItem('language', language);
        document.documentElement.dir = direction;
        document.documentElement.lang = language;

        // Update body class for font switching
        if (language === 'ar') {
            document.body.classList.add('font-arabic');
            document.body.classList.remove('font-sans');
        } else {
            document.body.classList.add('font-sans');
            document.body.classList.remove('font-arabic');
        }
    }, [language, direction]);

    const t = (path: string, variables?: Record<string, string | number>) => {
        const keys = path.split('.');
        let value: any = (translations as any)[language];

        for (const key of keys) {
            if (value && value[key]) {
                value = value[key];
            } else {
                return path;
            }
        }

        let result = value as string;
        if (variables) {
            Object.entries(variables).forEach(([key, val]) => {
                result = result.replace(`{${key}}`, val.toString());
            });
        }
        return result;
    };

    return (
        <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
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
