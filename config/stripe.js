const stripe = require('stripe')(process.env.PAYMENT_GETWAY_KEY);

module.exports = stripe;