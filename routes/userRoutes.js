const express = require('express');
const { verifyFbToken } = require('../middleware/auth');
const { verifyAdmin } = require('../middleware/admin');
const {
    getAllUsers,
    getUserByEmail,
    createUser,
    updateUser,
    makeAdmin,
    getUserRole
} = require('../controllers/userController');

const userRouter = (dbCollections) => {
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

    // POST /users
    router.post("/users", verifyFbToken, (req, res, next) => {
        createUser(req.routeDbCollections)(req, res, next);
    });

    // GET /users/:email
    router.get('/users/:email', (req, res, next) => {
        getUserByEmail(req.routeDbCollections)(req, res, next);
    });

    // GET /all-users ***
    router.get('/all-users', verifyFbToken, (req, res, next) => {
        const verifyAdminMiddleware = verifyAdmin(req.routeDbCollections);
        verifyAdminMiddleware(req, res, async () => {
            getAllUsers(req.routeDbCollections)(req, res, next);
        });
    });

    // PATCH /users/:email
    router.patch("/users/:email", verifyFbToken, (req, res, next) => {
        updateUser(req.routeDbCollections)(req, res, next);
    });

    // PATCH /users/admin:email ***
    router.patch('/users/admin/:email', verifyFbToken, (req, res, next) => {
        const verifyAdminMiddleware = verifyAdmin(req.routeDbCollections);
        verifyAdminMiddleware(req, res, async () => {
            makeAdmin(req.routeDbCollections)(req, res, next);
        });
    });

    // POST /get-role (no authentication required as it's called with axiosPublic)
    router.post('/get-role', (req, res, next) => {
        getUserRole(req.routeDbCollections)(req, res, next);
    });

    return router;
};

module.exports = userRouter;