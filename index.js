const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const admin = require("firebase-admin");
const stripe = require('stripe')(process.env.PAYMENT_GETWAY_KEY);


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

        // CollectionS:
        const articlesCollection = client.db('articlesDB').collection('articles');
        const usersCollection = client.db('articlesDB').collection('users');
        const publishersCollection = client.db('articlesDB').collection('publishers');


        // USERS RELATED APIS
        // POST /users
        app.post("/users", async (req, res) => {
            try {
                const userProfile = req.body;
                const { name, photo, email, premiumTaken, duration } = userProfile;

                if (!email) return res.status(400).json({ message: "Email is required" });

                const existingUser = await usersCollection.findOne({ email });

                if (existingUser) {
                    // Check if premium expired
                    const now = new Date();
                    const expiry = existingUser.premiumExpiresAt;

                    const isExpired = expiry && new Date(expiry) < now;

                    const updateFields = {
                        updatedAt: now,
                        ...(isExpired
                            ? { isPremium: false, premiumTaken: null, premiumExpiresAt: null }
                            : {}),
                        ...(premiumTaken && duration
                            ? (() => {
                                const durationMap = {
                                    "1": 1,
                                    "5": 5 * 24 * 60,
                                    "10": 10 * 24 * 60,
                                };
                                const expiryMinutes = durationMap[duration] || 0;
                                const takenTime = new Date(premiumTaken);
                                const expiresAt = new Date(takenTime.getTime() + expiryMinutes * 60000);

                                return {
                                    premiumTaken: takenTime,
                                    premiumExpiresAt: expiresAt,
                                    isPremium: true,
                                };
                            })()
                            : {}),
                    };

                    await usersCollection.updateOne({ email }, { $set: updateFields });
                    return res.status(200).json({ message: "User updated" });
                }

                // New user insert
                await usersCollection.insertOne({
                    ...userProfile,
                    name, email, photo,
                    isPremium: false,
                    premiumTaken: null,
                    premiumExpiresAt: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                res.status(201).json({ message: "User created" });
            } catch (error) {
                console.error("❌ Error in /users route:", error);
                res.status(500).json({ message: "Server error" });
            }
        });

        // GET /users/:email
        app.get('/users/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const user = await usersCollection.findOne({ email });

                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }

                res.status(200).json(user);
            } catch (error) {
                console.error("❌ Error fetching user:", error);
                res.status(500).json({ message: "Server error" });
            }
        });

        // GET /all-users
        app.get('/all-users', async (req, res) => {
            try {
                const totalUsers = await usersCollection.countDocuments();
                const premiumUsers = await usersCollection.countDocuments({ isPremium: true });
                const allUsers = await usersCollection.find().toArray();

                res.send({
                    totalUsers,
                    premiumUsers,
                    allUsers,
                });
            } catch (error) {
                console.error("Error getting all users:", error);
                res.status(500).send({ message: "Failed to fetch all users" });
            }
        });

        // PATCH /users/:email
        app.patch("/users/:email", async (req, res) => {
            const email = req.params.email;
            const updatedFields = req.body;

            const result = await usersCollection.updateOne(
                { email },
                { $set: { ...updatedFields, updatedAt: new Date() } }
            );

            res.status(200).json(result);
        });

        // PATCH /users/admin:email
        app.patch('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        // DELETE /users/:email
        app.delete("/users/:email", async (req, res) => {
            const email = req.params.email;

            try {
                const result = await usersCollection.deleteOne({ email: email });

                if (result.deletedCount === 0) {
                    return res.status(404).json({ message: "User not found" });
                }

                res.json({ message: "User deleted successfully" });
            } catch (error) {
                console.error("Delete user error:", error);
                res.status(500).json({ message: "Server error" });
            }
        });

        // ARTICLES RELATED APIS
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

                if (user?.isPremium == false && existing) {
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
                    status: 'approved',
                };

                if (search) {
                    query.title = { $regex: search, $options: 'i' };
                }

                if (publisher) {
                    query.publisher = publisher;
                }

                if (tags) {
                    const tagArray = tags.split(',');
                    query.tags = { $in: tagArray };
                }

                const skip = (parseInt(page) - 1) * parseInt(limit);
                const articles = await articlesCollection.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .toArray();

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

        // GET /articles/user
        app.get('/articles/user', async (req, res) => {
            const { email } = req.query;
            const userArticles = await articlesCollection.find({ authorEmail: email }).toArray();
            res.send(userArticles);
        });

        // GET /articles/premium
        app.get('/articles/premium', verifyFbToken, async (req, res) => {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 6;
                const skip = (page - 1) * limit;

                const query = { isPremium: true };
                const total = await articlesCollection.countDocuments(query);
                const articles = await articlesCollection
                    .find(query)
                    .skip(skip)
                    .limit(limit)
                    .toArray();

                res.send({
                    articles,
                    totalPages: Math.ceil(total / limit),
                });
            } catch (err) {
                console.error('❌ Error fetching premium articles:', err);
                res.status(500).send({ error: 'Failed to load premium articles' });
            }
        });

        // GET /all-articles
        app.get('/all-articles', async (req, res) => {
            try {
                const total = await articlesCollection.countDocuments({ status: 'approved' });

                // fetch all articles
                const articles = await articlesCollection.find().toArray();

                // Custom sort by status
                const statusOrder = { pending: 1, approved: 2, declined: 3 };

                const sortedArticles = articles.sort((a, b) => {
                    return statusOrder[a.status] - statusOrder[b.status];
                });

                res.send({ total, allArticles: sortedArticles });
            } catch (error) {
                console.error("Error:", error);
                res.status(500).send({ message: "Failed to fetch" });
            }
        });

        // GET /articles/:id
        app.get('/article/:id', verifyFbToken, async (req, res) => {
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

        // GET /article/:id/views
        app.patch('/article/:id/views', verifyFbToken, async (req, res) => {
            try {
                const id = req.params.id;

                const result = await articlesCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $inc: { viewCount: 1 } }
                );

                if (result.modifiedCount === 1) {
                    res.send({ message: "View count updated", viewCount: result.viewCount });
                } else {
                    res.status(404).send({ message: "Article not found" });
                }
            } catch (error) {
                console.error("PATCH viewCount error:", error.message);
                res.status(500).send({ message: "Failed to update view count" });
            }
        });

        // GET /articles/tending
        app.get('/articles/trending', async (req, res) => {
            try {
                const trendingArticles = await articlesCollection
                    .find({
                        status: 'approved', type
                            : 'tending'
                    })
                    .sort({ postedDate: -1 }) // Sort by latest
                    .limit(4)
                    .toArray();

                res.send(trendingArticles);
            } catch (error) {
                res.status(500).send({ message: 'Failed to fetch trending articles', error });
            }
        });

        // PATCH /article
        app.patch('/articles/:id', verifyFbToken, async (req, res) => {
            const { id } = req.params;
            const updatedArticle = req.body;

            try {
                const result = await articlesCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updatedArticle }
                );
                res.status(200).send({ message: 'Article updated successfully', result });
            } catch (err) {
                console.error('❌ Update error:', err);
                res.status(500).send({ message: 'Failed to update article' });
            }
        });

        // DELETE /article
        app.delete('/articles/:id', verifyFbToken, async (req, res) => {
            const { id } = req.params;

            try {
                const result = await articlesCollection.deleteOne({ _id: new ObjectId(id) });
                res.status(200).json({ message: 'Article deleted successfully', result });
            } catch (err) {
                console.error('❌ Delete error:', err);
                res.status(500).json({ message: 'Failed to delete article' });
            }
        });

        // PUBLISHERS RELATED APIS
        // GET /publisher-stats
        app.get('/publication-stats', async (req, res) => {
            try {
                const publishers = await publishersCollection.find().toArray();

                const publications = [];

                for (const publisher of publishers) {
                    const count = await articlesCollection.countDocuments({
                        publisher: publisher.name,
                        isApproved: true
                    });

                    publications.push({
                        name: publisher.name,
                        arts: count
                    });
                }

                res.send(publications);
            } catch (err) {
                console.error('❌ Error fetching publication stats:', err);
                res.status(500).send({ message: 'Internal Server Error' });
            }
        });

        // GET /publisher
        app.get('/publisher', async (req, res) => {
            try {
                const allPublishers = await publishersCollection.find().toArray();
                const totalCount = allPublishers.length;

                const recentPublishers = await publishersCollection
                    .find()
                    .sort({ postedDate: -1 })
                    .limit(3)
                    .toArray();

                res.send({
                    count: totalCount,
                    recent: recentPublishers,
                    all: allPublishers
                });
            } catch (error) {
                console.error('Error getting publishers:', error);
                res.status(500).send({ message: 'Server error' });
            }
        });

        // POST /publisher
        app.post('/publisher', async (req, res) => {
            const publisher = req.body;
            try {
                const result = await publishersCollection.insertOne(publisher);
                res.status(201).json(result);
            } catch (err) {
                res.status(500).json({ message: 'Error saving publisher', error: err });
            }
        });

        // PAYMENT RELATED APIS
        // POST /create-payment-intent
        app.post('/create-payment-intent', verifyFbToken, async (req, res) => {
            const { cost } = req.body;
            console.log('🧾 Creating payment intent for:', cost);

            if (!cost) {
                return res.status(400).json({ error: 'Cost is required' });
            };

            try {
                const amount = parseInt(cost * 100);

                const paymentIntent = await stripe.paymentIntents.create({
                    amount,
                    currency: 'usd',
                    payment_method_types: ['card'],
                });

                res.send({ clientSecret: paymentIntent.client_secret });
            } catch (error) {
                console.error('❌ Stripe error:', error);
                res.status(500).json({ error: error.message });
            };
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

