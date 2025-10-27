const express = require('express');
const { verifyFbToken } = require('../middleware/auth');
const { createPaymentIntent } = require('../controllers/paymentController');

const paymentRouter = () => {
    const router = express.Router();

    // POST /create-payment-intent
    router.post('/create-payment-intent', verifyFbToken, createPaymentIntent());

    return router;
};

module.exports = paymentRouter;