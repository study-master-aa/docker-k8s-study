import winston from "winston";
import path from "path";
import fs from "fs";
import DailyRotateFile from "winston-daily-rotate-file";

const logDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `[${timestamp}][${level}] ${message}`;
});

export const logger = winston.createLogger({
    level: "silly",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat
    ),
    transports: [
        new DailyRotateFile({
            filename: path.join(logDir, "server.%DATE%.log"),
            datePattern: "YYYY-MM-DD",
            zippedArchive: false,
            maxFiles: "30d",
        }),
        new winston.transports.Console(),
    ],
});
