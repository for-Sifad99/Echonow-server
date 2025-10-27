const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB, getCollections } = require('./config/database');

// Initialize express app
const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get('/', (req, res) => {
    res.send('With hot day hot news is coming!');
});

// Connect to database and start server
const startServer = async () => {
    try {
        const client = await connectDB();
        const dbCollections = getCollections(client);

        // Import route handlers with database collections
        const userRouter = require('./routes/userRoutes');
        const articleRouter = require('./routes/articleRoutes');
        const publisherRouter = require('./routes/publisherRoutes');
        const paymentRouter = require('./routes/paymentRoutes');
        const emailVerificationRouter = require('./routes/emailVerificationRoutes');

        // Register routes
        app.use('/', userRouter(dbCollections));
        app.use('/', articleRouter(dbCollections));
        app.use('/', publisherRouter(dbCollections));
        app.use('/', paymentRouter());
        app.use('/', emailVerificationRouter(dbCollections));

        // Start server
        app.listen(port, () => {
            console.log(`🌏 Server is running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
