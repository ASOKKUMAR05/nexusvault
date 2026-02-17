import api from './api';

export const authService = {
    // Register new user
    register: async (name, email, password) => {
        const response = await api.post('/auth/register', { name, email, password });
        if (response.data.data.token) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
        return response.data;
    },

    // Login user
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.data.token) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
        return response.data;
    },

    // Logout user
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Get current user
    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    // Get user profile
    getProfile: async () => {
        const response = await api.get('/auth/profile');
        return response.data;
    },

    // Update profile
    updateProfile: async (data) => {
        const response = await api.put('/auth/profile', data);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        return response.data;
    }
};
