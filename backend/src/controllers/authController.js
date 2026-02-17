const User = require('../models/User.model');
const { generateToken } = require('../middleware/auth.middleware');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return errorResponse(res, 400, 'Please provide all required fields');
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return errorResponse(res, 400, 'User already exists with this email');
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password
        });

        // Generate token
        const token = generateToken(user._id);

        successResponse(res, 201, 'User registered successfully', {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                storageQuota: user.storageQuota,
                storageUsed: user.storageUsed
            }
        });
    } catch (error) {
        console.error('Error in register:', error);
        console.error('Error stack:', error.stack);
        errorResponse(res, 500, error.message || 'Error registering user');
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return errorResponse(res, 400, 'Please provide email and password');
        }

        // Check for user (include password)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return errorResponse(res, 401, 'Invalid credentials');
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return errorResponse(res, 401, 'Invalid credentials');
        }

        // Generate token
        const token = generateToken(user._id);

        successResponse(res, 200, 'Login successful', {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                storageQuota: user.storageQuota,
                storageUsed: user.storageUsed,
                storagePercentage: user.getStoragePercentage()
            }
        });
    } catch (error) {
        console.error('Error in login:', error);
        errorResponse(res, 500, 'Error logging in');
    }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        successResponse(res, 200, 'Profile fetched successfully', {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                storageQuota: user.storageQuota,
                storageUsed: user.storageUsed,
                storagePercentage: user.getStoragePercentage(),
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Error in getProfile:', error);
        errorResponse(res, 500, 'Error fetching profile');
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
    try {
        const { name, avatar } = req.body;

        const user = await User.findById(req.user.id);

        if (name) user.name = name;
        if (avatar) user.avatar = avatar;

        await user.save();

        successResponse(res, 200, 'Profile updated successfully', {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Error in updateProfile:', error);
        errorResponse(res, 500, 'Error updating profile');
    }
};
