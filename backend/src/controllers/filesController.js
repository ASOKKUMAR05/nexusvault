const File = require('../models/File.model');
const User = require('../models/User.model');
const aiService = require('../services/ai/ai.service');
const duplicateService = require('../services/ai/duplicate.service');
const searchService = require('../services/ai/search.service');
const storageService = require('../services/storage/storage.service');
const versioningService = require('../services/versioning/versioning.service');
const { generateContentHash, successResponse, errorResponse, formatFileSize } = require('../utils/helpers');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Upload file
 * @route   POST /api/files/upload
 * @access  Private
 */
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return errorResponse(res, 400, 'No file uploaded');
        }

        const user = await User.findById(req.user.id);

        // Check storage quota
        if (user.storageUsed + req.file.size > user.storageQuota) {
            // Delete uploaded tmp file
            await fs.promises.unlink(req.file.path).catch(err => console.error('Failed to delete temp file:', err));
            return errorResponse(res, 400, 'Storage quota exceeded');
        }

        // Check for duplicates
        const duplicateCheck = await duplicateService.checkDuplicate(req.user.id, req.file.path);

        // Generate content hash
        const contentHash = duplicateCheck.hash || await generateContentHash(req.file.path);

        // AI categorization
        const { category, tags } = await aiService.categorizeFile(req.file);

        const s3Key = `${req.user.id}/${req.file.filename}`;

        // Upload to S3
        await storageService.saveFile(req.file.path, s3Key);

        // Delete temporary local file
        await fs.promises.unlink(req.file.path).catch(err => console.error('Failed to delete temp file:', err));

        // Create file record
        const file = await File.create({
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: s3Key, // Store S3 key instead of local path
            size: req.file.size,
            mimeType: req.file.mimetype,
            owner: req.user.id,
            category,
            tags,
            contentHash,
            aiProcessed: true
        });

        // Update user storage
        user.storageUsed += req.file.size;
        await user.save();

        successResponse(res, 201, 'File uploaded successfully', {
            file: {
                id: file._id,
                name: file.originalName,
                size: file.size,
                category: file.category,
                tags: file.tags,
                uploadedAt: file.createdAt
            },
            duplicate: duplicateCheck.isDuplicate ? duplicateCheck.existingFile : null,
            storage: {
                used: user.storageUsed,
                quota: user.storageQuota,
                percentage: user.getStoragePercentage()
            }
        });
    } catch (error) {
        console.error('Error in uploadFile:', error);
        errorResponse(res, 500, 'Error uploading file');
    }
};

/**
 * @desc    Get all files for user
 * @route   GET /api/files
 * @access  Private
 */
exports.getFiles = async (req, res) => {
    try {
        const { category, sort = 'createdAt', order = 'desc', limit = 50, page = 1 } = req.query;

        const query = { owner: req.user.id };

        if (category) {
            query.category = category;
        }

        const sortObj = {};
        sortObj[sort] = order === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [files, total] = await Promise.all([
            File.find(query)
                .sort(sortObj)
                .limit(parseInt(limit))
                .skip(skip)
                .lean(),
            File.countDocuments(query)
        ]);

        successResponse(res, 200, 'Files fetched successfully', {
            files: files.map(f => ({
                id: f._id,
                name: f.originalName,
                size: f.size,
                sizeFormatted: formatFileSize(f.size),
                category: f.category,
                tags: f.tags,
                mimeType: f.mimeType,
                uploadedAt: f.createdAt,
                lastAccessed: f.lastAccessedAt,
                downloads: f.downloadCount,
                versions: f.versions.length,
                isShared: f.sharedWith.length > 0
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getFiles:', error);
        errorResponse(res, 500, 'Error fetching files');
    }
};

/**
 * @desc    Get file by ID
 * @route   GET /api/files/:id
 * @access  Private
 */
exports.getFileById = async (req, res) => {
    try {
        const file = await File.findOne({
            _id: req.params.id,
            owner: req.user.id
        }).populate('sharedWith.user', 'name email');

        if (!file) {
            return errorResponse(res, 404, 'File not found');
        }

        file.lastAccessedAt = Date.now();
        await file.save();

        successResponse(res, 200, 'File fetched successfully', { file });
    } catch (error) {
        console.error('Error in getFileById:', error);
        errorResponse(res, 500, 'Error fetching file');
    }
};

/**
 * @desc    Download file
 * @route   GET /api/files/:id/download
 * @access  Private
 */
exports.downloadFile = async (req, res) => {
    try {
        const file = await File.findOne({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!file) {
            return errorResponse(res, 404, 'File not found');
        }

        // Check if file exists in S3
        const exists = await storageService.fileExists(file.path);
        if (!exists) {
            return errorResponse(res, 404, 'File not found on storage');
        }

        // Update download count
        file.downloadCount += 1;
        file.lastAccessedAt = Date.now();
        await file.save();

        // Stream file from S3 to response
        const fileStream = await storageService.getFileStream(file.path);
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error in downloadFile:', error);
        errorResponse(res, 500, 'Error downloading file');
    }
};

/**
 * @desc    Delete file
 * @route   DELETE /api/files/:id
 * @access  Private
 */
exports.deleteFile = async (req, res) => {
    try {
        const file = await File.findOne({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!file) {
            return errorResponse(res, 404, 'File not found');
        }

        // Delete physical file
        await storageService.deleteFile(file.path);

        // Update user storage
        const user = await User.findById(req.user.id);
        user.storageUsed -= file.size;
        await user.save();

        // Delete file record
        await File.findByIdAndDelete(req.params.id);

        successResponse(res, 200, 'File deleted successfully', {
            storage: {
                used: user.storageUsed,
                quota: user.storageQuota,
                percentage: user.getStoragePercentage()
            }
        });
    } catch (error) {
        console.error('Error in deleteFile:', error);
        errorResponse(res, 500, 'Error deleting file');
    }
};

/**
 * @desc    Search files
 * @route   GET /api/files/search
 * @access  Private
 */
exports.searchFiles = async (req, res) => {
    try {
        const { q, category, tags, dateFrom, dateTo, minSize, maxSize } = req.query;

        const results = await searchService.smartSearch(req.user.id, q, {
            category,
            tags: tags ? tags.split(',') : [],
            dateFrom,
            dateTo,
            minSize,
            maxSize
        });

        successResponse(res, 200, 'Search completed', results);
    } catch (error) {
        console.error('Error in searchFiles:', error);
        errorResponse(res, 500, 'Error searching files');
    }
};

/**
 * @desc    Get duplicates
 * @route   GET /api/files/duplicates
 * @access  Private
 */
exports.getDuplicates = async (req, res) => {
    try {
        const duplicates = await duplicateService.findAllDuplicates(req.user.id);
        const savings = await duplicateService.calculateSpaceSavings(req.user.id);

        successResponse(res, 200, 'Duplicates fetched successfully', {
            duplicates,
            savings
        });
    } catch (error) {
        console.error('Error in getDuplicates:', error);
        errorResponse(res, 500, 'Error fetching duplicates');
    }
};

/**
 * @desc    Get storage stats
 * @route   GET /api/files/stats
 * @access  Private
 */
exports.getStorageStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const files = await File.find({ owner: req.user.id });

        // Category breakdown
        const categoryStats = {};
        files.forEach(file => {
            if (!categoryStats[file.category]) {
                categoryStats[file.category] = { count: 0, size: 0 };
            }
            categoryStats[file.category].count += 1;
            categoryStats[file.category].size += file.size;
        });

        // Recent uploads
        const recentUploads = await File.find({ owner: req.user.id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        successResponse(res, 200, 'Storage stats fetched successfully', {
            storage: {
                used: user.storageUsed,
                quota: user.storageQuota,
                percentage: user.getStoragePercentage(),
                usedFormatted: formatFileSize(user.storageUsed),
                quotaFormatted: formatFileSize(user.storageQuota)
            },
            fileCount: files.length,
            categoryStats,
            recentUploads: recentUploads.map(f => ({
                id: f._id,
                name: f.originalName,
                size: formatFileSize(f.size),
                category: f.category,
                uploadedAt: f.createdAt
            }))
        });
    } catch (error) {
        console.error('Error in getStorageStats:', error);
        errorResponse(res, 500, 'Error fetching storage stats');
    }
};
