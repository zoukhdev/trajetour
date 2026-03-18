import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Permission } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<User | null>;
    logout: () => void;
    isAuthenticated: boolean;
    hasPermission: (permission: Permission) => boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Don't check auth if already on login page
        if (window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/register')) {
            setLoading(false);
            return;
        }

        // Check if user is logged in on mount
        const checkAuth = async () => {
            try {
                const userData = await authAPI.getCurrentUser();
                setUser(userData);
            } catch (error: any) {
                // ... existing error handling
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string): Promise<User | null> => {
        try {
            const userData = await authAPI.login(email, password);
            setUser(userData);
            return userData;
        } catch (error) {
            console.error('Login failed:', error);
            return null;
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
        }
    };

    const hasPermission = (permission: Permission): boolean => {
        if (!user) return false;
        if (user.role === 'admin' || user.role === 'super_admin') return true; // Admin and Super Admin have all permissions
        // Safely check permissions with fallback to empty array
        return Array.isArray(user.permissions) && user.permissions.includes(permission);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, hasPermission, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
