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
