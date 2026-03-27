const path = require('path');
const { v4: uuidv4 } = require('uuid');
const FileVersion = require('../../models/FileVersion.model');
const File = require('../../models/File.model');
const storageService = require('../storage/storage.service');
const { generateContentHash } = require('../../utils/helpers');
const config = require('../../config/config');

/**
 * Version Control Service
 */
class VersioningService {
    /**
     * Create a new version of a file
     */
    async createVersion(fileId, userId, filePath, changeDescription = null) {
        try {
            const file = await File.findOne({ _id: fileId, owner: userId });

            if (!file) {
                throw new Error('File not found');
            }

            // Increment version number
            const newVersionNumber = file.currentVersion + 1;

            // Create version directory structure in S3 (logical)
            const versionFilename = `v${newVersionNumber}-${uuidv4()}-${file.filename}`;
            const versionPath = `${userId}/versions/${fileId}/${versionFilename}`;

            // Copy current file to version key in S3
            // filePath shouldn't be used since we can copy from file.path
            await storageService.copyFile(file.path, versionPath);

            // Get file stats
            const stats = await storageService.getFileStats(versionPath);
            const contentHash = file.contentHash;

            // Create version record
            const version = await FileVersion.create({
                file: fileId,
                versionNumber: newVersionNumber,
                filename: versionFilename,
                path: versionPath,
                size: stats.size,
                mimeType: file.mimeType,
                modifiedBy: userId,
                changeDescription,
                contentHash
            });

            // Update file's version array and current version
            file.versions.push(version._id);
            file.currentVersion = newVersionNumber;
            await file.save();

            return version;
        } catch (error) {
            console.error('Error creating version:', error);
            throw error;
        }
    }

    /**
     * Get all versions of a file
     */
    async getVersionHistory(fileId, userId) {
        try {
            const file = await File.findOne({ _id: fileId, owner: userId });

            if (!file) {
                throw new Error('File not found');
            }

            const versions = await FileVersion.find({ file: fileId })
                .populate('modifiedBy', 'name email')
                .sort({ versionNumber: -1 });

            return versions;
        } catch (error) {
            console.error('Error getting version history:', error);
            throw error;
        }
    }

    /**
     * Restore a specific version
     */
    async restoreVersion(fileId, versionNumber, userId) {
        try {
            const file = await File.findOne({ _id: fileId, owner: userId });

            if (!file) {
                throw new Error('File not found');
            }

            const version = await FileVersion.findOne({
                file: fileId,
                versionNumber: versionNumber
            });

            if (!version) {
                throw new Error('Version not found');
            }

            // Copy version file back to main location
            await storageService.copyFile(version.path, file.path);

            // Update file metadata
            file.size = version.size;
            file.contentHash = version.contentHash;
            await file.save();

            return {
                success: true,
                restoredVersion: versionNumber,
                file
            };
        } catch (error) {
            console.error('Error restoring version:', error);
            throw error;
        }
    }

    /**
     * Compare two versions
     */
    async compareVersions(fileId, version1Number, version2Number, userId) {
        try {
            const file = await File.findOne({ _id: fileId, owner: userId });

            if (!file) {
                throw new Error('File not found');
            }

            const [version1, version2] = await Promise.all([
                FileVersion.findOne({ file: fileId, versionNumber: version1Number }),
                FileVersion.findOne({ file: fileId, versionNumber: version2Number })
            ]);

            if (!version1 || !version2) {
                throw new Error('One or both versions not found');
            }

            return {
                version1: {
                    number: version1.versionNumber,
                    size: version1.size,
                    modifiedAt: version1.createdAt,
                    modifiedBy: version1.modifiedBy,
                    description: version1.changeDescription
                },
                version2: {
                    number: version2.versionNumber,
                    size: version2.size,
                    modifiedAt: version2.createdAt,
                    modifiedBy: version2.modifiedBy,
                    description: version2.changeDescription
                },
                differences: {
                    sizeDifference: version2.size - version1.size,
                    contentChanged: version1.contentHash !== version2.contentHash
                }
            };
        } catch (error) {
            console.error('Error comparing versions:', error);
            throw error;
        }
    }

    /**
     * Delete old versions (keep only recent N versions)
     */
    async cleanupOldVersions(fileId, keepCount = 10) {
        try {
            const versions = await FileVersion.find({ file: fileId })
                .sort({ versionNumber: -1 });

            if (versions.length <= keepCount) {
                return { deleted: 0 };
            }

            const versionsToDelete = versions.slice(keepCount);
            let deletedCount = 0;

            for (const version of versionsToDelete) {
                // Delete physical file
                await storageService.deleteFile(version.path);

                // Delete version record
                await FileVersion.findByIdAndDelete(version._id);

                deletedCount++;
            }

            // Update file's version array
            const file = await File.findById(fileId);
            if (file) {
                file.versions = file.versions.filter(
                    vId => !versionsToDelete.map(v => v._id.toString()).includes(vId.toString())
                );
                await file.save();
            }

            return { deleted: deletedCount };
        } catch (error) {
            console.error('Error cleaning up old versions:', error);
            throw error;
        }
    }
}

module.exports = new VersioningService();
