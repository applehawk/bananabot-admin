import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logDir = '/app/logs';
// Only try to create if we are in an environment where we might want to (e.g. local without docker mounting properly yet)
// But essentially we expect /app/logs to exist via volume.
// If running locally without docker, we might want ./logs
const localLogDir = path.join(process.cwd(), '../logs');
const targetLogDir = process.env.NODE_ENV === 'production' ? logDir : localLogDir;

// We don't necessarily want to create the directory if it's a mounted volume, but good practice to check if we can.
if (!fs.existsSync(targetLogDir)) {
    try {
        fs.mkdirSync(targetLogDir, { recursive: true });
    } catch (e) {
        // Ignore error if we can't create it (might be permission issue or already exists)
        console.error('Could not create log directory', e);
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
