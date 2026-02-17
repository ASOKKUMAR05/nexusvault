import api from './api';

export const fileService = {
    // Upload file
    uploadFile: async (file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                if (onProgress) onProgress(percentCompleted);
            }
        });

        return response.data;
    },

    // Get all files
    getFiles: async (params = {}) => {
        const response = await api.get('/files', { params });
        return response.data;
    },

    // Get file by ID
    getFileById: async (id) => {
        const response = await api.get(`/files/${id}`);
        return response.data;
    },

    // Download file
    downloadFile: async (id, filename) => {
        const response = await api.get(`/files/${id}/download`, {
            responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    // Delete file
    deleteFile: async (id) => {
        const response = await api.delete(`/files/${id}`);
        return response.data;
    },

    // Search files
    searchFiles: async (query, filters = {}) => {
        const response = await api.get('/files/search', {
            params: { q: query, ...filters }
        });
        return response.data;
    },

    // Get duplicates
    getDuplicates: async () => {
        const response = await api.get('/files/duplicates');
        return response.data;
    },

    // Get storage stats
    getStorageStats: async () => {
        const response = await api.get('/files/stats');
        return response.data;
    }
};
