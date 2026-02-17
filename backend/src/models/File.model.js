const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
        trim: true
    },
    originalName: {
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
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: ['Documents', 'Images', 'Videos', 'Audio', 'Archives', 'Code', 'Spreadsheets', 'Presentations', 'Other'],
        default: 'Other'
    },
    tags: [{
        type: String,
        trim: true
    }],
    description: {
        type: String,
        trim: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    sharedWith: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        permission: {
            type: String,
            enum: ['view', 'edit', 'admin'],
            default: 'view'
        },
        sharedAt: {
            type: Date,
            default: Date.now
        }
    }],
    versions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FileVersion'
    }],
    currentVersion: {
        type: Number,
        default: 1
    },
    thumbnail: {
        type: String,
        default: null
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now
    },
    contentHash: {
        type: String  // For duplicate detection (indexed via schema.index below)
    },
    aiProcessed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster searches
fileSchema.index({ owner: 1, filename: 1 });
fileSchema.index({ owner: 1, category: 1 });
fileSchema.index({ tags: 1 });
fileSchema.index({ contentHash: 1 });

// Virtual for file extension
fileSchema.virtual('extension').get(function () {
    return this.originalName.split('.').pop().toLowerCase();
});

module.exports = mongoose.model('File', fileSchema);
