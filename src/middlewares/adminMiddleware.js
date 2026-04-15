import { db } from '../config/firebase.js';
import ApiError from '../utils/ApiError.js';

const adminMiddleware = async (req, res, next) => {
    try {
        if (!req.user || !req.user.email) {
            return next(new ApiError(401, 'Utilizator neidentificat.'));
        }

        const adminDoc = await db.collection('admins').doc(req.user.email).get();

        if (!adminDoc.exists) {
            console.warn(`Tentativa de acces admin refuzata pentru: ${req.user.email}`);
            return next(new ApiError(403, 'Nu ai permisiuni de administrator.'));
        }

        next();
    } catch (error) {
        console.error('Admin Middleware Error:', error.message);
        next(new ApiError(500, 'Eroare la verificarea permisiunilor.'));
    }
};

export default adminMiddleware;
