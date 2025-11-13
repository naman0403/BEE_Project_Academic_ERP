const jwt = require('jsonwebtoken');
const User = require('../model/User');

const admin = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: 'Not authorized' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ message: 'Not authorized' });

        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        req.user = user;
        next();

    } catch (err) {
        console.error(err);
        res.status(401).json({ message: 'Not authorized' });
    }
};

module.exports = admin;
