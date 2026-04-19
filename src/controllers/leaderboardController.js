import { db } from '../config/firebase.js';

export const saveScore = async (req, res, next) => {
    try {
        const { name, time } = req.body;

        if (!name || time === undefined) {
            return res.status(400).json({ status: 'error', message: 'Name and time are required' });
        }

        const trimmedName = name.trim();
        const scoreData = {
            name: trimmedName,
            time: Number(time),
            timestamp: new Date().toISOString()
        };

        const snapshot = await db.collection('leaderboard').where('name', '==', trimmedName).limit(1).get();

        if (!snapshot.empty) {
            const docId = snapshot.docs[0].id;
            await db.collection('leaderboard').doc(docId).update(scoreData);
        } else {
            await db.collection('leaderboard').add(scoreData);
        }

        res.status(201).json({
            status: 'success',
            message: 'Score saved successfully'
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
