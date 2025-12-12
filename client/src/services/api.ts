import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Send cookies with requests
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Ignore 401 for initial auth check to avoid infinite redirect loops
            // The AuthContext handles this gracefully
            if (error.config.url?.includes('/auth/me')) {
                return Promise.reject(error);
            }

            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
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
