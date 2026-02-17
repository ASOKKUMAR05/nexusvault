const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userDir = path.join(config.upload.uploadDir, req.user.id.toString());
        const fs = require('fs');

        // Create user directory if it doesn't exist
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }

        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Check file type
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('File type not supported'), false);
    }
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: config.upload.maxFileSize
    },
    fileFilter: fileFilter
});

// Error handling middleware for multer
exports.handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `File too large. Maximum size is ${config.upload.maxFileSize / (1024 * 1024)}MB`
            });
        }
        return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
        });
    } else if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
};

exports.upload = upload;
