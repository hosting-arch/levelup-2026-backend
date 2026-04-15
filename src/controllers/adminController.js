import { db, admin } from '../config/firebase.js';
import ApiError from '../utils/ApiError.js';

// GET /api/admin/registrations
export const getRegistrations = async (req, res, next) => {
    try {
        const snapshot = await db.collection('inscrieri').orderBy('createdAt', 'desc').get();
        const registrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({ success: true, data: registrations });
    } catch (error) {
        next(error);
    }
};

// GET /api/admin/messages
export const getMessages = async (req, res, next) => {
    try {
        const snapshot = await db.collection('contact_messages').orderBy('createdAt', 'desc').get();
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        next(error);
    }
};

// GET /api/admin/admins
export const getAdminsList = async (req, res, next) => {
    try {
        const snapshot = await db.collection('admins').get();
        const admins = snapshot.docs.map(doc => ({ email: doc.id, ...doc.data() }));
        res.status(200).json({ success: true, data: admins });
    } catch (error) {
        next(error);
    }
};

// POST /api/admin/admins
export const addAdmin = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return next(new ApiError(400, 'Emailul este obligatoriu.'));

        await db.collection('admins').doc(email).set({
            addedBy: req.user.email,
            addedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ success: true, message: `Admin ${email} adaugat cu succes.` });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/admin/admins/:email
export const removeAdmin = async (req, res, next) => {
    try {
        const { email } = req.params;

        // Prevent removing the last admin or yourself if needed (optional)
        if (email === 'matei.dragutu@osfiir.ro') {
            return next(new ApiError(403, 'Nu poti sterge adminul principal.'));
        }

        await db.collection('admins').doc(email).delete();
        res.status(200).json({ success: true, message: `Admin ${email} sters cu succes.` });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/admin/registrations/:id
export const removeRegistration = async (req, res, next) => {
    try {
        const { id } = req.params;
        await db.collection('inscrieri').doc(id).delete();
        res.status(200).json({ success: true, message: `Inscrierea ${id} a fost stearsa.` });
    } catch (error) {
        next(error);
    }
};

// GET /api/admin/setup-first-admin
// This route is temporary and should be hit manually once to seed the first admin
export const setupFirstAdmin = async (req, res, next) => {
    try {
        const snapshot = await db.collection('admins').get();
        if (!snapshot.empty) {
            return next(new ApiError(403, 'Exista deja administratori in sistem. Aceasta ruta este blocata.'));
        }

        const email = req.user.email;
        if (!email) return next(new ApiError(400, 'User email not found in token.'));

        await db.collection('admins').doc(email).set({
            addedBy: 'SYSTEM_SETUP',
            addedAt: admin.firestore.FieldValue.serverTimestamp(),
            role: 'owner'
        });

        res.status(200).json({
            success: true,
            message: `Felicitări! Email-ul ${email} a fost setat ca administrator principal al sistemului.`
        });
    } catch (error) {
        next(error);
    }
};
