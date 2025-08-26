import jwt from 'jsonwebtoken';

export const verifyToken = (req) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        throw new Error('No token provided');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        throw new Error('Invalid token');
    }
};

export const requireAuth = async (req, res, next) => {
    try {
        const user = verifyToken(req);
        req.user = user;
        return user;
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};