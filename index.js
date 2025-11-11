// Vercel Express app - routes must be defined at module load time

const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001;

// Check if we're in Vercel environment
const isVercel = !!process.env.VERCEL;

// Middleware:
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://echonow.netlify.app',
    'https://echonow-server.vercel.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  exposedHeaders: ['Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Root route
app.get('/', (req, res) => {
  res.send('With hot day hot news🌏 is coming!');
});

// Health check endpoint with env info
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: {
      PORT: process.env.PORT,
      DB_USER: process.env.DB_USER ? "SET" : "NOT SET",
      PAYMENT_GETWAY_KEY: process.env.PAYMENT_GETWAY_KEY ? "SET" : "NOT SET",
      FB_SERVICE_KEY: process.env.FB_SERVICE_KEY ? "SET" : "NOT SET",
      VERCEL: process.env.VERCEL ? "YES" : "NO",
      NODE_ENV: process.env.NODE_ENV
    }
  });
});

// Test endpoint to check environment variables
app.get('/api/test-env', (req, res) => {
  const envVars = {
    DB_USER: process.env.DB_USER,
    DB_PASS: process.env.DB_PASS ? "***HIDDEN***" : "NOT SET",
    PAYMENT_GETWAY_KEY: process.env.PAYMENT_GETWAY_KEY ? "***HIDDEN***" : "NOT SET",
    FB_SERVICE_KEY: process.env.FB_SERVICE_KEY ? "***HIDDEN***" : "NOT SET",
    VERCEL: process.env.VERCEL,
    NODE_ENV: process.env.NODE_ENV
  };
  
  res.status(200).json({ 
    message: 'Environment variables check',
    env: envVars
  });
});

// MongoDB connection
let uri;
try {
  if (process.env.DB_USER && process.env.DB_PASS) {
    uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q1etiuc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
  } else {
    console.error("❌ Missing DB_USER or DB_PASS environment variables");
    uri = null;
  }
} catch (error) {
  console.error("❌ Error constructing MongoDB URI:", error);
  uri = null;
}

// Global variables for connection caching
let cachedClient = null;
let cachedDbCollections = null;

// Function to connect to database with proper caching
async function connectToDatabase() {
  // Return cached collections if available
  if (cachedDbCollections) {
    return cachedDbCollections;
  }

  try {
    // Validate environment variables
    if (!process.env.DB_USER || !process.env.DB_PASS) {
      const error = new Error("Missing database credentials in environment variables");
      error.code = "MISSING_DB_CREDENTIALS";
      throw error;
    }
    
    if (!uri) {
      const error = new Error("MongoDB URI is invalid");
      error.code = "INVALID_MONGODB_URI";
      throw error;
    }
    
    // Create new client if needed
    if (!cachedClient) {
      cachedClient = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        maxPoolSize: 10, // Limit pool size for serverless
        serverSelectionTimeoutMS: 5000, // Timeout after 5s
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      });
    }

    // Connect to MongoDB
    await cachedClient.connect();
    
    // Ping to confirm connection
    await cachedClient.db("admin").command({ ping: 1 });
    
    // Create collections object
    const db = cachedClient.db('articlesDB');
    cachedDbCollections = {
      articlesCollection: db.collection('articles'),
      usersCollection: db.collection('users'),
      publishersCollection: db.collection('publishers')
    };
    
    return cachedDbCollections;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Clear cached client on error to allow retry
    cachedClient = null;
    cachedDbCollections = null;
    
    throw error;
  }
}

// Import middleware
const { verifyFbToken } = require('./middleware/auth');
const { verifyAdmin: verifyAdminMiddleware } = require('./middleware/admin');

// Import all controllers
const { 
  createArticle,
  getAllArticles,
  getUserArticles,
  getPremiumArticles,
  getAllArticlesAdmin,
  getArticleById,
  updateArticleViews,
  getSpecialArticles,
  getTopFashionArticles,
  getBannerTrendingArticles,
  updateArticle,
  deleteArticle
} = require('./controllers/articleController');

const {
  getAllUsers,
  getUserByEmail,
  createUser,
  updateUser,
  makeAdmin,
  getUserRole
} = require('./controllers/userController');

const {
  getPublishersStats,
  getAllPublishers,
  createPublisher,
  getPublishersWithArticles
} = require('./controllers/publisherController');

const {
  createPaymentIntent
} = require('./controllers/paymentController');

const {
  requestOTP,
  verifyOTP,
  checkVerificationStatus
} = require('./controllers/emailVerificationController');

// Import all route files
const articleRouter = require('./routes/articleRoutes');
const userRouter = require('./routes/userRoutes');
const publisherRouter = require('./routes/publisherRoutes');
const paymentRouter = require('./routes/paymentRoutes');
const emailVerificationRouter = require('./routes/emailVerificationRoutes');

// Create a simple in-memory cache for database collections
let dbCollectionsCache = null;

// Middleware to ensure database connection
async function ensureDbConnection(req, res, next) {
  try {
    if (!dbCollectionsCache) {
      dbCollectionsCache = await connectToDatabase();
    }
    req.dbCollections = dbCollectionsCache;
    next();
  } catch (error) {
    console.error("❌ Database connection middleware error:", error);
    res.status(500).json({ 
      error: 'Database connection failed',
      message: error.message,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Apply database connection middleware to all API routes
app.use('/api', ensureDbConnection);

// Mount all route files at module load time for Vercel compatibility
app.use('/api/articles', articleRouter(null));
app.use('/api/users', userRouter(null));
app.use('/api/publishers', publisherRouter(null));
app.use('/api/payments', paymentRouter());
app.use('/api/email', emailVerificationRouter(null));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Global error:", err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Now define all routes explicitly (this is what Vercel needs)
// Article routes
app.post("/api/article", verifyFbToken, (req, res, next) => {
  createArticle(req.dbCollections)(req, res, next);
});

app.get('/api/articles', (req, res, next) => {
  getAllArticles(req.dbCollections)(req, res, next);
});

app.get('/api/articles/user', (req, res, next) => {
  getUserArticles(req.dbCollections)(req, res, next);
});

app.get('/api/articles/premium', verifyFbToken, (req, res, next) => {
  getPremiumArticles(req.dbCollections)(req, res, next);
});

app.get('/api/all-articles', verifyFbToken, (req, res, next) => {
  const verifyAdmin = verifyAdminMiddleware(req.dbCollections);
  verifyAdmin(req, res, async () => {
    getAllArticlesAdmin(req.dbCollections)(req, res, next);
  });
});

app.get('/api/article/:id', (req, res, next) => {
  getArticleById(req.dbCollections)(req, res, next);
});

app.patch('/api/article/:id/views', (req, res, next) => {
  updateArticleViews(req.dbCollections)(req, res, next);
});

app.get('/api/articles/special', (req, res, next) => {
  getSpecialArticles(req.dbCollections)(req, res, next);
});

app.get('/api/articles/top-fashion', (req, res, next) => {
  getTopFashionArticles(req.dbCollections)(req, res, next);
});

app.get('/api/articles/banner-trending', (req, res, next) => {
  getBannerTrendingArticles(req.dbCollections)(req, res, next);
});

app.patch('/api/articles/:id', verifyFbToken, (req, res, next) => {
  const verifyAdmin = verifyAdminMiddleware(req.dbCollections);
  verifyAdmin(req, res, async () => {
    updateArticle(req.dbCollections)(req, res, next);
  });
});

app.delete('/api/articles/:id', verifyFbToken, (req, res, next) => {
  const verifyAdmin = verifyAdminMiddleware(req.dbCollections);
  verifyAdmin(req, res, async () => {
    deleteArticle(req.dbCollections)(req, res, next);
  });
});

// User routes
app.post("/api/users", verifyFbToken, (req, res, next) => {
  createUser(req.dbCollections)(req, res, next);
});

app.get('/api/users/:email', (req, res, next) => {
  getUserByEmail(req.dbCollections)(req, res, next);
});

app.get('/api/all-users', verifyFbToken, (req, res, next) => {
  const verifyAdmin = verifyAdminMiddleware(req.dbCollections);
  verifyAdmin(req, res, async () => {
    getAllUsers(req.dbCollections)(req, res, next);
  });
});

app.get('/api/users-count-info', (req, res, next) => {
  getAllUsers(req.dbCollections)(req, res, next);
});

app.patch("/api/users/:email", verifyFbToken, (req, res, next) => {
  updateUser(req.dbCollections)(req, res, next);
});

app.patch('/api/users/admin/:email', verifyFbToken, (req, res, next) => {
  const verifyAdmin = verifyAdminMiddleware(req.dbCollections);
  verifyAdmin(req, res, async () => {
    makeAdmin(req.dbCollections)(req, res, next);
  });
});

app.post('/api/get-role', (req, res, next) => {
  getUserRole(req.dbCollections)(req, res, next);
});

// Publisher routes
app.get('/api/publishers-stats', (req, res, next) => {
  getPublishersStats(req.dbCollections)(req, res, next);
});

app.get('/api/publisher', verifyFbToken, (req, res, next) => {
  const verifyAdmin = verifyAdminMiddleware(req.dbCollections);
  verifyAdmin(req, res, async () => {
    getAllPublishers(req.dbCollections)(req, res, next);
  });
});

app.post('/api/publisher', verifyFbToken, (req, res, next) => {
  const verifyAdmin = verifyAdminMiddleware(req.dbCollections);
  verifyAdmin(req, res, async () => {
    createPublisher(req.dbCollections)(req, res, next);
  });
});

// This is the endpoint the frontend is calling
app.get('/api/publisher-with-articles', (req, res, next) => {
  getPublishersWithArticles(req.dbCollections)(req, res, next);
});

// Payment routes
app.post('/api/create-payment-intent', verifyFbToken, (req, res, next) => {
  createPaymentIntent()(req, res, next);
});

// Email verification routes
app.post('/api/request-otp', verifyFbToken, (req, res, next) => {
  requestOTP(req.dbCollections)(req, res, next);
});

app.post('/api/verify-otp', verifyFbToken, (req, res, next) => {
  verifyOTP(req.dbCollections)(req, res, next);
});

app.get('/api/verification-status/:email', (req, res, next) => {
  checkVerificationStatus(req.dbCollections)(req, res, next);
});

// 404 handler
app.use((req, res) => {
  if (req.url.startsWith('/api')) {
    res.status(404).json({ 
      error: 'API endpoint not found',
      method: req.method,
      url: req.originalUrl
    });
  } else {
    res.status(404).send('Page not found');
  }
});

// ✅ For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, '0.0.0.0', () => {
    console.log(`🌏 Server running locally at http://localhost:${port}`);
  });
}



// ✅ Export for Vercel serverless environment
module.exports = app;
