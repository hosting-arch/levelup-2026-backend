import { db } from '../config/firebase.js';

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

// POST /api/leaderboard/start
export const startGame = async (req, res, next) => {
    try {
        const configDoc = await db.collection('config').doc('minigame').get();
        const numItems = configDoc.exists ? (configDoc.data().NUM_ITEMS || 30) : 30;

        const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        gameSessions.set(sessionToken, {
            startTime: Date.now(),
            numItems: numItems,
            clickedCount: 0,       // How many items the server has confirmed
            lastClickTime: Date.now(),
            completed: false,
            used: false
        });
        res.status(200).json({ status: 'success', sessionToken });
    } catch (error) {
        next(error);
    }
};

// POST /api/leaderboard/click — called for EACH item click
export const clickItem = async (req, res, next) => {
    try {
        const { sessionToken, itemId } = req.body;

        if (!sessionToken || itemId === undefined) {
            return res.status(400).json({ status: 'error', message: 'Missing sessionToken or itemId.' });
        }

        const session = gameSessions.get(sessionToken);
        if (!session) {
            return res.status(400).json({ status: 'error', message: 'Sesiune invalida.' });
        }
        if (session.completed || session.used) {
            return res.status(400).json({ status: 'error', message: 'Jocul s-a terminat deja.' });
        }

        // Validate that the item ID matches the NEXT expected item (must click in order: 0, 1, 2...)
        if (Number(itemId) !== session.clickedCount) {
            return res.status(400).json({ status: 'error', message: 'Ordine incorecta.' });
        }

        session.clickedCount++;
        session.lastClickTime = Date.now();

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
        const { name, sessionToken } = req.body;

        if (!name || !sessionToken) {
            return res.status(400).json({ status: 'error', message: 'Name and sessionToken are required.' });
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

        // Mark session as used
        session.used = true;
        gameSessions.delete(sessionToken);

        // Anti-cheat: reject impossibly fast times
        const MIN_REALISTIC_TIME = 10;
        if (elapsedSeconds < MIN_REALISTIC_TIME) {
            return res.status(400).json({ status: 'error', message: `Timpul de ${elapsedSeconds}s este prea mic.` });
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
