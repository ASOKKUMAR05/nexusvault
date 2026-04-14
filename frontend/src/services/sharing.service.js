import api from './api';

export const sharingService = {
    // Share file with another user
    shareFile: async (fileId, email, permission = 'view') => {
        const response = await api.post('/sharing/share', {
            fileId,
            email,
            permission
        });
        return response.data;
    },

    // Get files shared by user
    getSharedByMe: async () => {
        const response = await api.get('/sharing/shared-by-me');
        return response.data;
    },

    // Get files shared with user
    getSharedWithMe: async () => {
        const response = await api.get('/sharing/shared-with-me');
        return response.data;
    },

    // Update share permissions
    updateSharePermission: async (shareId, permission) => {
        const response = await api.put(`/sharing/${shareId}`, {
            permission
        });
        return response.data;
    },

    // Revoke file sharing
    revokeShare: async (shareId) => {
        const response = await api.delete(`/sharing/${shareId}`);
        return response.data;
    }
};
