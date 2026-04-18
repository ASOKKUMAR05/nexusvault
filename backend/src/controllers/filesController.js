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
const { getCloudFrontSignedUrl } = require("../utils/cloudfront");
const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
// or wherever your S3 client is
const config = require('../config/config');

const s3 = new S3Client({
    region: "ap-south-1"
});

exports.getPresignedUploadUrl = async (req, res) => {
    try {
        const { fileType } = req.query;

        const fileName = `uploads/${Date.now()}-${Math.random()}`;

        const command = new PutObjectCommand({
            Bucket: "my-nexusvault",
            Key: fileName,
            ContentType: fileType
        });

        const uploadUrl = await getSignedUrl(s3, command, {
            expiresIn: 60
        });

        res.json({
            success: true,
            uploadUrl,
            fileUrl: `https://d2zyqkp9ae3018.cloudfront.net/${fileName}`,
            fileKey: fileName
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generating URL" });
    }
};
/**
 * @desc    Upload file
 * @route   POST /api/files/upload
 * @access  Private
 */
exports.uploadFile = async (req, res) => {
    try {
        const { url, name, type, key } = req.body;

        if (!url || !key || !name || !type) {
            return res.status(400).json({
                success: false,
                message: "Missing file data"
            });
        }

        const file = await File.create({
            filename: name,
            originalName: name,
            path: key,
            mimeType: type,
            owner: req.user.id,
            size: 0, // since S3 already has file
            category: "Other",
            tags: [],
            aiProcessed: false
        });

        res.status(201).json({
            success: true,
            data: file
        });

    } catch (error) {
        console.error("UPLOAD ERROR:", error); // 🔥 IMPORTANT
        res.status(500).json({
            success: false,
            message: "Upload failed"
        });
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

        // Update download count
        file.downloadCount += 1;
        file.lastAccessedAt = Date.now();
        await file.save();

        // 🔥 CloudFront Signed URL
        const signedUrl = getCloudFrontSignedUrl(file.path);

        successResponse(res, 200, 'Download URL generated', {
            downloadUrl: signedUrl
        });

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

        // 🔥 DELETE FROM S3
        const command = new DeleteObjectCommand({
            Bucket: config.aws.bucketName,
            Key: file.path
        });

        await s3.send(command);

        // Update user storage
        const user = await User.findById(req.user.id);
        user.storageUsed -= file.size;
        await user.save();

        // Delete DB record
        await File.findByIdAndDelete(req.params.id);

        successResponse(res, 200, 'File deleted successfully');

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
