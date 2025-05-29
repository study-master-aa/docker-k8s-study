import "reflect-metadata";
import { DataSource } from "typeorm";
import { Room } from "./entities/room.entity";
import { User } from "./entities/user.entity";
import { Message } from "./entities/message.entity";
import { RoomUser } from "./entities/roomuser.entity";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [Room, User, RoomUser, Message],
    synchronize: true,
});
