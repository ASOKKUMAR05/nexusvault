import api from './api';

export const fileService = {

    // 🚀 Upload file using Pre-Signed URL
    uploadFile: async (file, onProgress) => {
        try {
            // 1. Get presigned URL from backend
            const res = await api.get('/files/presigned-upload', {
                params: { fileType: file.type }
            });

            const { uploadUrl, fileUrl } = res.data;

            // 2. Upload directly to S3
            await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": file.type
                },
                body: file
            });

            // 3. Save file metadata in backend (IMPORTANT)
            await api.post('/files/upload', {
                url: fileUrl,
                name: file.name,
                type: file.type
            });

            // 4. Progress (since fetch doesn't support progress)
            if (onProgress) onProgress(100);

            return {
                success: true,
                fileUrl
            };

        } catch (error) {
            console.error("Upload error:", error);
            throw error;
        }
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