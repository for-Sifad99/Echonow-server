const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

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

// Database connection function
const connectDB = async () => {
    try {
        // Connect the client to the server
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("✅ Connected to MongoDB!");
        return client;
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};

// Get database collections
const getCollections = (client) => {
    const db = client.db('articlesDB');
    return {
        articlesCollection: db.collection('articles'),
        usersCollection: db.collection('users'),
        publishersCollection: db.collection('publishers')
    };
};

module.exports = { connectDB, getCollections };