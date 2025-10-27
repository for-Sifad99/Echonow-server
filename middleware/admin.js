// Verify Admin middleware
const verifyAdmin = (dbCollections) => {
    return async (req, res, next) => {
        const email = req?.decoded?.email;
        const user = await dbCollections.usersCollection.findOne({ email });

        if (!user || user.role !== 'admin') {
            return res.status(403).send({ message: 'Unauthorized access!!' })
        }
        next();
    };
};

module.exports = { verifyAdmin };