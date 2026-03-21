import axios from 'axios';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Send cookies with requests
    // NOTE: Do NOT set Content-Type here. Axios will auto-set it correctly:
    // - 'application/json' for plain objects
    // - 'multipart/form-data' (with boundary) for FormData
});

// Interceptor to inject x-tenant-id for multi-tenancy
// This is primarily for local testing where subdomains might not be easy to configure.
// It detects the current subdomain (if any) or defaults to 'default'.
api.interceptors.request.use((config) => {
    const hostname = window.location.hostname;
    let tenantId = 'default';
    
    // Example: agency1.localhost or agency1.trajetour.com
    if (hostname.split('.').length > 2) {
        tenantId = hostname.split('.')[0];
    } else if (localStorage.getItem('dev_tenant_id')) {
        // Fallback for easy local dev testing
        tenantId = localStorage.getItem('dev_tenant_id') as string;
    }

    if (config.headers) {
        config.headers['X-Tenant-Id'] = tenantId;
    }
    return config;
});

// Add response interceptor for error handling
api.interceptors.request.use(
    async (config) => {
        // If it's a sync request, pass through
        if (config.headers && config.headers['x-sync-request']) {
            return config;
        }

        // Check Online Status
        if (!navigator.onLine) {
            // Only queue mutation requests (POST, PUT, DELETE, PATCH)
            const method = config.method?.toUpperCase();
            if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
                const { offlineQueueService } = await import('./offlineQueue'); // Dynamic import to avoid circular dependency issues if any

                offlineQueueService.addRequest({
                    url: config.url || '',
                    method: method,
                    data: config.data,
                    headers: config.headers
                });

                return Promise.reject({
                    message: 'Network Error: Offline',
                    code: 'OFFLINE_QUEUED',
                    isOffline: true
                });
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle Offline Queued "Errors" gracefully if caught here (though request interceptor usually rejects before this)
        if (error.isOffline || error.code === 'OFFLINE_QUEUED') {
            console.log('Request queued offline:', error);
            // Return a resolved promise with a fake success/pending structure to prevent UI crashes?
            // Or let the UI handle the error. 
            // Better to let UI handle it, or standard error handler.
            // But we don't want the "Red Toast" for system error.
            return Promise.reject(error);
        }

        console.error('❌ API Request Failed:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            message: error.message,
            data: error.response?.data
        });

        if (error.response?.status === 401) {
            // Ignore 401 for initial auth check to avoid infinite redirect loops
            if (error.config.url?.includes('/auth/me')) {
                return Promise.reject(error);
            }

            // Public routes — never redirect to login from these pages
            const publicPaths = ['/', '/demo', '/about', '/contact', '/faq', '/reviews',
                '/packages', '/agency-signup', '/register', '/login'];
            const isPublicPage = publicPaths.some(p =>
                window.location.pathname === p || window.location.pathname.startsWith(p + '/')
            );

            if (!isPublicPage) {
                console.error(`🚫 401 Unauthorized from: ${error.config.url}. Redirecting to login.`);
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api; // Default Export for use in components like DataMigration

// Authentication API
export const authAPI = {
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    register: async (data: any) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    registerAgency: async (data: any) => {
        const response = await api.post('/master/register-agency', data, {
            headers: {
                // Explicitly delete Content-Type so axios lets the browser
                // set multipart/form-data with the correct boundary for FormData
                'Content-Type': undefined
            }
        });
        return response.data;
    }
};

// Clients API
export const clientsAPI = {
    getAll: async (page = 1, limit = 100) => {
        const response = await api.get(`/clients?page=${page}&limit=${limit}`);
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/clients/${id}`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post('/clients', data);
        return response.data;
    },

    update: async (id: string, data: any) => {
        const response = await api.put(`/clients/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/clients/${id}`);
        return response.data;
    }
};

// Orders API
export const ordersAPI = {
    getAll: async (pageOrParams: any = 1, limit = 100) => {
        if (typeof pageOrParams === 'object') {
            const response = await api.get('/orders', { params: pageOrParams });
            return response.data;
        }
        const response = await api.get(`/orders?page=${pageOrParams}&limit=${limit}`);
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post('/orders', data);
        return response.data;
    },

    update: async (id: string, data: any) => {
        const response = await api.put(`/orders/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/orders/${id}`);
        return response.data;
    },

    addPayment: async (orderId: string, payment: any) => {
        const response = await api.post(`/orders/${orderId}/payments`, payment);
        return response.data;
    },

    uploadReceipt: async (orderId: string, formData: FormData) => {
        const response = await api.post(`/payments/${orderId}/upload-receipt`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

export const paymentsAPI = {
    create: async (data: any) => {
        const response = await api.post('/payments', data);
        return response.data;
    },

    getAll: async (params?: any) => {
        const response = await api.get('/payments', { params });
        return response.data;
    },

    validate: async (id: string, isValidated: boolean) => {
        const response = await api.patch(`/payments/${id}/validate`, { isValidated });
        return response.data;
    },

    uploadReceipt: async (orderId: string, formData: FormData) => {
        const response = await api.post(`/payments/${orderId}/upload-receipt`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};

export const reportsAPI = {
    getPaymentReports: async (params?: { startDate?: string; endDate?: string; agencyId?: string }) => {
        const response = await api.get('/reports/payments', { params });
        return response.data;
    }
};

export const offersAPI = {
    getAll: async () => {
        const response = await api.get('/offers');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/offers/${id}`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post('/offers', data);
        return response.data;
    },

    update: async (id: string, data: any) => {
        const response = await api.put(`/offers/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/offers/${id}`);
        return response.data;
    }
};

// Packages API (Alias for Offers)
export const packagesAPI = {
    getAll: async (type?: 'hajj' | 'omrah') => {
        // In a real app, query param ?type=${type}
        const response = await api.get('/offers');
        // Filter client-side if API doesn't support filter yet, or if this is temporary
        if (type) {
            return response.data.filter((p: any) => p.type?.toLowerCase() === type);
        }
        return response.data;
    },
    getById: offersAPI.getById
};

export const passengersAPI = {
    uploadDocument: async (orderId: string, passengerId: string, file: File, type: 'passport' | 'photo') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        const response = await api.post(`/passengers/${orderId}/${passengerId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    update: async (orderId: string, passengerId: string, data: any) => {
        const response = await api.put(`/passengers/${orderId}/${passengerId}`, data);
        return response.data;
    }
};

export const suppliersAPI = {
    getAll: async (page = 1, limit = 100) => {
        const response = await api.get(`/suppliers?page=${page}&limit=${limit}`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post('/suppliers', data);
        return response.data;
    },

    update: async (id: string, data: any) => {
        const response = await api.put(`/suppliers/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/suppliers/${id}`);
        return response.data;
    }
};

// --- NEW BACKEND SERVICES ---

// Agencies API
export const agenciesAPI = {
    getAll: async (page = 1, limit = 100) => {
        const response = await api.get(`/agencies?page=${page}&limit=${limit}`);
        return response.data; // { data: [], pagination: {} }
    },
    getById: async (id: string) => {
        const response = await api.get(`/agencies/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/agencies', data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.put(`/agencies/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/agencies/${id}`);
        return response.data;
    }
};

// Expenses API
export const expensesAPI = {
    getAll: async (page = 1, limit = 100) => {
        const response = await api.get(`/expenses?page=${page}&limit=${limit}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/expenses', data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.put(`/expenses/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/expenses/${id}`);
        return response.data;
    }
};

// Users API
export const usersAPI = {
    getAll: async (page = 1, limit = 100) => {
        const response = await api.get(`/users?page=${page}&limit=${limit}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/users', data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.put(`/users/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    }
};

// Transactions (Financial) API
export const transactionsAPI = {
    getAll: async (page = 1, limit = 50, accountId?: string) => {
        const query = accountId ? `?accountId=${accountId}&page=${page}&limit=${limit}` : `?page=${page}&limit=${limit}`;
        const response = await api.get(`/transactions${query}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/transactions', data);
        return response.data;
    },
    // No update for transactions (Audit Log principle), only void/delete
    delete: async (id: string) => {
        const response = await api.delete(`/transactions/${id}`);
        return response.data;
    }
};

// Bank Accounts API
export const bankAccountsAPI = {
    getAll: async () => {
        const response = await api.get('/bank-accounts');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/bank-accounts', data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.put(`/bank-accounts/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/bank-accounts/${id}`);
        return response.data;
    }
};

// Supplier Contracts API
export const supplierContractsAPI = {
    getAll: async (page = 1, limit = 50, supplierId?: string, type?: string) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (supplierId) params.append('supplierId', supplierId);
        if (type) params.append('type', type);

        const response = await api.get(`/supplier-contracts?${params.toString()}`);
        return response.data; // { data: [], pagination: {} }
    },

    getBySupplier: async (supplierId: string, type?: string) => {
        const query = type ? `?type=${type}` : '';
        const response = await api.get(`/suppliers/${supplierId}/contracts${query}`);
        return response.data; // Returns array directly
    },

    getById: async (id: string) => {
        const response = await api.get(`/supplier-contracts/${id}`);
        return response.data;
    },

    create: async (supplierId: string, data: any) => {
        const response = await api.post(`/suppliers/${supplierId}/contracts`, data);
        return response.data;
    },

    update: async (id: string, data: any) => {
        const response = await api.put(`/supplier-contracts/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/supplier-contracts/${id}`);
        return response.data;
    }
};

// Rooms API  
export const roomsAPI = {
    getAll: async (offerId?: string) => {
        const query = offerId ? `?offerId=${offerId}` : '';
        const response = await api.get(`/rooms${query}`);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post('/rooms', data);
        return response.data;
    },

    update: async (id: string, data: any) => {
        const response = await api.put(`/rooms/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/rooms/${id}`);
        return response.data;
    }
};

// Audit Logs API
export const auditLogsAPI = {
    getAll: async (params: { page: number; limit: number; userId?: string; action?: string; entityType?: string; startDate?: string; endDate?: string }) => {
        const urlParams = new URLSearchParams();
        urlParams.append('page', params.page.toString());
        urlParams.append('limit', params.limit.toString());
        if (params.userId) urlParams.append('userId', params.userId);
        if (params.action) urlParams.append('action', params.action);
        if (params.entityType) urlParams.append('entityType', params.entityType);
        if (params.startDate) urlParams.append('startDate', params.startDate);
        if (params.endDate) urlParams.append('endDate', params.endDate);

        const response = await api.get(`/audit-logs?${urlParams.toString()}`);
        return response.data;
    }
};

// Master Platform API (Multi-Tenancy)
export const masterAPI = {
    registerAgency: async (data: any) => {
        const response = await api.post('/master/register-agency', data);
        return response.data;
    },
    getAgencies: async (status?: string) => {
        const params = status ? `?status=${status}` : '';
        const response = await api.get(`/master/agencies${params}`);
        return response.data;
    },
    getAgency: async (id: string) => {
        const response = await api.get(`/master/agencies/${id}`);
        return response.data;
    },
    updateAgencyStatus: async (id: string, status: string, rejection_reason?: string) => {
        const response = await api.patch(`/master/agencies/${id}/status`, { status, rejection_reason });
        return response.data;
    },
    getMySubscription: async () => {
        const response = await api.get('/master/my-subscription');
        return response.data;
    },
    uploadPaymentProof: async (file: File) => {
        const formData = new FormData();
        formData.append('proof', file);
        const response = await api.post('/master/my-subscription/payment-proof', formData, {
            headers: { 'Content-Type': undefined } // Let browser set multipart/form-data with correct boundary
        });
        return response.data;
    }
};
