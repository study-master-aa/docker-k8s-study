import express from "express";
import http from "http";
import { Server } from "socket.io";
import { logger } from "./logger";
import { AppDataSource } from "./dataSource";
import { Room } from "./entities/room.entity";
import { User } from "./entities/user.entity";
import { Message } from "./entities/message.entity";
import { RoomUser } from "./entities/roomuser.entity";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const ENV = process.env.ENV;
const PORT = process.env.PORT;

if (!ENV || !PORT) {
    logger.error("Environment variables ENV and PORT must be set.");
    process.exit(1);
}

// TypeORM Repository 준비
const roomRepo = AppDataSource.getRepository(Room);
const userRepo = AppDataSource.getRepository(User);
const messageRepo = AppDataSource.getRepository(Message);
const roomUserRepo = AppDataSource.getRepository(RoomUser);

// 초기 채팅방 목록 (서버 시작 시 생성)
const roomNames = ["일반", "개발", "디자인"];
AppDataSource.initialize()
    .then(async () => {
        for (const roomName of roomNames) {
            const exists = await roomRepo.findOneBy({ name: roomName });
            if (!exists) {
                const room = roomRepo.create({ name: roomName });
                await roomRepo.save(room);
            }
        }
        server.listen(PORT, () => {
            logger.info(
                `>>>>>>>>>> START SERVER. Env:[${ENV}], Port:[${PORT}]`
            );
        });
    })
    .catch((err) => {
        logger.error("TypeORM DataSource initialization error: " + err);
        process.exit(1);
    });

// 채팅방 목록 API
app.get("/api/rooms", async (req, res) => {
    try {
        const rooms = await roomRepo.find();
        res.json(rooms);
    } catch (err) {
        logger.error("[API] /api/rooms error: " + err);
        res.status(500).json({ error: "DB error" });
    }
});

// 소켓 이벤트 처리
io.on("connection", async (socket) => {
    let currentRoom: Room | null = null;
    let currentUser: User | null = null;

    socket.on("initUser", async ({ userName }, ack) => {
        try {
            const newUser = userRepo.create({ name: userName });
            currentUser = await userRepo.save(newUser);
            logger.debug(
                `InitUser. UserId:[${currentUser.id}], UserName:[${currentUser.name}]`
            );
            if (typeof ack === "function") {
                ack({
                    success: true,
                    userId: currentUser.id,
                    userName: currentUser.name,
                });
            }
        } catch (err) {
            logger.error("[Socket] initUser Error." + err);
            if (typeof ack === "function") {
                ack({ success: false, error: err?.toString() });
            }
        }
    });

    const syncChatHistory = async (roomId: number) => {
        try {
            const messages = await messageRepo.find({
                where: { room: { id: roomId } },
                relations: ["user"],
                order: { date: "ASC" },
            });
            socket.emit("chatHistory", messages);
        } catch (err) {
            logger.error("[Socket] chatHistory error: " + err);
        }
    };

    const syncUserList = async (roomId: number) => {
        try {
            const roomUsers = await roomUserRepo.find({
                where: { room: { id: roomId } },
                relations: ["user"],
            });
            const users = roomUsers.map((ru) => ({
                id: ru.user.id,
                name: ru.user.name,
            }));
            io.to(`${currentRoom?.id}`).emit("userList", users);
        } catch (err) {
            logger.error("[Socket] userList error: " + err);
        }
    };

    socket.on("joinRoom", async ({ roomId }) => {
        try {
            if (!currentUser) throw new Error("User not initialized");
            let room = await roomRepo.findOneBy({ id: roomId });
            if (!room) throw new Error("Room not found");
            currentRoom = room;
            socket.join(room.id.toString());
            // RoomUser 테이블에 추가
            let ru = await roomUserRepo.findOne({
                where: { room: { id: room.id }, user: { id: currentUser.id } },
                relations: ["room", "user"],
            });
            if (!ru) {
                ru = roomUserRepo.create({ room, user: currentUser });
                await roomUserRepo.save(ru);
            }
            logger.debug(
                `Join Room. RoomId:[${room.id}], RoomName:[${room.name}], UserId:[${currentUser.id}], UserName:[${currentUser.name}]`
            );
            if (room && room.id) await syncChatHistory(room.id);
            if (room && room.id) await syncUserList(room.id);
        } catch (err) {
            logger.error("[Socket] joinRoom error: " + err);
        }
    });

    socket.on("sendMessage", async (text) => {
        if (!currentRoom || !currentUser) return;
        try {
            const message = messageRepo.create({
                room: currentRoom,
                user: currentUser,
                text,
                date: new Date(),
            });
            const msg = await messageRepo.save(message);
            io.to(currentRoom.id.toString()).emit("newMessage", {
                id: msg.id,
                userId: currentUser.id,
                userName: currentUser.name,
                text: msg.text,
                date: msg.date,
            });
            logger.debug(
                `Send Message. RoomId:[${currentRoom.id}], RoomName:[${currentRoom.name}], UserId:[${currentUser.id}], UserName:[${currentUser.name}], Text:[${text}]`
            );
        } catch (err) {
            logger.error("[Socket] sendMessage error: " + err);
        }
    });

    socket.on("leaveRoom", async ({ roomId }) => {
        try {
            if (currentRoom && currentUser) {
                await roomUserRepo.delete({
                    room: { id: currentRoom.id },
                    user: { id: currentUser.id },
                });
                await syncUserList(currentRoom.id);
            }
        } catch (err) {
            logger.error("[Socket] leaveRoom error: " + err);
        }
        currentRoom = null;
        socket.leave(roomId?.toString() ?? "");
        logger.debug(
            `Leave Room. RoomId:[${roomId}], UserId:[${currentUser?.id}]`
        );
    });

    socket.on("disconnect", async () => {
        try {
            if (currentRoom && currentUser) {
                await roomUserRepo.delete({
                    room: { id: currentRoom.id },
                    user: { id: currentUser.id },
                });
                await syncUserList(currentRoom.id);
            }
        } catch (err) {
            logger.error("[Socket] disconnect error: " + err);
        }
        currentRoom = null;
        currentUser = null;
    });
});

process.on("SIGINT", async () => {
    logger.info(`<<<<<<<<<< END SERVER.`);
    await roomUserRepo.clear();
    process.exit();
});
