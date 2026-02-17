const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
    file: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sharedWith: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    permission: {
        type: String,
        enum: ['view', 'edit', 'admin'],
        default: 'view'
    },
    expiresAt: {
        type: Date,
        default: null
    },
    accessCount: {
        type: Number,
        default: 0
    },
    lastAccessedAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster lookups
shareSchema.index({ file: 1, sharedWith: 1 });
shareSchema.index({ owner: 1 });

module.exports = mongoose.model('Share', shareSchema);
