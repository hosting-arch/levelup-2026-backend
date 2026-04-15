import * as dbService from '../services/dbService.js';
import ApiError from '../utils/ApiError.js';

export const handleContactMessage = async (req, res, next) => {
    try {
        const contactData = req.body;
        
        if (!contactData.email || !contactData.message) {
            return next(new ApiError(400, 'Emailul si mesajul sunt obligatorii.'));
        }

        // Save to DB
        const docRef = await dbService.addContactMessage(contactData);

        res.status(200).json({ success: true, id: docRef.id });
    } catch (error) {
        next(error);
    }
};
