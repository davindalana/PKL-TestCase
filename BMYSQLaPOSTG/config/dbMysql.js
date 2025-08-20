// Menggunakan mysql2/promise untuk async/await
const mysql = require("mysql2/promise");

// Membuat "pool" koneksi untuk efisiensi
const pool = mysql.createPool({
  host: "localhost",
  user: "root", // Ganti dengan user MySQL Anda
  password: "1234", // Ganti dengan password MySQL Anda
  database: "db_PKL",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log("✅ MySQL Connection Pool Created");
module.exports = pool;
