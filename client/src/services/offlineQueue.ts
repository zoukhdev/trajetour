import { v4 as uuidv4 } from 'uuid';

export interface OfflineRequest {
    id: string;
    url: string;
    method: string;
    data: any;
    headers: any; // We might need to store headers like Auth
    timestamp: number;
    retryCount: number;
}

const QUEUE_KEY = 'offline_queue';

class OfflineQueueService {
    private queue: OfflineRequest[] = [];
    private listeners: ((queue: OfflineRequest[]) => void)[] = [];

    constructor() {
        this.loadQueue();
    }

    private loadQueue() {
        try {
            const stored = localStorage.getItem(QUEUE_KEY);
            if (stored) {
                this.queue = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load offline queue', e);
            this.queue = [];
        }
    }

    private saveQueue() {
        try {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
            this.notifyListeners();
        } catch (e) {
            console.error('Failed to save offline queue', e);
        }
    }

    public getQueue(): OfflineRequest[] {
        return this.queue;
    }

    public addRequest(req: Omit<OfflineRequest, 'id' | 'timestamp' | 'retryCount'>) {
        const newRequest: OfflineRequest = {
            ...req,
            id: uuidv4(),
            timestamp: Date.now(),
            retryCount: 0
        };
        this.queue.push(newRequest);
        this.saveQueue();
    }

    public removeRequest(id: string) {
        this.queue = this.queue.filter(req => req.id !== id);
        this.saveQueue();
    }

    public clearQueue() {
        this.queue = [];
        this.saveQueue();
    }

    public subscribe(listener: (queue: OfflineRequest[]) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(l => l(this.queue));
    }
}

export const offlineQueueService = new OfflineQueueService();
