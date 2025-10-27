const express = require('express');
const { verifyFbToken } = require('../middleware/auth');
const { requestOTP, verifyOTP, checkVerificationStatus } = require('../controllers/emailVerificationController');

const emailVerificationRouter = (dbCollections) => {
    const router = express.Router();

    // POST /request-otp
    router.post('/request-otp', verifyFbToken, requestOTP(dbCollections));

    // POST /verify-otp
    router.post('/verify-otp', verifyFbToken, verifyOTP(dbCollections));

    // GET /verification-status/:email
    router.get('/verification-status/:email', verifyFbToken, checkVerificationStatus(dbCollections));

    return router;
};

module.exports = emailVerificationRouter;