const { ObjectId } = require('mongodb');
const admin = require('../config/firebase');

// ARTICLES RELATED CONTROLLERS
const createArticle = (dbCollections) => {
    return async (req, res) => {
        try {
            const article = req.body;

            // validation if user is normal & already posted
            const existing = await dbCollections.articlesCollection.findOne({
                authorEmail: article.authorEmail,
            });

            const user = await dbCollections.usersCollection.findOne({
                email: article.authorEmail,
            });

            if (user?.isPremium == false && existing) {
                return res.status(403).send({ message: "Normal user can only post one article" });
            }

            const result = await dbCollections.articlesCollection.insertOne(article);
            res.send({ insertedId: result.insertedId });
        } catch (error) {
            console.error("Article post error:", error.message);
            res.status(500).send({ error: "Internal server error" });
        }
    };
};

const getAllArticles = (dbCollections) => {
    return async (req, res) => {
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
            const articles = await dbCollections.articlesCollection.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .toArray();

            const total = await dbCollections.articlesCollection.countDocuments(query);

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
    };
};

const getUserArticles = (dbCollections) => {
    return async (req, res) => {
        const { email } = req.query;
        const userArticles = await dbCollections.articlesCollection.find({ authorEmail: email }).toArray();
        res.send(userArticles);
    };
};

const getPremiumArticles = (dbCollections) => {
    return async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 6;
            const skip = (page - 1) * limit;

            const query = { isPremium: true };
            const total = await dbCollections.articlesCollection.countDocuments(query);
            const articles = await dbCollections.articlesCollection
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
    };
};

const getAllArticlesAdmin = (dbCollections) => {
    return async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const total = await dbCollections.articlesCollection.countDocuments();
            
            // fetch articles with pagination
            const articles = await dbCollections.articlesCollection
                .find()
                .skip(skip)
                .limit(limit)
                .toArray();

            // Custom sort by status
            const statusOrder = { pending: 1, approved: 2, declined: 3 };

            const sortedArticles = articles.sort((a, b) => {
                return statusOrder[a.status] - statusOrder[b.status];
            });

            res.send({ 
                total, 
                allArticles: sortedArticles,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            });
        } catch (error) {
            console.error("Error:", error);
            res.status(500).send({ message: "Failed to fetch" });
        }
    };
};

const getArticleById = (dbCollections) => {
    return async (req, res) => {
        try {
            const id = req.params.id;

            const article = await dbCollections.articlesCollection.findOne({ _id: new ObjectId(id) });

            if (!article) {
                return res.status(404).send({ message: "Article not found" });
            }

            // If it's a premium article, verify the user has access
            if (article.isPremium) {
                const authHeader = req.headers?.authorization;
                const token = authHeader?.split(' ')[1];
                
                if (!authHeader || !authHeader.startsWith('Bearer ') || !token) {
                    return res.status(401).send({ message: "Unauthorized access to premium article" });
                }
                
                try {
                    // Verify the token
                    await admin.auth().verifyIdToken(token);
                } catch (error) {
                    return res.status(401).send({ message: "Invalid token for premium article" });
                }
            }

            res.send(article);
        } catch (error) {
            console.error("GET article error:", error.message);
            res.status(500).send({ message: "Failed to fetch article" });
        }
    };
};

const updateArticleViews = (dbCollections) => {
    return async (req, res) => {
        try {
            const id = req.params.id;

            const result = await dbCollections.articlesCollection.updateOne(
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
    };
};

const getTrendingArticles = (dbCollections) => {
    return async (req, res) => {
        try {
            const trendingArticles = await dbCollections.articlesCollection
                .find({
                    status: 'approved', 
                    type: 'trending'
                })
                .sort({ postedDate: -1 })
                .limit(4)
                .toArray();

            res.send(trendingArticles);
        } catch (error) {
            res.status(500).send({ message: 'Failed to fetch trending articles', error });
        }
    };
};

const getBannerTrendingArticles = (dbCollections) => {
    return async (req, res) => {
        try {
            const bannerTrendingArticles = await dbCollections.articlesCollection
                .find({
                    status: 'approved', 
                    type: 'trending'
                })
                .sort({ postedDate: -1 })
                .toArray();

            res.send({ hot: bannerTrendingArticles });
        } catch (error) {
            res.status(500).send({ message: 'Failed to fetch banner trending articles', error });
        }
    };
};

const getSpecialArticles = (dbCollections) => {
    return async (req, res) => {
        try {
            // Get special/hot articles
            const hotArticles = await dbCollections.articlesCollection
                .find({ 
                    status: 'approved', 
                    type: { $in: ['hot', 'trending'] }
                })
                .sort({ postedDate: -1 })
                .limit(10)
                .toArray();

            res.send({ hot: hotArticles });
        } catch (error) {
            console.error('❌ Error fetching special articles:', error);
            res.status(500).send({ message: 'Failed to fetch special articles' });
        }
    };
};

const getTopFashionArticles = (dbCollections) => {
    return async (req, res) => {
        try {
            // Get top fashion articles
            const topFashion = await dbCollections.articlesCollection
                .find({ 
                    status: 'approved', 
                    tags: { $in: ['fashion'] } 
                })
                .sort({ postedDate: -1 })
                .limit(10)
                .toArray();

            res.send(topFashion);
        } catch (error) {
            console.error('❌ Error fetching top fashion articles:', error);
            res.status(500).send({ message: 'Failed to fetch top fashion articles' });
        }
    };
};

const updateArticle = (dbCollections) => {
    return async (req, res) => {
        const { id } = req.params;
        const updatedArticle = req.body;

        try {
            const result = await dbCollections.articlesCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedArticle }
            );
            res.status(200).send({ message: 'Article updated successfully', result });
        } catch (err) {
            console.error('❌ Update error:', err);
            res.status(500).send({ message: 'Failed to update article' });
        }
    };
};

const deleteArticle = (dbCollections) => {
    return async (req, res) => {
        const { id } = req.params;

        try {
            const result = await dbCollections.articlesCollection.deleteOne({ _id: new ObjectId(id) });
            res.status(200).json({ message: 'Article deleted successfully', result });
        } catch (err) {
            console.error('❌ Delete error:', err);
            res.status(500).json({ message: 'Failed to delete article' });
        }
    };
};

module.exports = {
    createArticle,
    getAllArticles,
    getUserArticles,
    getPremiumArticles,
    getAllArticlesAdmin,
    getArticleById,
    updateArticleViews,
    getTrendingArticles,
    getSpecialArticles,
    getTopFashionArticles,
    getBannerTrendingArticles,
    updateArticle,
    deleteArticle
};