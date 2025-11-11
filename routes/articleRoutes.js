const express = require('express');
const { verifyFbToken } = require('../middleware/auth');
const { verifyAdmin } = require('../middleware/admin');
const {
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
} = require('../controllers/articleController');

const articleRouter = (dbCollections) => {
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

    // POST /article
    router.post("/article", verifyFbToken, (req, res, next) => {
        createArticle(req.routeDbCollections)(req, res, next);
    });

    // GET /articles
    router.get('/articles', (req, res, next) => {
        getAllArticles(req.routeDbCollections)(req, res, next);
    });

    // GET /articles/user
    router.get('/articles/user', (req, res, next) => {
        getUserArticles(req.routeDbCollections)(req, res, next);
    });

    // GET /articles/premium
    router.get('/articles/premium', verifyFbToken, (req, res, next) => {
        getPremiumArticles(req.routeDbCollections)(req, res, next);
    });

    // GET /all-articles ***
    router.get('/all-articles', verifyFbToken, (req, res, next) => {
        const verifyAdminMiddleware = verifyAdmin(req.routeDbCollections);
        verifyAdminMiddleware(req, res, async () => {
            getAllArticlesAdmin(req.routeDbCollections)(req, res, next);
        });
    });

    // GET /articles/:id
    router.get('/article/:id', (req, res, next) => {
        getArticleById(req.routeDbCollections)(req, res, next);
    });

    // GET /article/:id/views
    router.patch('/article/:id/views', (req, res, next) => {
        updateArticleViews(req.routeDbCollections)(req, res, next);
    });

    // GET /articles/trending
    router.get('/articles/trending', (req, res, next) => {
        getTrendingArticles(req.routeDbCollections)(req, res, next);
    });

    // GET /articles/special (for SideArticle.jsx)
    router.get('/articles/special', (req, res, next) => {
        getSpecialArticles(req.routeDbCollections)(req, res, next);
    });

    // GET /articles/top-fashion (for CommonSidebar.jsx)
    router.get('/articles/top-fashion', (req, res, next) => {
        getTopFashionArticles(req.routeDbCollections)(req, res, next);
    });

    // GET /articles/banner-trending (for BannerSlider.jsx)
    router.get('/articles/banner-trending', (req, res, next) => {
        getBannerTrendingArticles(req.routeDbCollections)(req, res, next);
    });

    // PATCH /article ***
    router.patch('/articles/:id', verifyFbToken, (req, res, next) => {
        const verifyAdminMiddleware = verifyAdmin(req.routeDbCollections);
        verifyAdminMiddleware(req, res, async () => {
            updateArticle(req.routeDbCollections)(req, res, next);
        });
    });

    // DELETE /article ***
    router.delete('/articles/:id', verifyFbToken, (req, res, next) => {
        const verifyAdminMiddleware = verifyAdmin(req.routeDbCollections);
        verifyAdminMiddleware(req, res, async () => {
            deleteArticle(req.routeDbCollections)(req, res, next);
        });
    });

    return router;
};

module.exports = articleRouter;