import 'dotenv/config';
import winston from 'winston';

const { combine, timestamp, json, colorize, printf } = winston.format;
const REDACTED = '[REDACTED]';
const SENSITIVE_KEYS = new Set([
    'firstname',
    'lastname',
    'middlename',
    'fullname',
    'patientname',
    'patientfullname',
    'dateofbirth',
    'birthdate',
    'hospitalid',
    'contactno',
    'contactnumber',
    'address',
    'birthplace',
    'religion',
]);

function sanitizeLogValue(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(sanitizeLogValue);
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => {
                if (SENSITIVE_KEYS.has(key.toLowerCase())) {
                    return [key, REDACTED];
                }
                return [key, sanitizeLogValue(entryValue)];
            })
        );
    }

    return value;
}

const sanitizeFormat = winston.format((info) => {
    const sanitized = sanitizeLogValue(info) as Record<string, unknown>;
    return { ...info, ...sanitized };
});

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        sanitizeFormat(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        json()
    ),
    defaultMeta: { service: 'nmmc-queue-backend' },
    transports: [
        // Write all logs with importance level of `error` or less to `error.log`
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Write all logs with importance level of `info` or less to `combined.log`
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});

// If we're not in production then log to the `console` with colors
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: combine(
            sanitizeFormat(),
            colorize(),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            consoleFormat
        ),
    }));
}

export default logger;
