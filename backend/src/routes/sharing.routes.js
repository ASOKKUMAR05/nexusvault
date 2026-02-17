const express = require('express');
const router = express.Router();
const sharingController = require('../controllers/sharingController');
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

router.post('/share', sharingController.shareFile);
router.get('/shared-by-me', sharingController.getSharedByMe);
router.get('/shared-with-me', sharingController.getSharedWithMe);
router.put('/:shareId', sharingController.updateSharePermission);
router.delete('/:shareId', sharingController.revokeShare);

module.exports = router;
