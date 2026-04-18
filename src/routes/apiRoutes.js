import express from 'express';
import multer from 'multer';
import * as inscriereController from '../controllers/inscriereController.js';
import * as contactController from '../controllers/contactController.js';
import * as leaderboardController from '../controllers/leaderboardController.js';

const router = express.Router();

// Multer Setup (Memory Storage for direct Cloudinary upload)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Inscriere Route (with file handling)
router.post('/inscriere', upload.fields([
    { name: 'cv1', maxCount: 1 },
    { name: 'cv2', maxCount: 1 }
]), inscriereController.handleRegistration);

// Contact Route
router.post('/contact', contactController.handleContactMessage);
// Check Route
router.get('/check-team/:teamName', inscriereController.checkTeamName);

// Leaderboard Routes
router.post('/leaderboard', leaderboardController.saveScore);
router.get('/leaderboard', leaderboardController.getLeaderboard);
router.post('/leaderboard/reset', leaderboardController.resetLeaderboard);

export default router;
