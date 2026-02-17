const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const config = require('../../config/config');

/**
 * Storage Service - Handle file system operations
 */
class StorageService {
    /**
     * Save file (already handled by multer, but this can be used for additional operations)
     */
    async saveFile(filePath, data) {
        try {
            await fs.writeFile(filePath, data);
            return { success: true };
        } catch (error) {
            console.error('Error saving file:', error);
            throw error;
        }
    }

    /**
     * Read file
     */
    async readFile(filePath) {
        try {
            const data = await fs.readFile(filePath);
            return data;
        } catch (error) {
            console.error('Error reading file:', error);
            throw error;
        }
    }

    /**
     * Delete file
     */
    async deleteFile(filePath) {
        try {
            if (fsSync.existsSync(filePath)) {
                await fs.unlink(filePath);
                return { success: true };
            }
            return { success: false, message: 'File not found' };
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    /**
     * Copy file (for versioning)
     */
    async copyFile(sourcePath, destinationPath) {
        try {
            await fs.copyFile(sourcePath, destinationPath);
            return { success: true };
        } catch (error) {
            console.error('Error copying file:', error);
            throw error;
        }
    }

    /**
     * Move file
     */
    async moveFile(sourcePath, destinationPath) {
        try {
            await fs.rename(sourcePath, destinationPath);
            return { success: true };
        } catch (error) {
            console.error('Error moving file:', error);
            throw error;
        }
    }

    /**
     * Check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get file stats
     */
    async getFileStats(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return stats;
        } catch (error) {
            console.error('Error getting file stats:', error);
            throw error;
        }
    }

    /**
     * Create user directory
     */
    async createUserDirectory(userId) {
        try {
            const userDir = path.join(config.upload.uploadDir, userId.toString());

            if (!fsSync.existsSync(userDir)) {
                await fs.mkdir(userDir, { recursive: true });
            }

            return userDir;
        } catch (error) {
            console.error('Error creating user directory:', error);
            throw error;
        }
    }

    /**
     * Get user storage usage
     */
    async getUserStorageUsage(userId) {
        try {
            const userDir = path.join(config.upload.uploadDir, userId.toString());

            if (!fsSync.existsSync(userDir)) {
                return 0;
            }

            let totalSize = 0;
            const files = await fs.readdir(userDir);

            for (const file of files) {
                const filePath = path.join(userDir, file);
                const stats = await fs.stat(filePath);

                if (stats.isFile()) {
                    totalSize += stats.size;
                }
            }

            return totalSize;
        } catch (error) {
            console.error('Error calculating storage usage:', error);
            return 0;
        }
    }

    /**
     * Clean up orphaned files (files not in database)
     */
    async cleanupOrphanedFiles(userId, validFilePaths) {
        try {
            const userDir = path.join(config.upload.uploadDir, userId.toString());

            if (!fsSync.existsSync(userDir)) {
                return { deleted: 0 };
            }

            const files = await fs.readdir(userDir);
            let deletedCount = 0;

            for (const file of files) {
                const filePath = path.join(userDir, file);
                const fullPath = path.resolve(filePath);

                if (!validFilePaths.includes(fullPath)) {
                    await fs.unlink(filePath);
                    deletedCount++;
                }
            }

            return { deleted: deletedCount };
        } catch (error) {
            console.error('Error cleaning up orphaned files:', error);
            throw error;
        }
    }
}

module.exports = new StorageService();
