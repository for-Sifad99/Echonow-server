const express = require('express');
const { verifyFbToken } = require('../middleware/auth');
const { verifyAdmin } = require('../middleware/admin');
const {
    getAllUsers,
    getUsersCountInfo,
    getUserByEmail,
    createUser,
    updateUser,
    makeAdmin,
    getUserRole
} = require('../controllers/userController');

const userRouter = (dbCollections) => {
    const router = express.Router();

    // POST /users
    router.post("/users", verifyFbToken, createUser(dbCollections));

    // GET /users/:email
    router.get('/users/:email', getUserByEmail(dbCollections));

    // GET /all-users ***
    router.get('/all-users', verifyFbToken, verifyAdmin(dbCollections), getAllUsers(dbCollections));

    // GET /users-count-info (for InfoCards.jsx)
    router.get('/users-count-info', getUsersCountInfo(dbCollections));

    // PATCH /users/:email
    router.patch("/users/:email", verifyFbToken, updateUser(dbCollections));

    // PATCH /users/admin:email ***
    router.patch('/users/admin/:email', verifyFbToken, verifyAdmin(dbCollections), makeAdmin(dbCollections));

    // POST /get-role (no authentication required as it's called with axiosPublic)
    router.post('/get-role', getUserRole(dbCollections));

    return router;
};

module.exports = userRouter;