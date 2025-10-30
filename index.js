import express from 'express';
import { SERVER_CONFIG, validateConfig, logConfigStatus } from './src/config/index.js';
import { initMongo } from './src/database/connection.js';
import routes from './src/routes/index.js';
import { errorHandler, requestLogger } from './src/middleware/index.js';

// Initialize Express app
const app = express();

// Add middleware to parse incoming POST and JSON data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(requestLogger);

// Use routes
app.use(routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
    console.log(`=== SERVER STARTING ===`);
    console.log(`Port: ${SERVER_CONFIG.port}`);
    console.log(`Base URL: ${SERVER_CONFIG.baseUrl}`);
    
    // Validate configuration
    if (!validateConfig()) {
        console.error('❌ CRITICAL: Required environment variables are missing! Server will not start.');
        process.exit(1);
    }
    
    logConfigStatus();
    
    try {
        await initMongo();
        console.log('✅ Database initialization completed');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    }
    
    app.listen(SERVER_CONFIG.port, () => {
        console.log(`✅ Server running successfully on port ${SERVER_CONFIG.port}`);
        console.log(`Dashboard available at: ${SERVER_CONFIG.baseUrl}/dashboard`);
        console.log(`Health check at: ${SERVER_CONFIG.baseUrl}/health`);
        console.log(`=== SERVER READY ===`);
    });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});