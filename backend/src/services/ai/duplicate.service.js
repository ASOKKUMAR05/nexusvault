const File = require('../../models/File.model');
const { generateContentHash } = require('../../utils/helpers');

/**
 * Duplicate Detection Service
 */
class DuplicateService {
    /**
     * Find duplicate files for a user
     */
    async findDuplicates(userId, contentHash) {
        try {
            if (!contentHash) {
                return [];
            }

            const duplicates = await File.find({
                owner: userId,
                contentHash: contentHash
            }).select('filename originalName size createdAt path');

            return duplicates;
        } catch (error) {
            console.error('Error finding duplicates:', error);
            return [];
        }
    }

    /**
     * Check if file is duplicate before upload
     */
    async checkDuplicate(userId, filePath) {
        try {
            const hash = await generateContentHash(filePath);

            if (!hash) {
                return { isDuplicate: false };
            }

            const existing = await File.findOne({
                owner: userId,
                contentHash: hash
            });

            if (existing) {
                return {
                    isDuplicate: true,
                    existingFile: {
                        id: existing._id,
                        name: existing.originalName,
                        uploadedAt: existing.createdAt,
                        size: existing.size
                    }
                };
            }

            return { isDuplicate: false, hash };
        } catch (error) {
            console.error('Error checking duplicate:', error);
            return { isDuplicate: false };
        }
    }

    /**
     * Find all duplicate sets for a user
     */
    async findAllDuplicates(userId) {
        try {
            const files = await File.find({ owner: userId });

            const hashMap = {};

            // Group files by content hash
            files.forEach(file => {
                if (file.contentHash) {
                    if (!hashMap[file.contentHash]) {
                        hashMap[file.contentHash] = [];
                    }
                    hashMap[file.contentHash].push({
                        id: file._id,
                        name: file.originalName,
                        size: file.size,
                        createdAt: file.createdAt,
                        path: file.path
                    });
                }
            });

            // Filter only duplicates (hash with more than 1 file)
            const duplicateSets = [];
            Object.values(hashMap).forEach(group => {
                if (group.length > 1) {
                    duplicateSets.push({
                        count: group.length,
                        files: group,
                        totalSize: group.reduce((sum, f) => sum + f.size, 0)
                    });
                }
            });

            return duplicateSets;
        } catch (error) {
            console.error('Error finding all duplicates:', error);
            return [];
        }
    }

    /**
     * Calculate potential space savings from duplicates
     */
    async calculateSpaceSavings(userId) {
        try {
            const duplicateSets = await this.findAllDuplicates(userId);

            let totalSavings = 0;

            duplicateSets.forEach(set => {
                // Space saved would be (count - 1) * file size
                // We keep one copy, delete the rest
                const fileSize = set.files[0].size;
                totalSavings += (set.count - 1) * fileSize;
            });

            return {
                potentialSavings: totalSavings,
                duplicateSets: duplicateSets.length,
                totalDuplicateFiles: duplicateSets.reduce((sum, set) => sum + set.count, 0)
            };
        } catch (error) {
            console.error('Error calculating space savings:', error);
            return {
                potentialSavings: 0,
                duplicateSets: 0,
                totalDuplicateFiles: 0
            };
        }
    }
}

module.exports = new DuplicateService();
