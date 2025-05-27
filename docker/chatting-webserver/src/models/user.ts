export class User {
	private _name: string;
	private _color: string;

	constructor(name: string) {
		this._name = name;
		this._color = User.getColor(name);
	}

	get name() {
		return this._name;
	}
	get color() {
		return this._color;
	}

	private static getColor(name: string) {
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
		return colors[name.charCodeAt(0) % colors.length];
	}

	toObject() {
		return {
			name: this._name,
			color: this._color,
		};
	}
}
