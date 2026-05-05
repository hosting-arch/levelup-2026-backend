import * as dbService from '../services/dbService.js';
import * as mailService from '../services/mailService.js';
import { uploadToGoogleDrive } from '../services/uploadService.js';
import ApiError from '../utils/ApiError.js';

export const checkTeamName = async (req, res, next) => {
    try {
        const { teamName } = req.params;
        if (!teamName) return res.json({ taken: false });
        const isTaken = await dbService.isTeamNameTaken(teamName);
        res.json({ taken: isTaken });
    } catch (error) {
        next(error);
    }
};

export const handleRegistration = async (req, res, next) => {
    // Inscrierile sunt inchise
    return next(new ApiError(403, 'Inscrierile pentru Level UP 2026 s-au incheiat. Va multumim pentru interes!'));

    try {
        const { emailLead, teamName, teammate1, teammate2, gdprConsent } = req.body;
        
        if (!emailLead || !teamName || !teammate1) {
            return next(new ApiError(400, 'Lipsesc câmpuri obligatorii.'));
        }

        // Check if team name is already taken
        const isTaken = await dbService.isTeamNameTaken(teamName);
        if (isTaken) {
            return next(new ApiError(400, 'Numele echipei este deja utilizat. Te rugăm să alegi alt nume.'));
        }

        const t1 = typeof teammate1 === 'string' ? JSON.parse(teammate1) : teammate1;
        const t2 = typeof teammate2 === 'string' ? JSON.parse(teammate2) : teammate2;

        // Perform uploads in parallel for atomicity and speed
        const uploadPromises = [];

        // CV1 is mandatory
        if (req.files && req.files.cv1) {
            const file = req.files.cv1[0];
            uploadPromises.push(uploadToGoogleDrive(file.buffer, file.originalname));
        } else {
            return next(new ApiError(400, 'CV-ul primului coechipier este obligatoriu.'));
        }

        // CV2 is optional
        if (req.files && req.files.cv2) {
            const file = req.files.cv2[0];
            uploadPromises.push(uploadToGoogleDrive(file.buffer, file.originalname));
        }

        // Wait for all uploads to complete
        // If any fail, Promise.all will throw and we skip DB save
        const uploadResults = await Promise.all(uploadPromises);
        
        const cv1Data = uploadResults[0];
        const cv2Data = uploadResults[1] || null;

        // Prepare Final Data
        const registrationData = {
            emailLead,
            teamName,
            teammate1: {
                ...t1,
                cv: cv1Data
            },
            teammate2: t2 ? {
                ...t2,
                cv: cv2Data
            } : null,
            gdprConsent: gdprConsent === 'true' || gdprConsent === true,
        };

        // Save to DB - This ONLY happens if all previous steps succeeded
        const docRef = await dbService.addRegistration(registrationData);

        // Send Email - Strict requirement
        try {
            await mailService.sendConfirmationEmail(emailLead, teamName);
        } catch (mailError) {
            // ROLLBACK: If email fails, delete the registration from DB
            console.error('[ROLLBACK] Registration deleted because mail failed:', mailError.message);
            await dbService.deleteRegistration(docRef.id);
            
            // Re-throw as a friendly error
            throw new ApiError(500, `Eroare la trimiterea email-ului de confirmare. Înscrierea a fost anulată pentru a evita date inconsistente. Te rugăm să verifici adresa de email și să încerci din nou. (Detalii: ${mailError.message})`);
        }

        res.status(200).json({ success: true, id: docRef.id });
    } catch (error) {
        // If any error occurs (JSON parse, Google Drive, DB), the request fails here
        next(error);
    }
};
