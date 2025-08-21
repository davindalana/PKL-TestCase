const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER, // Ganti dengan user PostgreSQL Anda
  password: process.env.POSTGRES_PASSWORD, // Ganti dengan password PostgreSQL Anda
  database: process.env.POSTGRES_DB,
  port: 5432,
});

console.log("✅ PostgreSQL Connection Pool Created");
module.exports = pool;
