const express = require('express');
const { verifyFbToken } = require('../middleware/auth');
const { verifyAdmin } = require('../middleware/admin');
const {
    getPublishersStats,
    getAllPublishers,
    createPublisher,
    getPublishersWithArticles
} = require('../controllers/publisherController');

const publisherRouter = (dbCollections) => {
    const router = express.Router();

    // GET /publishers-stats
    router.get('/publishers-stats', getPublishersStats(dbCollections));

    // GET /publisher ***
    router.get('/publisher', verifyFbToken, verifyAdmin(dbCollections), getAllPublishers(dbCollections));

    // POST /publisher ***
    router.post('/publisher', verifyFbToken, verifyAdmin(dbCollections), createPublisher(dbCollections));
    
    // GET /publisher-with-articles (this is what the frontend is calling)
    router.get('/publisher-with-articles', getPublishersWithArticles(dbCollections));

    return router;
};

module.exports = publisherRouter;