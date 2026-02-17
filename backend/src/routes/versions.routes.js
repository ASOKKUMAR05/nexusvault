const express = require('express');
const router = express.Router();
const versionsController = require('../controllers/versionsController');
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

router.get('/:fileId', versionsController.getVersionHistory);
router.post('/:fileId/restore/:versionNumber', versionsController.restoreVersion);
router.get('/:fileId/compare/:version1/:version2', versionsController.compareVersions);

module.exports = router;
