import { db, admin } from '../config/firebase.js';

export const addRegistration = async (data) => {
    return await db.collection('inscrieri').add({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
};

export const addContactMessage = async (data) => {
    return await db.collection('contact_messages').add({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
};

export const deleteRegistration = async (id) => {
    return await db.collection('inscrieri').doc(id).delete();
};

export const isTeamNameTaken = async (teamName) => {
    const snapshot = await db.collection('inscrieri')
        .where('teamName', '==', teamName)
        .limit(1)
        .get();
    return !snapshot.empty;
};
