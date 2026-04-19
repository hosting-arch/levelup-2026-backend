import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import apiRoutes from './routes/apiRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import errorMiddleware from './middlewares/errorMiddleware.js';
import ApiError from './utils/ApiError.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ----- MIDDLEWARE -----
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:3000'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ----- ROUTES -----
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/', (req, res) => {
    res.status(200).json({ status: 'success', message: 'LevelUp Backend API (ES6) is running...' });
});

// Handling Undefined Routes
app.all('*', (req, res, next) => {
    next(new ApiError(404, `Can't find ${req.originalUrl} on this server!`));
});

// ----- GLOBAL ERROR HANDLING MIDDLEWARE -----
app.use(errorMiddleware);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // ----- KEEP-ALIVE CRON (every 5 minutes) -----
    const SELF_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    const PING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

    setInterval(async () => {
        try {
            await axios.get(SELF_URL);
            console.log(`[keep-alive] Ping OK → ${SELF_URL}`);
        } catch (err) {
            console.warn(`[keep-alive] Ping failed: ${err.message}`);
        }
    }, PING_INTERVAL_MS);

    console.log(`[keep-alive] Self-ping scheduled every 5 minutes → ${SELF_URL}`);
});
