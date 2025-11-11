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

    // Middleware to get dbCollections from request
    const getDbCollections = (req, res, next) => {
        if (!req.dbCollections) {
            return res.status(500).json({ error: 'Database collections not available' });
        }
        req.routeDbCollections = req.dbCollections;
        next();
    };

    // Apply dbCollections middleware to all routes
    router.use(getDbCollections);

    // GET /publishers-stats
    router.get('/publishers-stats', (req, res, next) => {
        getPublishersStats(req.routeDbCollections)(req, res, next);
    });

    // GET /publisher ***
    router.get('/publisher', verifyFbToken, (req, res, next) => {
        const verifyAdminMiddleware = verifyAdmin(req.routeDbCollections);
        verifyAdminMiddleware(req, res, async () => {
            getAllPublishers(req.routeDbCollections)(req, res, next);
        });
    });

    // POST /publisher ***
    router.post('/publisher', verifyFbToken, (req, res, next) => {
        const verifyAdminMiddleware = verifyAdmin(req.routeDbCollections);
        verifyAdminMiddleware(req, res, async () => {
            createPublisher(req.routeDbCollections)(req, res, next);
        });
    });
    
    // GET /publisher-with-articles (this is what the frontend is calling)
    router.get('/publisher-with-articles', (req, res, next) => {
        getPublishersWithArticles(req.routeDbCollections)(req, res, next);
    });

    return router;
};

module.exports = publisherRouter;