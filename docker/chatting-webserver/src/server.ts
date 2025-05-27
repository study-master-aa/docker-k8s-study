import express from "express";
import http from "http";
import { Server } from "socket.io";
import { User } from "./models/user";
import { Message, Room } from "./models/room";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// 메모리 내 데이터
const chatRooms: Record<string, Room> = {};

// 초기 채팅방 목록 (서버 시작 시 생성)
const roomNames = ["일반", "개발", "디자인"];
roomNames.forEach((roomName) => {
	chatRooms[roomName] = new Room(roomName);
});

// 채팅방 목록 API
app.get("/api/rooms", (req: express.Request, res: express.Response) => {
	const rooms = Object.keys(chatRooms).map((roomName) =>
		chatRooms[roomName].toObject(),
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
			chatRooms[roomName].users.map((user) => user.toObject()),
		);
	};
	const syncChatHistory = (roomName: string) => {
		socket.emit(
			"chatHistory",
			chatRooms[roomName].messages.map((message) => message.toObject()),
		);
	};

	socket.on("joinRoom", ({ roomName, userName }) => {
		currentRoom = chatRooms[roomName];
		currentUser = new User(userName);

		chatRooms[roomName].addUser(currentUser);
		socket.join(roomName);

		syncUserList(roomName);
		syncChatHistory(roomName);
	});

	socket.on("leaveRoom", ({ roomName, userName }) => {
		const room = chatRooms[roomName];
		room.removeUser(userName);
		syncUserList(roomName);

		socket.leave(roomName);
		currentRoom = null;
		currentUser = null;
	});

	socket.on("sendMessage", (text) => {
		if (currentRoom === null || currentUser === null) return;

		const message = new Message(currentUser, text);

		currentRoom?.addMessage(message);
		io.to(currentRoom.name).emit("newMessage", message.toObject());
	});

	socket.on("disconnect", () => {
		if (currentRoom === null || currentUser === null) return;

		currentRoom.removeUser(currentUser.name);
		syncUserList(currentRoom.name);
	});
});

server.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
