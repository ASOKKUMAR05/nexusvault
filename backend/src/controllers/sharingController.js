const Share = require('../models/Share.model');
const File = require('../models/File.model');
const User = require('../models/User.model');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * @desc    Share file with another user
 * @route   POST /api/sharing/share
 * @access  Private
 */
exports.shareFile = async (req, res) => {
    try {
        const { fileId, email, permission = 'view', expiresAt = null } = req.body;

        // Validate input
        if (!fileId || !email) {
            return errorResponse(res, 400, 'File ID and email are required');
        }

        // Check if file exists and user owns it
        const file = await File.findOne({ _id: fileId, owner: req.user.id });
        if (!file) {
            return errorResponse(res, 404, 'File not found or you do not have permission');
        }

        // Find user to share with
        const userToShareWith = await User.findOne({ email });
        if (!userToShareWith) {
            return errorResponse(res, 404, 'User not found');
        }

        // Check if already shared
        const existingShare = await Share.findOne({
            file: fileId,
            owner: req.user.id,
            sharedWith: userToShareWith._id,
            isActive: true
        });

        if (existingShare) {
            return errorResponse(res, 400, 'File already shared with this user');
        }

        // Create share record
        const share = await Share.create({
            file: fileId,
            owner: req.user.id,
            sharedWith: userToShareWith._id,
            permission,
            expiresAt: expiresAt ? new Date(expiresAt) : null
        });

        // Update file's sharedWith array
        file.sharedWith.push({
            user: userToShareWith._id,
            permission,
            sharedAt: new Date()
        });
        await file.save();

        successResponse(res, 201, 'File shared successfully', {
            share: {
                id: share._id,
                sharedWith: {
                    name: userToShareWith.name,
                    email: userToShareWith.email
                },
                permission: share.permission,
                expiresAt: share.expiresAt
            }
        });
    } catch (error) {
        console.error('Error in shareFile:', error);
        errorResponse(res, 500, 'Error sharing file');
    }
};

/**
 * @desc    Get files shared by user
 * @route   GET /api/sharing/shared-by-me
 * @access  Private
 */
exports.getSharedByMe = async (req, res) => {
    try {
        const shares = await Share.find({
            owner: req.user.id,
            isActive: true
        })
            .populate('file', 'filename originalName size mimeType category')
            .populate('sharedWith', 'name email')
            .sort({ createdAt: -1 });

        successResponse(res, 200, 'Shared files fetched successfully', {
            shares: shares.map(s => ({
                id: s._id,
                file: s.file,
                sharedWith: s.sharedWith,
                permission: s.permission,
                sharedAt: s.createdAt,
                expiresAt: s.expiresAt,
                accessCount: s.accessCount
            }))
        });
    } catch (error) {
        console.error('Error in getSharedByMe:', error);
        errorResponse(res, 500, 'Error fetching shared files');
    }
};

/**
 * @desc    Get files shared with user
 * @route   GET /api/sharing/shared-with-me
 * @access  Private
 */
exports.getSharedWithMe = async (req, res) => {
    try {
        const shares = await Share.find({
            sharedWith: req.user.id,
            isActive: true
        })
            .populate('file', 'filename originalName size mimeType category')
            .populate('owner', 'name email')
            .sort({ createdAt: -1 });

        successResponse(res, 200, 'Shared files fetched successfully', {
            shares: shares.map(s => ({
                id: s._id,
                file: s.file,
                owner: s.owner,
                permission: s.permission,
                sharedAt: s.createdAt,
                expiresAt: s.expiresAt
            }))
        });
    } catch (error) {
        console.error('Error in getSharedWithMe:', error);
        errorResponse(res, 500, 'Error fetching shared files');
    }
};

/**
 * @desc    Revoke file sharing
 * @route   DELETE /api/sharing/:shareId
 * @access  Private
 */
exports.revokeShare = async (req, res) => {
    try {
        const share = await Share.findOne({
            _id: req.params.shareId,
            owner: req.user.id
        });

        if (!share) {
            return errorResponse(res, 404, 'Share not found');
        }

        // Deactivate share
        share.isActive = false;
        await share.save();

        // Remove from file's sharedWith array
        const file = await File.findById(share.file);
        if (file) {
            file.sharedWith = file.sharedWith.filter(
                s => s.user.toString() !== share.sharedWith.toString()
            );
            await file.save();
        }

        successResponse(res, 200, 'Share revoked successfully');
    } catch (error) {
        console.error('Error in revokeShare:', error);
        errorResponse(res, 500, 'Error revoking share');
    }
};

/**
 * @desc    Update share permissions
 * @route   PUT /api/sharing/:shareId
 * @access  Private
 */
exports.updateSharePermission = async (req, res) => {
    try {
        const { permission } = req.body;

        if (!['view', 'edit', 'admin'].includes(permission)) {
            return errorResponse(res, 400, 'Invalid permission type');
        }

        const share = await Share.findOne({
            _id: req.params.shareId,
            owner: req.user.id
        });

        if (!share) {
            return errorResponse(res, 404, 'Share not found');
        }

        share.permission = permission;
        await share.save();

        // Update file's sharedWith array
        const file = await File.findById(share.file);
        if (file) {
            const sharedUser = file.sharedWith.find(
                s => s.user.toString() === share.sharedWith.toString()
            );
            if (sharedUser) {
                sharedUser.permission = permission;
                await file.save();
            }
        }

        successResponse(res, 200, 'Permission updated successfully', { share });
    } catch (error) {
        console.error('Error in updateSharePermission:', error);
        errorResponse(res, 500, 'Error updating permissions');
    }
};
