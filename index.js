const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const admin = require("./config/firebase");
const stripe = require('stripe')(process.env.PAYMENT_GETWAY_KEY);
const { verifyFbToken } = require('./middleware/auth');
const { verifyAdmin: verifyAdminMiddleware } = require('./middleware/admin');



const app = express();
const port = process.env.PORT || 5000;

// Middleware:
// Configure CORS
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

// Apply CORS middleware globally
app.use(cors(corsOptions));

app.use(express.json());

// Home route:
app.get('/', (req, res) => {
    res.send('With hot day hot news🌏 is coming!');
});

// URI:
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q1etiuc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version:
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // CollectionS:
        const articlesCollection = client.db('articlesDB').collection('articles');
        const usersCollection = client.db('articlesDB').collection('users');
        const publishersCollection = client.db('articlesDB').collection('publishers');

        // Create database collections object to pass to routers
        const dbCollections = {
            articlesCollection,
            usersCollection,
            publishersCollection
        };

        // Create verifyAdmin middleware with dbCollections
        const verifyAdmin = verifyAdminMiddleware(dbCollections);

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("✅ Connected to MongoDB!");

        // Import and use article routes
        const articleRouter = require('./routes/articleRoutes');
        app.use('/api', articleRouter(dbCollections));
        
        // Import and use user routes
        const userRouter = require('./routes/userRoutes');
        app.use('/api', userRouter(dbCollections));
        
        // Import and use publisher routes
        const publisherRouter = require('./routes/publisherRoutes');
        app.use('/api', publisherRouter(dbCollections));
        
        // Import and use email verification routes
        const emailVerificationRouter = require('./routes/emailVerificationRoutes');
        app.use('/api', emailVerificationRouter(dbCollections));

        // Import and use payment routes
        const paymentRouter = require('./routes/paymentRoutes');
        app.use('/api', paymentRouter(dbCollections));

        // Start server
        app.listen(port, () => {
            console.log(`🌏 Server is running on http://localhost:${port}`);
        });

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    };
}
run().catch(console.dir);

