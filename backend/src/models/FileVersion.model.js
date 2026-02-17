const mongoose = require('mongoose');

const fileVersionSchema = new mongoose.Schema({
    file: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true
    },
    versionNumber: {
        type: Number,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    modifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    changeDescription: {
        type: String,
        trim: true
    },
    contentHash: {
        type: String
    }
}, {
    timestamps: true
});

// Index for version lookup
fileVersionSchema.index({ file: 1, versionNumber: 1 });

module.exports = mongoose.model('FileVersion', fileVersionSchema);
