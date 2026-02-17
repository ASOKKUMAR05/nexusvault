const crypto = require('crypto');
const fs = require('fs').promises;

/**
 * Generate content hash for duplicate detection
 */
exports.generateContentHash = async (filePath) => {
    try {
        const fileBuffer = await fs.readFile(filePath);
        return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch (error) {
        console.error('Error generating content hash:', error);
        return null;
    }
};

/**
 * Format file size to human-readable format
 */
exports.formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file category based on MIME type
 */
exports.getCategoryFromMimeType = (mimeType) => {
    const categoryMap = {
        'image/': 'Images',
        'video/': 'Videos',
        'audio/': 'Audio',
        'application/pdf': 'Documents',
        'application/msword': 'Documents',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Documents',
        'application/vnd.ms-excel': 'Spreadsheets',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Spreadsheets',
        'application/vnd.ms-powerpoint': 'Presentations',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'Presentations',
        'text/plain': 'Documents',
        'text/csv': 'Spreadsheets',
        'application/zip': 'Archives',
        'application/x-rar-compressed': 'Archives',
        'text/html': 'Code',
        'text/css': 'Code',
        'text/javascript': 'Code',
        'application/json': 'Code'
    };

    for (const [key, value] of Object.entries(categoryMap)) {
        if (mimeType.startsWith(key) || mimeType === key) {
            return value;
        }
    }

    return 'Other';
};

/**
 * Generate tags from filename
 */
exports.generateTagsFromFilename = (filename) => {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

    // Split by common delimiters
    const words = nameWithoutExt.split(/[-_\s]+/);

    // Filter and clean tags
    const tags = words
        .filter(word => word.length > 2)
        .map(word => word.toLowerCase())
        .slice(0, 5);  // Limit to 5 tags

    return tags;
};

/**
 * Validate email format
 */
exports.validateEmail = (email) => {
    const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
};

/**
 * Error response helper
 */
exports.errorResponse = (res, statusCode, message) => {
    return res.status(statusCode).json({
        success: false,
        message
    });
};

/**
 * Success response helper
 */
exports.successResponse = (res, statusCode, message, data = null) => {
    const response = {
        success: true,
        message
    };

    if (data) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};
