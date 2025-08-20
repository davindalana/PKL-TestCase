const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres", // Ganti dengan user PostgreSQL Anda
  host: "localhost",
  database: "pkl_testcase",
  password: "123", // Ganti dengan password PostgreSQL Anda
  port: 5432,
});

console.log("✅ PostgreSQL Connection Pool Created");
module.exports = pool;
