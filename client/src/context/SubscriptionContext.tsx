import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { masterAPI } from '../services/api';

export interface Subscription {
    id: string;
    name: string;
    subdomain: string;
    plan: string;
    status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
    owner_email: string;
    created_at: string;
    db_provisioned_at: string | null;
    status_updated_at: string | null;
    rejection_reason: string | null;
    payment_proof_url: string | null;
}

interface SubscriptionContextValue {
    subscription: Subscription | null;
    loading: boolean;
    isLocked: boolean; // true when status is NOT ACTIVE
    isPremium: boolean; // true for GOLD and ENTERPRISE
    refetch: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
    subscription: null,
    loading: true,
    isLocked: false,
    isPremium: false,
    refetch: () => Promise.resolve(),
});

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSub = () => {
        setLoading(true);
        return masterAPI.getMySubscription()
            .then(data => setSubscription(data))
            .catch(() => setSubscription(null))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchSub(); }, []);

    // isLocked is true ONLY when we have successfully fetched the subscription AND it's not ACTIVE.
    const isLocked = !loading && subscription !== null && subscription.status !== 'ACTIVE';
    // isPremium is true for GOLD and ENTERPRISE plans
    const isPremium = subscription?.plan === 'GOLD' || subscription?.plan === 'ENTERPRISE';

    return (
        <SubscriptionContext.Provider value={{ subscription, loading, isLocked, isPremium, refetch: fetchSub }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => useContext(SubscriptionContext);
