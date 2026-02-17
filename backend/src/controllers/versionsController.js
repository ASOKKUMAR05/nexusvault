const versioningService = require('../services/versioning/versioning.service');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * @desc    Get version history
 * @route   GET /api/versions/:fileId
 * @access  Private
 */
exports.getVersionHistory = async (req, res) => {
    try {
        const versions = await versioningService.getVersionHistory(
            req.params.fileId,
            req.user.id
        );

        successResponse(res, 200, 'Version history fetched successfully', {
            versions: versions.map(v => ({
                id: v._id,
                versionNumber: v.versionNumber,
                size: v.size,
                modifiedBy: v.modifiedBy,
                modifiedAt: v.createdAt,
                description: v.changeDescription
            }))
        });
    } catch (error) {
        console.error('Error in getVersionHistory:', error);
        errorResponse(res, 500, error.message || 'Error fetching version history');
    }
};

/**
 * @desc    Restore version
 * @route   POST /api/versions/:fileId/restore/:versionNumber
 * @access  Private
 */
exports.restoreVersion = async (req, res) => {
    try {
        const result = await versioningService.restoreVersion(
            req.params.fileId,
            parseInt(req.params.versionNumber),
            req.user.id
        );

        successResponse(res, 200, 'Version restored successfully', result);
    } catch (error) {
        console.error('Error in restoreVersion:', error);
        errorResponse(res, 500, error.message || 'Error restoring version');
    }
};

/**
 * @desc    Compare versions
 * @route   GET /api/versions/:fileId/compare/:version1/:version2
 * @access  Private
 */
exports.compareVersions = async (req, res) => {
    try {
        const comparison = await versioningService.compareVersions(
            req.params.fileId,
            parseInt(req.params.version1),
            parseInt(req.params.version2),
            req.user.id
        );

        successResponse(res, 200, 'Versions compared successfully', comparison);
    } catch (error) {
        console.error('Error in compareVersions:', error);
        errorResponse(res, 500, error.message || 'Error comparing versions');
    }
};
