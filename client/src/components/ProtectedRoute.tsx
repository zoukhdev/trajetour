import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Permission } from '../types';

interface ProtectedRouteProps {
    permission?: Permission;
    redirectPath?: string;
    children?: React.ReactNode;
}

const ProtectedRoute = ({ permission, redirectPath = '/login', children }: ProtectedRouteProps) => {
    const { isAuthenticated, hasPermission } = useAuth();

    // Check if user is authenticated
    if (!isAuthenticated) {
        return <Navigate to={redirectPath} replace />;
    }

    // Check if user has required permission
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
