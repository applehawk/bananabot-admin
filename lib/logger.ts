import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logDir = '/app/logs';
// Only try to create if we are in an environment where we might want to (e.g. local without docker mounting properly yet)
// But essentially we expect /app/logs to exist via volume.
// If running locally without docker, we might want ./logs
const localLogDir = path.join(process.cwd(), 'logs');

let targetLogDir = process.env.NODE_ENV === 'production' ? logDir : localLogDir;

// Robust directory selection
try {
    if (!fs.existsSync(targetLogDir)) {
        fs.mkdirSync(targetLogDir, { recursive: true });
    }
    // Check write access
    fs.accessSync(targetLogDir, fs.constants.W_OK);
} catch (e) {
    console.warn(`Cannot write to ${targetLogDir}, falling back to ${localLogDir}`);
    targetLogDir = localLogDir;
    try {
        if (!fs.existsSync(targetLogDir)) {
            fs.mkdirSync(targetLogDir, { recursive: true });
        }
    } catch (e2) {
        console.error('Could not create log directory', e2);
    }
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'admin-panel' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({
            filename: path.join(targetLogDir, 'admin.log'),
            level: 'info'
        })
    ],
});

export default logger;
