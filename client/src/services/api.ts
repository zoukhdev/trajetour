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
    getAll: async () => {
        const response = await api.get('/suppliers');
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

// Generic API for other endpoints (when routes are created)
export const genericAPI = {
    get: async (endpoint: string) => {
        const response = await api.get(endpoint);
        return response.data;
    },

    post: async (endpoint: string, data: any) => {
        const response = await api.post(endpoint, data);
        return response.data;
    },

    put: async (endpoint: string, data: any) => {
        const response = await api.put(endpoint, data);
        return response.data;
    },

    delete: async (endpoint: string) => {
        const response = await api.delete(endpoint);
        return response.data;
    }
};

export default api;
