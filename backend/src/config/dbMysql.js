// Menggunakan mysql2/promise untuk async/await
import mysql from "mysql2/promise";

// Membuat "pool" koneksi untuk efisiensi
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER, // Ganti dengan user MySQL Anda
  password: process.env.MYSQL_PASSWORD, // Ganti dengan password MySQL Anda
  database: process.env.MYSQL_DB,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log("✅ MySQL Connection Pool Created");
module.exports = pool;
