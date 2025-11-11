// PUBLISHERS RELATED CONTROLLERS
const getPublishersStats = (dbCollections) => {
    return async (req, res) => {
        try {
            const publishers = await dbCollections.publishersCollection.find().toArray();

            const publications = [];

            for (const publisher of publishers) {
                const count = await dbCollections.articlesCollection.countDocuments({
                    publisher: publisher.name,
                    status: 'approved'
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
    };
};

const getAllPublishers = (dbCollections) => {
    return async (req, res) => {
        try {
            const allPublishers = await dbCollections.publishersCollection.find().toArray();
            const totalCount = allPublishers.length;

            const recentPublishers = await dbCollections.publishersCollection
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
    };
};

const createPublisher = (dbCollections) => {
    return async (req, res) => {
        const publisher = req.body;
        try {
            const result = await dbCollections.publishersCollection.insertOne(publisher);
            res.status(201).json(result);
        } catch (err) {
            res.status(500).json({ message: 'Error saving publisher', error: err });
        }
    };
};

// This is the missing endpoint that the frontend is calling
const getPublishersWithArticles = (dbCollections) => {
    return async (req, res) => {
        try {
            const publishers = await dbCollections.publishersCollection.find().toArray();
            
            const publishersWithArticles = [];
            const matchedArticles = [];
            
            for (const publisher of publishers) {
                const articles = await dbCollections.articlesCollection
                    .find({ publisher: publisher.name, status: 'approved' })
                    .sort({ postedDate: -1 })
                    .limit(4)
                    .toArray();
                
                publishersWithArticles.push({
                    ...publisher,
                    articles
                });
                
                // Add the first article to matchedArticles for the frontend
                if (articles.length > 0) {
                    matchedArticles.push(articles[0]);
                } else {
                    // Add a default object to avoid undefined errors
                    matchedArticles.push({ title: 'No articles available' });
                }
            }
            
            res.send({ publishers: publishersWithArticles, matchedArticles });
        } catch (err) {
            console.error('❌ Error fetching publishers with articles:', err);
            res.status(500).send({ message: 'Internal Server Error' });
        }
    };
};

module.exports = {
    getPublishersStats,
    getAllPublishers,
    createPublisher,
    getPublishersWithArticles
};