const express = require('express');
const { verifyFbToken } = require('../middleware/auth');
const { requestOTP, verifyOTP, checkVerificationStatus } = require('../controllers/emailVerificationController');

const emailVerificationRouter = (dbCollections) => {
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

    // POST /request-otp
    router.post('/request-otp', verifyFbToken, (req, res, next) => {
        requestOTP(req.routeDbCollections)(req, res, next);
    });

    // POST /verify-otp
    router.post('/verify-otp', verifyFbToken, (req, res, next) => {
        verifyOTP(req.routeDbCollections)(req, res, next);
    });

    // GET /verification-status/:email
    router.get('/verification-status/:email', verifyFbToken, (req, res, next) => {
        checkVerificationStatus(req.routeDbCollections)(req, res, next);
    });

    return router;
};

module.exports = emailVerificationRouter;