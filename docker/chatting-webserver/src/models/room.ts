import { Message } from "./message";
import { User } from "./user";

export class Room {
    private _name: string;
    private _users: User[] = [];
    private _messages: Message[] = [];

    constructor(name: string) {
        this._name = name;
    }

    get name() {
        return this._name;
    }

    get users() {
        return Array.from(this._users);
    }

    get messages() {
        return Array.from(this._messages);
    }

    addUser(user: User) {
        this._users.push(user);
    }

    removeUser(userName: string) {
        this._users = this._users.filter((user) => user.name !== userName);
    }

    hasUser(userName: string) {
        return this._users.some((user) => user.name === userName);
    }

    addMessage(message: Message) {
        this._messages.push(message);
    }

    toObject() {
        return {
            name: this._name,
            users: this.users,
            messages: this.messages,
        };
    }
}
