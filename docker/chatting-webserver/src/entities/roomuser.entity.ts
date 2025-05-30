import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Room } from "./room.entity";
import { User } from "./user.entity";

@Entity({ name: "room_users" })
export class RoomUser {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Room, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "roomId" })
    room!: Room;

    @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user!: User;
}
