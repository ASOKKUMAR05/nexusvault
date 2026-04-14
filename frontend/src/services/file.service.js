import api from './api';

const CLOUDFRONT_URL = "https://d2zyqkp9ae3018.cloudfront.net";

export const fileService = {

    // 🚀 Upload file using Pre-Signed URL
    uploadFile: async (file, onProgress) => {
        try {
            // 1. Get presigned URL from backend
            const res = await api.get('/files/presigned-upload', {
                params: { fileType: file.type }
            });

            const { uploadUrl, fileKey } = res.data;

            // ✅ Validate response
            if (!uploadUrl || !fileKey) {
                throw new Error("Invalid presigned response");
            }

            // 2. Upload directly to S3
            const uploadRes = await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": file.type
                },
                body: file
            });

            // ✅ Check S3 upload success
            if (!uploadRes.ok) {
                throw new Error("S3 upload failed");
            }

            // 3. Generate CloudFront URL
            const fileUrl = `${CLOUDFRONT_URL}/${fileKey}`;

            // 4. Save metadata in backend (FIXED)
            await api.post('/files/upload', {
                url: fileUrl,          // ✅ FIX: Added missing field
                key: fileKey,
                name: file.name,
                type: file.type
            });

            // 5. Progress callback
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

    // 📂 Get all files
    getFiles: async (params = {}) => {
        const response = await api.get('/files', { params });
        return response.data;
    },

    // 📄 Get file by ID
    getFileById: async (id) => {
        const response = await api.get(`/files/${id}`);
        return response.data;
    },

    // ⬇️ Download file (CloudFront / signed URL)
    downloadFile: async (id) => {
        try {
            const response = await api.get(`/files/${id}/download`);

            const { downloadUrl } = response.data.data;

            if (!downloadUrl) {
                throw new Error("Download URL missing");
            }

            // Open file directly
            window.open(downloadUrl, "_blank");

        } catch (error) {
            console.error("Download error:", error);
            throw error;
        }
    },

    // 🗑️ Delete file
    deleteFile: async (id) => {
        const response = await api.delete(`/files/${id}`);
        return response.data;
    },

    // 🔍 Search files
    searchFiles: async (query, filters = {}) => {
        const response = await api.get('/files/search', {
            params: { q: query, ...filters }
        });
        return response.data;
    },

    // 🔁 Get duplicates
    getDuplicates: async () => {
        const response = await api.get('/files/duplicates');
        return response.data;
    },

    // 📊 Storage stats
    getStorageStats: async () => {
        const response = await api.get('/files/stats');
        return response.data;
    },

    // 🌐 Helper to generate CloudFront URL
    getFileUrl: (key) => {
        return `${CLOUDFRONT_URL}/${key}`;
    }
};