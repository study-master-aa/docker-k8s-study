import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const SERVICE_API = process.env.SERVICE_API || "";

// 메모리 내 데이터
const chatRooms: Record<
    string,
    { users: string[]; messages: { user: string; text: string }[] }
> = {};

// 초기 채팅방 목록 (서버 시작 시 생성)
const initialRooms = ["일반", "개발", "디자인"];
for (const room of initialRooms) {
    chatRooms[room] = { users: [], messages: [] };
}

app.use(express.static("public"));

// 채팅방 목록 API
app.get("/api/rooms", (req: express.Request, res: express.Response) => {
    res.json(Object.keys(chatRooms));
});

// 유저 닉네임별 색상 고정 (서버에서 색상 결정)
const getUserColor = (name: string) => {
    const colors = [
        "#1976d2",
        "#d32f2f",
        "#388e3c",
        "#fbc02d",
        "#7b1fa2",
        "#0097a7",
        "#c2185b",
        "#5d4037",
        "#455a64",
    ];

    return colors[Math.abs(name.charCodeAt(0)) % colors.length];
};

// 소켓 이벤트 처리
io.on("connection", (socket) => {
    let currentRoom = "";
    let username = "";

    const emitUserList = (room: string) => {
        io.to(room).emit(
            "userList",
            chatRooms[room].users.map((u) => ({
                name: u,
                color: getUserColor(u),
            }))
        );
    };
    const emitChatHistory = (room: string) => {
        socket.emit(
            "chatHistory",
            chatRooms[room].messages.map((m) => ({
                ...m,
                color: getUserColor(m.user),
            }))
        );
    };

    socket.on("joinRoom", ({ room, user }) => {
        currentRoom = room;
        username = user;
        if (!chatRooms[room]) chatRooms[room] = { users: [], messages: [] };
        if (!chatRooms[room].users.includes(user))
            chatRooms[room].users.push(user);
        socket.join(room);
        emitUserList(room);
        emitChatHistory(room);
    });

    socket.on("leaveRoom", ({ room, user }) => {
        if (room && user) {
            const users = chatRooms[room]?.users;
            if (users) {
                chatRooms[room].users = users.filter((u) => u !== user);
                emitUserList(room);
            }
            socket.leave(room);
            currentRoom = "";
        }
    });

    socket.on("sendMessage", (text) => {
        if (!currentRoom || !username) return;
        const msg = { user: username, text };
        chatRooms[currentRoom].messages.push(msg);
        io.to(currentRoom).emit("newMessage", {
            ...msg,
            color: getUserColor(username),
        });
    });

    socket.on("disconnect", () => {
        if (currentRoom && username) {
            const users = chatRooms[currentRoom]?.users;
            if (users) {
                chatRooms[currentRoom].users = users.filter(
                    (u) => u !== username
                );
                emitUserList(currentRoom);
            }
        }
    });
});

app.get("/api/service-api", (req: express.Request, res: express.Response) => {
    res.json({ SERVICE_API });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
