import api from './api';

const CLOUDFRONT_URL = "https://d2zyqkp9ae3018.cloudfront.net";

export const fileService = {

    //  Upload file using Pre-Signed URL
    uploadFile: async (file, onProgress) => {
        try {
            // 1. Get presigned URL from backend
            const res = await api.get('/files/presigned-upload', {
                params: { fileType: file.type }
            });

            const { uploadUrl, fileKey } = res.data;

            // 2. Upload directly to S3
            await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": file.type
                },
                body: file
            });

            // 3. Save metadata in backend
            await api.post('/files/upload', {
                key: fileKey,
                name: file.name,
                type: file.type
            });

            if (onProgress) onProgress(100);

            return {
                success: true,
                fileUrl: `${CLOUDFRONT_URL}/${fileKey}`
            };

        } catch (error) {
            console.error("Upload error:", error);
            throw error;
        }
    },

    //  Get all files
    getFiles: async (params = {}) => {
        const response = await api.get('/files', { params });
        return response.data;
    },

    //  Get file by ID
    getFileById: async (id) => {
        const response = await api.get(`/files/${id}`);
        return response.data;
    },

    //  UPDATED DOWNLOAD (IMPORTANT CHANGE)
    downloadFile: async (id) => {
        try {
            const response = await api.get(`/files/${id}/download`);

            const { downloadUrl } = response.data.data;

            //  Open directly (fast, uses CloudFront/S3)
            window.open(downloadUrl, "_blank");

        } catch (error) {
            console.error("Download error:", error);
            throw error;
        }
    },

    //  Delete file
    deleteFile: async (id) => {
        const response = await api.delete(`/files/${id}`);
        return response.data;
    },

    //  Search files
    searchFiles: async (query, filters = {}) => {
        const response = await api.get('/files/search', {
            params: { q: query, ...filters }
        });
        return response.data;
    },

    //  Get duplicates
    getDuplicates: async () => {
        const response = await api.get('/files/duplicates');
        return response.data;
    },

    // Storage stats
    getStorageStats: async () => {
        const response = await api.get('/files/stats');
        return response.data;
    },

    // Get CloudFront URL helper (NEW)
    getFileUrl: (key) => {
        return `${CLOUDFRONT_URL}/${key}`;
    }
};