import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import type { User, Permission } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<boolean>;
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
        // Don't check auth if already on login page (Logic moved to navigation structure usually)
        // if (path === '/login') return;

        // Check if user is logged in on mount
        const checkAuth = async () => {
            try {
                const userData = await authAPI.getCurrentUser();
                setUser(userData);
            } catch (error: any) {
                // Only log real errors, not expected 401s
                if (error.response?.status !== 401) {
                    console.error('❌ CheckAuth Failed:', {
                        message: error.message,
                        status: error.response?.status,
                    });
                }
                // User not authenticated - silently fail
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            const userData = await authAPI.login(email, password);
            setUser(userData);
            return true;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
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
        if (user.role === 'admin') return true; // Admin has all permissions
        // Safely check permissions with fallback to empty array
        return Array.isArray(user.permissions) && user.permissions.includes(permission);
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <View className="items-center">
                    <ActivityIndicator size="large" color="#0ea5e9" />
                    <Text className="mt-4 text-gray-600">Chargement...</Text>
                </View>
            </View>
        );
    }

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
