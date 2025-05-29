import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "rooms" })
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 20 })
    name: string;
}
