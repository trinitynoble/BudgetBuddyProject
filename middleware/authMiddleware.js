import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401).json({error: 'Missing Token'});// Unauthorized
    }

    jwt.verify(token, 'p@ssw0rd', (err, user) => {
        if (err) {
            return res.sendStatus(403).json({error: 'Invalid Token'}); // Forbidden
        }
        req.user = user;
        next();
    });
};

export default authenticateToken;