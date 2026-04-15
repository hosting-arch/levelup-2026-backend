import express from 'express';
import * as adminController from '../controllers/adminController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();

// Publicly reachable if authenticated via Firebase, but only works if DB is empty
router.get('/setup-first-admin', authMiddleware, adminController.setupFirstAdmin);

// Protected Admin Routes (Require existing admin session)
router.use(authMiddleware);
router.use(adminMiddleware);

// Verify admin status endpoint
router.get('/verify', (req, res) => res.json({ success: true }));

// Registration Routes
router.get('/registrations', adminController.getRegistrations);
router.delete('/registrations/:id', adminController.removeRegistration);

// Message Routes
router.get('/messages', adminController.getMessages);

// Admin Management
router.get('/admins', adminController.getAdminsList);
router.post('/admins', adminController.addAdmin);
router.delete('/admins/:email', adminController.removeAdmin);

export default router;
