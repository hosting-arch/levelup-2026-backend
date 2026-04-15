const errorMiddleware = (err, req, res, next) => {
    // Handle Multer file size limit error
    if (err.code === 'LIMIT_FILE_SIZE') {
        err.statusCode = 400;
        err.message = 'Fișierul este prea mare. Limita maximă este de 100MB.';
    }

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Development vs Production error logging
    if (process.env.NODE_ENV === 'development') {
        console.error(`[ERROR] ${err.statusCode} - ${err.message}\n`, err.stack);
    } else {
        console.error(`[ERROR] ${err.statusCode} - ${err.message}`);
    }

    res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
        // In dev, include stack trace for easier debugging
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

export default errorMiddleware;
