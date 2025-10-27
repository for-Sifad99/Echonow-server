const { verifyAdmin } = require('../middleware/admin');

// USERS RELATED CONTROLLERS
const getAllUsers = (dbCollections) => {
    return async (req, res) => {
        try {
            const totalUsers = await dbCollections.usersCollection.countDocuments();
            const premiumUsers = await dbCollections.usersCollection.countDocuments({ isPremium: true });
            const allUsers = await dbCollections.usersCollection.find().toArray();

            res.send({
                totalUsers,
                premiumUsers,
                allUsers,
            });
        } catch (error) {
            console.error("Error getting all users:", error);
            res.status(500).send({ message: "Failed to fetch all users" });
        }
    };
};

const getUsersCountInfo = (dbCollections) => {
    return async (req, res) => {
        try {
            const totalUsers = await dbCollections.usersCollection.countDocuments();
            const premiumUsers = await dbCollections.usersCollection.countDocuments({ isPremium: true });
            const normalUsers = totalUsers - premiumUsers;

            res.send({
                totalUsers,
                premiumUsers,
                normalUsers
            });
        } catch (error) {
            console.error("Error getting users count info:", error);
            res.status(500).send({ message: "Failed to fetch users count info" });
        }
    };
};

const getUserByEmail = (dbCollections) => {
    return async (req, res) => {
        try {
            const email = req.params.email;
            const user = await dbCollections.usersCollection.findOne({ email });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            res.status(200).json(user);
        } catch (error) {
            console.error("❌ Error fetching user:", error);
            res.status(500).json({ message: "Server error" });
        }
    };
};

const createUser = (dbCollections) => {
    return async (req, res) => {
        try {
            const userProfile = req.body;
            const { name, photo, email, premiumTaken, duration } = userProfile;

            if (!email) return res.status(400).json({ message: "Email is required" });

            const existingUser = await dbCollections.usersCollection.findOne({ email });

            if (existingUser) {
                // Check if premium expired
                const now = new Date();
                const expiry = existingUser.premiumExpiresAt;

                const isExpired = expiry && new Date(expiry) < now;

                const updateFields = {
                    updatedAt: now,
                    ...(isExpired
                        ? { isPremium: false, premiumTaken: null, premiumExpiresAt: null }
                        : {}),
                    ...(premiumTaken && duration
                        ? (() => {
                            const durationMap = {
                                "1": 1,
                                "5": 5 * 24 * 60,
                                "10": 10 * 24 * 60,
                            };
                            const expiryMinutes = durationMap[duration] || 0;
                            const takenTime = new Date(premiumTaken);
                            const expiresAt = new Date(takenTime.getTime() + expiryMinutes * 60000);

                            return {
                                premiumTaken: takenTime,
                                premiumExpiresAt: expiresAt,
                                isPremium: true,
                            };
                        })()
                        : {}),
                };

                await dbCollections.usersCollection.updateOne({ email }, { $set: updateFields });
                return res.status(200).json({ message: "User updated" });
            }

            // New user insert
            await dbCollections.usersCollection.insertOne({
                ...userProfile,
                name, email, photo,
                isPremium: false,
                isEmailVerified: userProfile.isEmailVerified || false,
                emailVerifiedAt: userProfile.emailVerifiedAt || null,
                premiumTaken: null,
                premiumExpiresAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            res.status(201).json({ message: "User created" });
        } catch (error) {
            console.error("❌ Error in /users route:", error);
            res.status(500).json({ message: "Server error" });
        }
    };
};

const updateUser = (dbCollections) => {
    return async (req, res) => {
        const email = req.params.email;
        const updatedFields = req.body;

        const result = await dbCollections.usersCollection.updateOne(
            { email },
            { $set: { ...updatedFields, updatedAt: new Date() } }
        );

        res.status(200).json(result);
    };
};

const makeAdmin = (dbCollections) => {
    return async (req, res) => {
        const email = req.params.email;
        const filter = { email };
        const updateDoc = { $set: { role: 'admin' } };
        const result = await dbCollections.usersCollection.updateOne(filter, updateDoc);
        res.send(result);
    };
};

const getUserRole = (dbCollections) => {
    return async (req, res) => {
        console.log('getUserRole called with body:', req.body);
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await dbCollections.usersCollection.findOne({ email });

        if (user) {
            res.json({ role: user.role || 'user' });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    };
};

module.exports = {
    getAllUsers,
    getUsersCountInfo,
    getUserByEmail,
    createUser,
    updateUser,
    makeAdmin,
    getUserRole
};