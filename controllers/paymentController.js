const stripe = require("../config/stripe");

// PAYMENT RELATED CONTROLLERS
const createPaymentIntent = () => {
    return async (req, res) => {
        const { cost } = req.body;
        console.log('🧾 Creating payment intent for:', cost);

        if (!cost) {
            return res.status(400).json({ error: 'Cost is required' });
        }

        try {
            const amount = parseInt(cost * 100);

            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency: 'usd',
                payment_method_types: ['card'],
            });

            res.send({ clientSecret: paymentIntent.client_secret });
        } catch (error) {
            console.error('❌ Stripe error:', error);
            res.status(500).json({ error: error.message });
        }
    };
};

module.exports = { createPaymentIntent };