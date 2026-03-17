import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Permission, UserRole } from '../types';

interface ProtectedRouteProps {
    children?: React.ReactNode;
    permission?: Permission; // Keep existing permission check
    role?: UserRole; // Add role check
}

const ProtectedRoute = ({ children, permission, role }: ProtectedRouteProps) => {
    const { user, loading, hasPermission } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role Check
    if (role && (user.role as string) !== (role as string) && user.role !== 'super_admin') {
        // Allow admin to access everything or strictly enforce? 
        // For now, strict check except super_admin
        if (user.role === 'admin' && role === 'agent') {
            // Admin can view agency dashboard? Maybe.
        } else {
            return <div className="p-10 text-center text-red-500">Access Denied: Role mismatch</div>;
        }
    }

    if (permission && !hasPermission(permission)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center max-w-md">
                    <div className="text-red-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h2>
                    <p className="text-gray-600">Vous n'avez pas la permission nécessaire pour accéder à cette page.</p>
                </div>
            </div>
        );
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
