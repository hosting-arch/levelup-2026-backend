import { db } from '../config/firebase.js';
import crypto from 'crypto';

// In-memory store for active game sessions (server-side timing + item tracking)
const gameSessions = new Map();

// Cleanup expired sessions every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [token, session] of gameSessions) {
        if (now - session.startTime > 30 * 60 * 1000) {
            gameSessions.delete(token);
        }
    }
}, 10 * 60 * 1000);

// Cookie options — HttpOnly so JS can't read it
const COOKIE_NAME = 'game_session';
const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 60 * 1000, // 30 minutes
    path: '/',
});

// POST /api/leaderboard/start
export const startGame = async (req, res, next) => {
    try {
        const configDoc = await db.collection('config').doc('minigame').get();
        const numItems = configDoc.exists ? (configDoc.data().NUM_ITEMS || 30) : 30;

        // Generate a cryptographically secure token
        const sessionToken = crypto.randomBytes(32).toString('hex');

        gameSessions.set(sessionToken, {
            startTime: Date.now(),
            numItems: numItems,
            clickedCount: 0,
            lastClickTime: Date.now(),
            completed: false,
            used: false
        });

        // Set the token as an HttpOnly cookie — invisible to client JS
        res.cookie(COOKIE_NAME, sessionToken, getCookieOptions());

        res.status(200).json({ status: 'success' });
    } catch (error) {
        next(error);
    }
};

// POST /api/leaderboard/click — called for EACH item click
export const clickItem = async (req, res, next) => {
    try {
        const { itemId } = req.body;
        const sessionToken = req.cookies[COOKIE_NAME];

        if (!sessionToken) {
            return res.status(400).json({ status: 'error', message: 'Sesiune invalida (cookie lipsa).' });
        }
        if (itemId === undefined) {
            return res.status(400).json({ status: 'error', message: 'Missing itemId.' });
        }

        const session = gameSessions.get(sessionToken);
        if (!session) {
            return res.status(400).json({ status: 'error', message: 'Sesiune invalida sau expirata.' });
        }
        if (session.completed || session.used) {
            return res.status(400).json({ status: 'error', message: 'Jocul s-a terminat deja.' });
        }

        // Rate limiting: minimum 200ms between clicks (impossible for scripts to bypass humanly)
        const now = Date.now();
        const timeSinceLastClick = now - session.lastClickTime;
        if (timeSinceLastClick < 200) {
            return res.status(429).json({ status: 'error', message: 'Prea rapid. Incearca mai incet.' });
        }

        // Validate that the item ID matches the NEXT expected item (must click in order: 0, 1, 2...)
        if (Number(itemId) !== session.clickedCount) {
            return res.status(400).json({ status: 'error', message: 'Ordine incorecta.' });
        }

        session.clickedCount++;
        session.lastClickTime = now;

        // Check if all items have been found
        if (session.clickedCount >= session.numItems) {
            session.completed = true;
        }

        res.status(200).json({ 
            status: 'success', 
            confirmed: session.clickedCount,
            completed: session.completed
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/leaderboard — save score (only if server confirmed ALL clicks)
export const saveScore = async (req, res, next) => {
    try {
        const { name } = req.body;
        const sessionToken = req.cookies[COOKIE_NAME];

        if (!name) {
            return res.status(400).json({ status: 'error', message: 'Name is required.' });
        }
        if (!sessionToken) {
            return res.status(400).json({ status: 'error', message: 'Sesiune invalida (cookie lipsa).' });
        }

        const session = gameSessions.get(sessionToken);
        if (!session) {
            return res.status(400).json({ status: 'error', message: 'Sesiune de joc invalida sau expirata.' });
        }
        if (session.used) {
            return res.status(400).json({ status: 'error', message: 'Aceasta sesiune a fost deja folosita.' });
        }
        if (!session.completed) {
            return res.status(400).json({ status: 'error', message: 'Nu ai completat toate elementele.' });
        }

        // Calculate elapsed time SERVER-SIDE
        const elapsedMs = Date.now() - session.startTime;
        const elapsedSeconds = Math.round(elapsedMs / 1000);

        // Mark session as used and delete
        session.used = true;
        gameSessions.delete(sessionToken);

        // Clear the cookie
        res.clearCookie(COOKIE_NAME, getCookieOptions());

        // Anti-cheat: reject impossibly fast times
        const MIN_REALISTIC_TIME = 60;
        if (elapsedSeconds < MIN_REALISTIC_TIME) {
            return res.status(400).json({ status: 'error', message: `Timpul de ${elapsedSeconds}s este fizic imposibil de realizat uman. Ești detectat ca bot.` });
        }

        const configDoc = await db.collection('config').doc('minigame').get();
        const maxTime = configDoc.exists ? (configDoc.data().TIMER_SECONDS || 180) : 180;
        if (elapsedSeconds > maxTime) {
            return res.status(400).json({ status: 'error', message: 'Timpul a expirat.' });
        }

        const trimmedName = name.trim();
        const scoreData = {
            name: trimmedName,
            time: elapsedSeconds,
            timestamp: new Date().toISOString()
        };

        const snapshot = await db.collection('leaderboard').where('name', '==', trimmedName).limit(1).get();

        if (!snapshot.empty) {
            const existingTime = snapshot.docs[0].data().time;
            if (elapsedSeconds < existingTime) {
                await db.collection('leaderboard').doc(snapshot.docs[0].id).update(scoreData);
            }
        } else {
            await db.collection('leaderboard').add(scoreData);
        }

        res.status(201).json({
            status: 'success',
            message: 'Score saved successfully',
            time: elapsedSeconds
        });
    } catch (error) {
        next(error);
    }
};

export const getLeaderboard = async (req, res, next) => {
    try {
        // Fetch top 10 fastest times
        const snapshot = await db.collection('leaderboard')
            .orderBy('time', 'asc')
            .limit(10)
            .get();

        const leaderboard = [];
        snapshot.forEach(doc => {
            leaderboard.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json({
            status: 'success',
            data: leaderboard
        });
    } catch (error) {
        next(error);
    }
};

export const resetLeaderboard = async (req, res, next) => {
    try {
        const { password } = req.body;
        if (password !== "89734") {
            return res.status(401).json({ status: 'error', message: 'Parola incorecta' });
        }

        const snapshot = await db.collection('leaderboard').get();
        
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();

        res.status(200).json({ status: 'success', message: 'Leaderboard resetat cu succes' });
    } catch (error) {
        next(error);
    }
};

export const getConfig = async (req, res, next) => {
    try {
        const docRef = db.collection('config').doc('minigame');
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            res.status(200).json({ status: 'success', data: docSnap.data() });
        } else {
            // Default fallback
            res.status(200).json({ status: 'success', data: { TIMER_SECONDS: 180, NUM_ITEMS: 30 } });
        }
    } catch (error) {
        next(error);
    }
};
