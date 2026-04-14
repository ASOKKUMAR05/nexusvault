const express = require('express');
const cors = require('cors');
const connectDatabase = require('./config/database');
const config = require('./config/config');

// Import routes
const authRoutes = require('./routes/auth.routes');
const filesRoutes = require('./routes/files.routes');
const sharingRoutes = require('./routes/sharing.routes');
const versionsRoutes = require('./routes/versions.routes');
require('dotenv').config({ path: __dirname + '/../.env' });
// Initialize app
const app = express();

// Connect to database
connectDatabase();

// Middleware

app.use(cors({
    origin: function (origin, callback) {
        if (
            !origin || // allow Postman / curl
            origin.includes("vercel.app") ||
            origin === "http://localhost:5173"
        ) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/sharing', sharingRoutes);
app.use('/api/versions', versionsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'NexusVault API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to NexusVault API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            files: '/api/files',
            sharing: '/api/sharing',
            versions: '/api/versions'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(config.nodeEnv === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
    console.log(`
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    // Close server & exit process
    process.exit(1);
});
