import { User } from "./user";

export class Message {
	private _user: User;
	private _text: string;
	private _timestamp: number;

	constructor(user: User, text: string) {
		this._user = user;
		this._text = text;
		this._timestamp = Date.now();
	}

	get user() {
		return this._user;
	}
	get text() {
		return this._text;
	}
	get timestamp() {
		return this._timestamp;
	}

	toObject() {
		return {
			user: this._user.toObject(),
			text: this._text,
			timestamp: this._timestamp,
		};
	}
}

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
