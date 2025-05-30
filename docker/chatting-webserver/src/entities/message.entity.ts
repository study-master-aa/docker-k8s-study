import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { Room } from "./room.entity";
import { User } from "./user.entity";

@Entity({ name: "messages" })
export class Message {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 200 })
    text!: string;

    @Column({ type: "datetime" })
    date!: Date;

    @ManyToOne(() => Room)
    @JoinColumn({ name: "roomId" })
    room!: Room;

    @ManyToOne(() => User)
    @JoinColumn({ name: "userId" })
    user!: User;
}
