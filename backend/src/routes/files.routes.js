const express = require('express');
const router = express.Router();
const filesController = require('../controllers/filesController');
const { protect } = require('../middleware/auth.middleware');
const { upload, handleMulterError } = require('../middleware/upload.middleware');
const { getPresignedUploadUrl } = require('../controllers/filesController');
// All routes are protected
router.use(protect);

// File operations


router.get('/presigned-upload', getPresignedUploadUrl);
router.post('/upload', upload.single('file'), handleMulterError, filesController.uploadFile);
router.get('/', filesController.getFiles);
router.get('/stats', filesController.getStorageStats);
router.get('/search', filesController.searchFiles);
router.get('/duplicates', filesController.getDuplicates);
router.get('/:id', filesController.getFileById);
router.get('/:id/download', filesController.downloadFile);
router.delete('/:id', filesController.deleteFile);
router.get('/presigned-upload', getPresignedUploadUrl);

module.exports = router;
