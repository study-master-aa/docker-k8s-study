import mysql from "mysql2/promise";

try {
	const connection = await mysql.createConnection({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		port: process.env.DB_PORT,
	});
	console.log("DB 연결 성공!");

	const [results] = await connection.query(
		"SELECT DATABASE() AS db, VERSION() AS version",
	);
	console.log("현재 DB:", results[0].db);
	console.log("MySQL 버전:", results[0].version);

	await connection.end();
} catch (err) {
	console.error("DB 연결 또는 쿼리 실패:", err);
}
