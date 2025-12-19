import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { offlineQueueService, type OfflineRequest } from '../services/offlineQueue';
import api from '../services/api';

interface OfflineContextType {
    isOnline: boolean;
    queue: OfflineRequest[];
    syncing: boolean;
    manualSync: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    //@ts-ignore
    const [queue, setQueue] = useState<OfflineRequest[]>(offlineQueueService.getQueue());
    const [syncing, setSyncing] = useState(false);

    // Get refreshData from DataContext
    // Note: This assumes DataProvider wraps OfflineProvider or is available in the tree.
    // If DataProvider is inside OfflineProvider in App.tsx, this will fail.
    // However, for the fix to work, OfflineProvider usually wraps the generic App, but Data needs to be accessible.
    // If this throws an error, we might need a different architectural approach (e.g. event bus).
    // For now, let's assume standard Context composition allows it, or wrapped safely.
    // Actually, usually <AuthProvider><OfflineProvider><DataProvider><App/></DataProvider></OfflineProvider></AuthProvider>
    // If OfflineProvider is OUTSIDE DataProvider, `useData` will throw.
    // I will add a safe check or catch. But useData throws if undefined.

    // SAFEGUARDS: We cannot use useData() here if OfflineProvider is a parent of DataProvider.
    // Instead of using useData directly, we can dispatch a custom event or use an event listener that DataContext listens to?
    // OR we just use window.location.reload() as a nuclear option for "Refresh"?
    // BETTER: DataContext listens to 'offline-sync-complete' event.

    // Let's change strategy to be safer and avoid Context Dependency Cycles/Errors.
    // Strategy: Dispatch a custom window event "sync-complete". DataContext listens to it.

    // Wait, let's stick to the file write first. I will implement the Event based strategy which is safer.

    // Monitor Network Status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Monitor Queue Changes
    useEffect(() => {
        const unsubscribe = offlineQueueService.subscribe((updatedQueue) => {
            setQueue(updatedQueue);
        });
        return unsubscribe;
    }, []);

    // Auto-Sync when Online
    useEffect(() => {
        if (isOnline && queue.length > 0 && !syncing) {
            processQueue();
        }
    }, [isOnline, queue.length]);

    const processQueue = async () => {
        if (syncing || queue.length === 0) return;

        setSyncing(true);
        const currentQueue = [...queue];
        let syncedCount = 0;

        console.log(`Starting sync of ${currentQueue.length} requests...`);

        // Sort by timestamp to ensure FIFO
        currentQueue.sort((a, b) => a.timestamp - b.timestamp);

        for (const req of currentQueue) {
            try {
                console.log(`Syncing request: ${req.method} ${req.url}`);

                // Add strict header to indicate this is a synced request and provide original time
                const headers = {
                    ...req.headers,
                    'x-client-timestamp': req.timestamp.toString(),
                    'x-sync-request': 'true'
                };

                await api.request({
                    url: req.url,
                    method: req.method,
                    data: req.data,
                    headers: headers
                });

                // If successful, remove from queue
                offlineQueueService.removeRequest(req.id);
                syncedCount++;
            } catch (error) {
                console.error(`Failed to sync request ${req.id}`, error);
                // logic to handle permanent failure vs retry is tricky. 
                // For now, if it fails, we leave it? Or remove it to avoid blocking?
                // Let's remove it if it's a 4xx error (user error), keep for 5xx/network.
                // For simplicity in this v1, we stop syncing and try again later.
                break;
            }
        }

        setSyncing(false);
        if (syncedCount > 0) {
            console.log(`Synced ${syncedCount} offline changes.`);
            // Dispatch event for DataContext to pick up
            window.dispatchEvent(new Event('data-refresh-needed'));
        }
    };

    const manualSync = async () => {
        if (isOnline) await processQueue();
    };

    return (
        <OfflineContext.Provider value={{ isOnline, queue, syncing, manualSync }}>
            {children}
        </OfflineContext.Provider>
    );
};

export const useOffline = () => {
    const context = useContext(OfflineContext);
    if (!context) {
        throw new Error('useOffline must be used within an OfflineProvider');
    }
    return context;
};
