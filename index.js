const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const admin = require("firebase-admin");


// Firebase Service Token Process
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8');
const serviceAccount = JSON.parse(decoded);

const app = express();
const port = process.env.PORT || 3000;

// Middleware:
app.use(cors());
app.use(express.json());

// Verify Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Verify Firebase Token
const verifyFbToken = async (req, res, next) => {
    const authHeader = req.headers?.authorization;
    console.log("Auth Header:", authHeader);
    const token = authHeader.split(' ')[1]; 

    if (!authHeader || !authHeader.startsWith('Bearer ') || !token) {
        return res.status(401).send({ message: 'Unauthorized access!!' })
    }
   
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.decoded = decoded;
        next();
    } catch (error) {
        return res.status(401).send({ message: 'Unauthorized access!!' })
    };
};

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

        // Create ArticlesCollection:
        const articlesCollection = client.db('articlesDB').collection('articles');
        const usersCollection = client.db('articlesDB').collection('users');

        // POST /users
        app.post("/users", async (req, res) => {
            try {
                const userProfile = req.body;

                // Check if user already exists
                const existingUser = await usersCollection.findOne({ email: userProfile.email });

                if (existingUser) {
                    return res.status(200).json({ message: "User already exists", user: existingUser });
                }

                // If user not found, insert new
                await usersCollection.insertOne({
                    ...userProfile,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                res.status(201).json({ message: "User created"});
            } catch (error) {
                console.error("Error creating/updating user:", error);
                res.status(500).json({ message: "Server error" });
            }
        });

         // POST /article
        app.post("/article", verifyFbToken, async (req, res) => {

            try {
                const article = req.body;

                // validation if user is normal & already posted
                const existing = await articlesCollection.findOne({
                    authorEmail: article.authorEmail,
                });

                const user = await usersCollection.findOne({
                    email: article.authorEmail,
                });

                if (user?.role !== "premium" && existing) {
                    return res.status(403).send({ message: "Normal user can only post one article" });
                }

                const result = await articlesCollection.insertOne(article);
                res.send({ insertedId: result.insertedId });
            } catch (error) {
                console.error("Article post error:", error.message);
                res.status(500).send({ error: "Internal server error" });
            }
        });

        // GET /articles
        app.get('/articles', async (req, res) => {
            try {
                const { search = '', publisher = '', tags = '', page = 1, limit = 6 } = req.query;

                const query = {
                    status: 'approved' // ✅ Only show approved articles
                };

                // Search by title
                if (search) {
                    query.title = { $regex: search, $options: 'i' };
                }

                // Filter by publisher
                if (publisher) {
                    query.publisher = publisher;
                }

                // Filter by tags (can be multiple comma-separated tags)
                if (tags) {
                    const tagArray = tags.split(',');
                    query.tags = { $in: tagArray };
                }

                const skip = (parseInt(page) - 1) * parseInt(limit);

                const articles = await articlesCollection.find(query)
                    .sort({ createdAt: -1 }) // latest first
                    .skip(skip)
                    .limit(parseInt(limit))
                    .toArray(); // Don't forget this for native driver

                const total = await articlesCollection.countDocuments(query);

                res.send({
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    articles
                });

            } catch (error) {
                console.error(error);
                res.status(500).send({ message: "Something went wrong while fetching articles" });
            }
        });

        app.get('/article/:id', async (req, res) => {
            try {
                const id = req.params.id;

                const article = await articlesCollection.findOne({ _id: new ObjectId(id) });

                if (!article) {
                    return res.status(404).send({ message: "Article not found" });
                }

                res.send(article);
            } catch (error) {
                console.error("GET article error:", error.message);
                res.status(500).send({ message: "Failed to fetch article" });
            }
        });

        app.patch('/article/:id/views', async (req, res) => {
            try {
                const id = req.params.id;

                const result = await articlesCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $inc: { viewCount: 1 } }
                );

                if (result.modifiedCount === 1) {
                    res.send({ message: "View count updated", viewCount: articleAfter.viewCount });
                } else {
                    res.status(404).send({ message: "Article not found" });
                }
            } catch (error) {
                console.error("PATCH viewCount error:", error.message);
                res.status(500).send({ message: "Failed to update view count" });
            }
        });
        
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("✅ Connected to MongoDB!");

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

