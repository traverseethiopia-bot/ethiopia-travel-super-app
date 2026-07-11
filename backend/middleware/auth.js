const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ error: 'Token is not valid' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};

const admin = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

const host = async (req, res, next) => {
    if (req.user.role !== 'host' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Host access required' });
    }
    next();
};

const guide = async (req, res, next) => {
    if (req.user.role !== 'guide' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Guide access required' });
    }
    next();
};

module.exports = { auth, admin, host, guide };