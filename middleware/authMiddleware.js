import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
    console.log('Entering authenticateToken middleware');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Authorization header:', authHeader);
    console.log('Token:', token);

    if (!token) {
        console.log('No token found, sending 401');
        return res.status(401).json({ error: 'Missing Token' }); // Unauthorized
    }

    jwt.verify(token, 'p@ssw0rd', (err, user) => {
        if (err) {
            console.error('Token verification error:', err);
            console.log('Invalid token, sending 403');
            return res.status(403).json({ error: 'Invalid Token' }); // Forbidden
        }
        console.log('Token verified, user:', user);
        req.user = user;
        console.log('Exiting authenticateToken middleware');
        next();
    });
};

export default authenticateToken;