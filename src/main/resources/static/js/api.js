// ===============================================
// MANDAP BILLING SYSTEM - API WRAPPER
// ===============================================

const API_BASE = '/api';

// Store auth token
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

// API Helper Functions
async function apiRequest(endpoint, method = 'GET', data = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const config = {
        method,
        headers,
    };
    
    if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        
        if (response.status === 401) {
            // Token expired or invalid
            logout();
            throw new Error('Session expired. Please login again.');
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'An error occurred');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth API
const AuthAPI = {
    login: async (username, password) => {
        const response = await apiRequest('/auth/login', 'POST', { username, password });
        authToken = response.token;
        currentUser = response;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(response));
        return response;
    },
    
    getCurrentUser: async () => {
        return await apiRequest('/auth/me');
    },
    
    logout: () => {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }
};

// Customers API
const CustomersAPI = {
    getAll: async () => await apiRequest('/customers'),
    getById: async (id) => await apiRequest(`/customers/${id}`),
    search: async (query) => await apiRequest(`/customers/search?query=${encodeURIComponent(query)}`),
    create: async (data) => await apiRequest('/customers', 'POST', data),
    update: async (id, data) => await apiRequest(`/customers/${id}`, 'PUT', data),
    delete: async (id) => await apiRequest(`/customers/${id}`, 'DELETE'),
};

// Events API
const EventsAPI = {
    getAll: async () => await apiRequest('/events'),
    getById: async (id) => await apiRequest(`/events/${id}`),
    getByYear: async (year) => await apiRequest(`/events/year/${year}`),
    getByType: async (type) => await apiRequest(`/events/type/${type}`),
    getYears: async () => await apiRequest('/events/years'),
    create: async (data) => await apiRequest('/events', 'POST', data),
    update: async (id, data) => await apiRequest(`/events/${id}`, 'PUT', data),
    delete: async (id) => await apiRequest(`/events/${id}`, 'DELETE'),
};

// Bills API
const BillsAPI = {
    getAll: async () => await apiRequest('/bills'),
    getById: async (id) => await apiRequest(`/bills/${id}`),
    getByNumber: async (billNumber) => await apiRequest(`/bills/number/${billNumber}`),
    getByCustomer: async (customerId) => await apiRequest(`/bills/customer/${customerId}`),
    getByEvent: async (eventId) => await apiRequest(`/bills/event/${eventId}`),
    getByYear: async (year) => await apiRequest(`/bills/year/${year}`),
    search: async (query) => await apiRequest(`/bills/search?query=${encodeURIComponent(query)}`),
    create: async (data) => await apiRequest('/bills', 'POST', data),
    update: async (id, data) => await apiRequest(`/bills/${id}`, 'PUT', data),
    delete: async (id) => await apiRequest(`/bills/${id}`, 'DELETE'),
};

// Inventory API
const InventoryAPI = {
    getAll: async () => await apiRequest('/inventory'),
    getBySide: async (side) => await apiRequest(`/inventory/side/${side}`),
    getById: async (id) => await apiRequest(`/inventory/${id}`),
    update: async (id, data) => await apiRequest(`/inventory/${id}`, 'PUT', data),
};

// Users API
const UsersAPI = {
    getAll: async () => await apiRequest('/users'),
    getById: async (id) => await apiRequest(`/users/${id}`),
    create: async (data) => await apiRequest('/users', 'POST', data),
    update: async (id, data) => await apiRequest(`/users/${id}`, 'PUT', data),
    delete: async (id) => await apiRequest(`/users/${id}`, 'DELETE'),
};

// Roles API
const RolesAPI = {
    getAll: async () => await apiRequest('/roles'),
    getById: async (id) => await apiRequest(`/roles/${id}`),
    getPermissions: async () => await apiRequest('/roles/permissions'),
    create: async (data) => await apiRequest('/roles', 'POST', data),
    update: async (id, data) => await apiRequest(`/roles/${id}`, 'PUT', data),
    delete: async (id) => await apiRequest(`/roles/${id}`, 'DELETE'),
};

// Helper to check if user has role
function hasRole(role) {
    return currentUser && currentUser.roles && currentUser.roles.includes(role);
}

// Helper to check if user has permission
function hasPermission(permission) {
    return currentUser && currentUser.permissions && currentUser.permissions.includes(permission);
}

// Check if admin
function isAdmin() {
    return hasRole('ADMIN');
}
