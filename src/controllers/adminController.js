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

import transporter from '../config/mailer.js';

// GET /api/admin/mailing-list
export const getMailingList = async (req, res, next) => {
    try {
        const docSnap = await db.collection('config').doc('mailing_list').get();
        const data = docSnap.exists ? docSnap.data().emails || [] : [];
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// PUT /api/admin/mailing-list
export const updateMailingList = async (req, res, next) => {
    try {
        const { emails } = req.body;
        if (!Array.isArray(emails)) {
            return next(new ApiError(400, 'Format invalid. Este necesar un array de adrese.'));
        }
        await db.collection('config').doc('mailing_list').set({ emails });
        res.status(200).json({ success: true, message: 'Lista a fost actualizată.' });
    } catch (error) {
        next(error);
    }
};

// POST /api/admin/campaign/send
export const sendCampaign = async (req, res, next) => {
    try {
        const { subject, htmlContent, recipients } = req.body;
        if (!subject || !htmlContent || !Array.isArray(recipients)) {
            return next(new ApiError(400, 'Lipsesc date necesare (subiect, continut sau lista prea mica).'));
        }

        // Minimalist space remover to save KB. We preserve comments cause of Outlook mso tags!
        const minifiedHtml = htmlContent
            .replace(/>\s+</g, '><')
            .trim();

        console.log(`INFO: Started sending campaign "${subject}" to ${recipients.length} recipients in background.`);

        // Trimite raspunsul imediat catre frontend pentru a evita Network Timeout
        res.status(200).json({ 
            success: true, 
            message: `Campania a fost trimisa in executie in fundal pentru ${recipients.length} utilizatori.` 
        });

        // Functie asincrona care ruleaza in fundal (fire-and-forget)
        (async () => {
            let successCount = 0;
            let failCount = 0;
            
            for (const email of recipients) {
                try {
                    await transporter.sendMail({
                        from: `"Level UP 2026" <${process.env.SMTP_USER}>`,
                        to: email,
                        subject: subject,
                        html: minifiedHtml
                    });
                    successCount++;
                } catch (err) {
                    console.error(`Eroare la trimitere email către ${email}:`, err);
                    failCount++;
                }
            }
            console.log(`INFO: Background campaign "${subject}" finished! Success: ${successCount}, Failed: ${failCount}`);
        })();

    } catch (error) {
        next(error);
    }
};

