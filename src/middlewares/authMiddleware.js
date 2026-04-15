import { admin } from '../config/firebase.js';
import ApiError from '../utils/ApiError.js';

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new ApiError(401, 'Nu esti autorizat. Te rugam sa te loghezi.'));
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error.message);
        next(new ApiError(401, 'Sesiune expirata sau token invalid.'));
    }
};

export default authMiddleware;
