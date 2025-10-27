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

    // POST /article
    router.post("/article", verifyFbToken, createArticle(dbCollections));

    // GET /articles
    router.get('/articles', getAllArticles(dbCollections));

    // GET /articles/user
    router.get('/articles/user', getUserArticles(dbCollections));

    // GET /articles/premium
    router.get('/articles/premium', verifyFbToken, getPremiumArticles(dbCollections));

    // GET /all-articles ***
    router.get('/all-articles', verifyFbToken, verifyAdmin(dbCollections), getAllArticlesAdmin(dbCollections));

    // GET /articles/:id
    router.get('/article/:id', verifyFbToken, getArticleById(dbCollections));

    // GET /article/:id/views
    router.patch('/article/:id/views', verifyFbToken, updateArticleViews(dbCollections));

    // GET /articles/tending
    router.get('/articles/trending', getTrendingArticles(dbCollections));

    // GET /articles/special (for SideArticle.jsx)
    router.get('/articles/special', getSpecialArticles(dbCollections));

    // GET /articles/top-fashion (for CommonSidebar.jsx)
    router.get('/articles/top-fashion', getTopFashionArticles(dbCollections));

    // GET /articles/banner-trending (for BannerSlider.jsx)
    router.get('/articles/banner-trending', getBannerTrendingArticles(dbCollections));

    // PATCH /article ***
    router.patch('/articles/:id', verifyFbToken, verifyAdmin(dbCollections), updateArticle(dbCollections));

    // DELETE /article ***
    router.delete('/articles/:id', verifyFbToken, verifyAdmin(dbCollections), deleteArticle(dbCollections));

    return router;
};

module.exports = articleRouter;