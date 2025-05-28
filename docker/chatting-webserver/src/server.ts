import express from "express";
import http from "http";
import { Server } from "socket.io";
import { User } from "./models/user";
import { Room } from "./models/room";
import { logger } from "./logger";
import { Message } from "./models/message";

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

const chatRooms: Record<string, Room> = {};

// 초기 채팅방 목록 (서버 시작 시 생성)
const roomNames = ["일반", "개발", "디자인"];
roomNames.forEach((roomName) => {
    chatRooms[roomName] = new Room(roomName);
});

// 채팅방 목록 API
app.get("/api/rooms", (req: express.Request, res: express.Response) => {
    const rooms = Object.keys(chatRooms).map((roomName) =>
        chatRooms[roomName].toObject()
    );
    res.json(rooms);
});

// 소켓 이벤트 처리
io.on("connection", (socket) => {
    let currentRoom: Room | null = null;
    let currentUser: User | null = null;

    const syncUserList = (roomName: string) => {
        io.to(roomName).emit(
            "userList",
            chatRooms[roomName].users.map((user) => user.toObject())
        );
    };
    const syncChatHistory = (roomName: string) => {
        socket.emit(
            "chatHistory",
            chatRooms[roomName].messages.map((message) => message.toObject())
        );
    };

    socket.on("joinRoom", ({ roomName, userName }) => {
        currentRoom = chatRooms[roomName];
        currentUser = new User(userName);

        chatRooms[roomName].addUser(currentUser);
        socket.join(roomName);

        logger.debug(
            `Join Room. RoomName:[${roomName}], UserName:[${userName}]`
        );

        syncUserList(roomName);
        syncChatHistory(roomName);
    });

    socket.on("leaveRoom", ({ roomName, userName }) => {
        const room = chatRooms[roomName];
        room.removeUser(userName);
        syncUserList(roomName);

        logger.debug(
            `Leave Room. RoomName:[${roomName}], UserName:[${userName}]`
        );

        socket.leave(roomName);
        currentRoom = null;
        currentUser = null;
    });

    socket.on("sendMessage", (text) => {
        if (currentRoom === null || currentUser === null) return;

        const message = new Message(currentUser, text);

        currentRoom?.addMessage(message);
        io.to(currentRoom.name).emit("newMessage", message.toObject());

        logger.debug(
            `Send Message. RoomName:[${currentRoom.name}], UserName:[${currentUser.name}], Text:[${text}]`
        );
    });

    socket.on("disconnect", () => {
        if (currentRoom === null || currentUser === null) return;

        currentRoom.removeUser(currentUser.name);
        syncUserList(currentRoom.name);
    });
});

server.listen(PORT, () => {
    logger.info(`>>>>>>>>>> START SERVER. Env:[${ENV}], Port:[${PORT}]`);
});

process.on("SIGINT", () => {
    logger.info(`<<<<<<<<<< END SERVER.`);
    process.exit();
});
