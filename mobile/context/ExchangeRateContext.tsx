import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ExchangeRateRecord } from '../types';
import { clientStorage } from '../services/storage';

interface ExchangeRateContextType {
    rateHistory: ExchangeRateRecord[];
    currentRates: { SAR: number; EUR: number; USD: number } | null;
    saveExchangeRate: (sarToDzd: number, eurToDzd: number, usdToDzd: number, date?: string) => void;
    getRateForDate: (date: string, currency: 'SAR' | 'EUR' | 'USD') => number | null;
    getLatestRate: (currency: 'SAR' | 'EUR' | 'USD') => number;
    updateHistoricalRate: (id: string, sarToDzd: number, eurToDzd: number, usdToDzd: number) => void;
    deleteRate: (id: string) => void;
}

const ExchangeRateContext = createContext<ExchangeRateContextType | undefined>(undefined);

export const ExchangeRateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize with default values, data will be loaded via effect
    const [rateHistory, setRateHistory] = useState<ExchangeRateRecord[]>([{
        id: 'default',
        date: new Date().toISOString().split('T')[0],
        sarToDzd: 36.5,
        eurToDzd: 245,
        usdToDzd: 220,
        createdBy: 'System',
        createdAt: new Date().toISOString()
    }]);

    // Load from storage on mount
    useEffect(() => {
        const loadRates = async () => {
            try {
                const saved = await clientStorage.getItem('exchange_rate_history');
                if (saved) {
                    setRateHistory(JSON.parse(saved));
                }
            } catch (error) {
                console.error('Failed to load exchange rates', error);
            }
        };
        loadRates();
    }, []);

    // Persist to storage whenever history changes
    useEffect(() => {
        const saveRates = async () => {
            try {
                await clientStorage.setItem('exchange_rate_history', JSON.stringify(rateHistory));
            } catch (error) {
                console.error('Failed to save exchange rates', error);
            }
        };
        saveRates();
    }, [rateHistory]);

    // Get current rates (latest in history)
    const currentRates = rateHistory.length > 0
        ? {
            SAR: rateHistory[rateHistory.length - 1].sarToDzd,
            EUR: rateHistory[rateHistory.length - 1].eurToDzd,
            USD: rateHistory[rateHistory.length - 1].usdToDzd || 220
        }
        : null;

    /**
     * Save a new exchange rate for a specific date
     * If no date provided, uses today's date
     */
    const saveExchangeRate = (
        sarToDzd: number,
        eurToDzd: number,
        usdToDzd: number,
        date?: string
    ) => {
        const rateDate = date || new Date().toISOString().split('T')[0];

        // Check if rate already exists for this date
        const existingIndex = rateHistory.findIndex(r => r.date === rateDate);

        const newRate: ExchangeRateRecord = {
            id: existingIndex >= 0 ? rateHistory[existingIndex].id : Math.random().toString(36).substr(2, 9),
            date: rateDate,
            sarToDzd,
            eurToDzd,
            usdToDzd,
            createdBy: 'Admin', // TODO: Get from auth context
            createdAt: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            // Update existing rate
            const updated = [...rateHistory];
            updated[existingIndex] = newRate;
            setRateHistory(updated.sort((a, b) => a.date.localeCompare(b.date)));
        } else {
            // Add new rate and sort by date
            setRateHistory([...rateHistory, newRate].sort((a, b) => a.date.localeCompare(b.date)));
        }
    };

    /**
     * Get exchange rate for a specific date
     * Returns the rate for that exact date, or null if not found
     */
    const getRateForDate = (date: string, currency: 'SAR' | 'EUR' | 'USD'): number | null => {
        const record = rateHistory.find(r => r.date === date);
        if (!record) return null;

        switch (currency) {
            case 'SAR':
                return record.sarToDzd;
            case 'EUR':
                return record.eurToDzd;
            case 'USD':
                return record.usdToDzd || 220;
            default:
                return null;
        }
    };

    /**
     * Get the latest exchange rate for a currency
     * Returns the most recent rate available
     */
    const getLatestRate = (currency: 'SAR' | 'EUR' | 'USD'): number => {
        if (rateHistory.length === 0) {
            // Fallback defaults
            return currency === 'SAR' ? 36.5 : currency === 'EUR' ? 245 : 220;
        }

        const latest = rateHistory[rateHistory.length - 1];
        switch (currency) {
            case 'SAR':
                return latest.sarToDzd;
            case 'EUR':
                return latest.eurToDzd;
            case 'USD':
                return latest.usdToDzd || 220;
            default:
                return 0;
        }
    };

    /**
     * Update a historical rate (with warning - affects past transactions)
     */
    const updateHistoricalRate = (
        id: string,
        sarToDzd: number,
        eurToDzd: number,
        usdToDzd: number
    ) => {
        setRateHistory(prev =>
            prev.map(rate =>
                rate.id === id
                    ? { ...rate, sarToDzd, eurToDzd, usdToDzd }
                    : rate
            )
        );
    };

    /**
     * Delete a rate from history
     */
    const deleteRate = (id: string) => {
        if (rateHistory.length <= 1) {
            alert('Cannot delete the last exchange rate record');
            return;
        }
        setRateHistory(prev => prev.filter(r => r.id !== id));
    };

    return (
        <ExchangeRateContext.Provider
            value={{
                rateHistory,
                currentRates,
                saveExchangeRate,
                getRateForDate,
                getLatestRate,
                updateHistoricalRate,
                deleteRate
            }}
        >
            {children}
        </ExchangeRateContext.Provider>
    );
};

export const useExchangeRates = () => {
    const context = useContext(ExchangeRateContext);
    if (context === undefined) {
        throw new Error('useExchangeRates must be used within an ExchangeRateProvider');
    }
    return context;
};
