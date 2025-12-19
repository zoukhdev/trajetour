import axios from 'axios';


const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.170:3001/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Send cookies with requests
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add response interceptor for error handling
api.interceptors.request.use(
    async (config) => {
        // If it's a sync request, pass through
        if (config.headers && config.headers['x-sync-request']) {
            return config;
        }

        // Check Online Status (TODO: Use NetInfo)
        // if (!navigator.onLine) {
        if (false) {
            // Only queue mutation requests (POST, PUT, DELETE, PATCH)
            const method = config.method?.toUpperCase();
            if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
                const { offlineQueueService } = await import('./offlineQueue'); // Dynamic import to avoid circular dependency issues if any

                offlineQueueService.addRequest({
                    url: config.url || '',
                    method: method || 'GET',
                    data: config.data || null,
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

        // Silence 401 errors for auth checks as they are expected when not logged in
        if (error.response?.status === 401 && error.config?.url?.includes('/auth/me')) {
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
            // The AuthContext handles this gracefully
            if (error.config.url?.includes('/auth/me')) {
                return Promise.reject(error);
            }

            // Only redirect if not already on login page
            // TODO: Navigate to login using Expo Router (handled by AuthContext state mostly)
            console.error(`🚫 401 Unauthorized from: ${error.config.url}. Needs Login.`);
            // router.replace('/login'); // Cannot use hook outside component
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
    getAll: async (page = 1, limit = 100) => {
        const response = await api.get(`/orders?page=${page}&limit=${limit}`);
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
    }
};

export const paymentsAPI = {
    create: async (data: any) => {
        const response = await api.post('/payments', data);
        return response.data;
    },

    validate: async (id: string, isValidated: boolean) => {
        const response = await api.patch(`/payments/${id}/validate`, { isValidated });
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

// Rooms API
export const roomsAPI = {
    async getAll(offerId?: string, hotelName?: string) {
        const params = new URLSearchParams();
        if (offerId) params.append('offerId', offerId);
        if (hotelName) params.append('hotelName', hotelName);

        const response = await api.get(`/rooms?${params.toString()}`);
        // Map snake_case to camelCase
        return response.data.map((room: any) => ({
            ...room,
            offerId: room.offer_id || room.offerId,
            hotelName: room.hotel_name || room.hotelName,
            roomNumber: room.room_number || room.roomNumber,
            occupiedCount: room.occupied_count || room.occupiedCount
        }));
    },

    async create(data: any) {
        const response = await api.post('/rooms', {
            offerId: data.offerId,
            hotelName: data.hotelName,
            roomNumber: data.roomNumber,
            capacity: data.capacity,
            gender: data.gender,
            price: data.price,
            pricing: data.pricing,
            status: data.status || 'ACTIVE'
        });
        // Map snake_case to camelCase
        return {
            ...response.data,
            offerId: response.data.offer_id || response.data.offerId,
            hotelName: response.data.hotel_name || response.data.hotelName,
            roomNumber: response.data.room_number || response.data.roomNumber,
            occupiedCount: response.data.occupied_count || response.data.occupiedCount
        };
    },

    async update(id: string, data: any) {
        const response = await api.put(`/rooms/${id}`, {
            offerId: data.offerId,
            hotelName: data.hotelName,
            roomNumber: data.roomNumber,
            capacity: data.capacity,
            gender: data.gender,
            price: data.price,
            pricing: data.pricing,
            status: data.status
        });
        // Map snake_case to camelCase
        return {
            ...response.data,
            offerId: response.data.offer_id || response.data.offerId,
            hotelName: response.data.hotel_name || response.data.hotelName,
            roomNumber: response.data.room_number || response.data.roomNumber,
            occupiedCount: response.data.occupied_count || response.data.occupiedCount
        };
    },

    async delete(id: string) {
        return api.delete(`/rooms/${id}`);
    },

    async getOccupants(id: string) {
        const response = await api.get(`/rooms/${id}/occupants`);
        return response.data;
    }
};
