const admin = require("../config/firebase");

// Verify Firebase Token
const verifyFbToken = async (req, res, next) => {
    const authHeader = req.headers?.authorization;
    // Fix: Check if authHeader exists before trying to split it
    const token = authHeader?.split(' ')[1];

    if (!authHeader || !authHeader.startsWith('Bearer ') || !token) {
        return res.status(401).send({ message: 'Unauthorized access!!' })
    }

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.decoded = decoded;
        next();
    } catch (error) {
        return res.status(401).send({ message: 'Unauthorized access!!' });
    }
};

module.exports = { verifyFbToken };