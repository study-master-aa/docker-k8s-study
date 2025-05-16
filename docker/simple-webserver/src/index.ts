import express from "express";
import fs from "fs";
import path from "path";
import winston from "winston";

const app = express();
const port = 3000;

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

// 로그 폴더 존재 여부 확인 및 생성
const logDirectory = path.join(__dirname, "../logs");
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

// Winston Logger 설정
const logger = winston.createLogger({
    level: "debug",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(
            ({ timestamp, message }) => `[${timestamp}] ${message}`
        )
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(logDirectory, "server.log"),
        }),
        new winston.transports.Console(),
    ],
});

app.post("/chat", (req, res) => {
    const { message } = req.body;

    logger.debug(message);
    res.json({ reply: message });
});

// 서버 시작
app.listen(port, () => {
    logger.info(`>>>>>>>>>> START SERVER. Port:[${port}]`);
});
