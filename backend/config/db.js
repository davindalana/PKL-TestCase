// config/db.js
const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');

// Koneksi MySQL (tidak berubah)
const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Koneksi ke MongoDB (baru)
const mongoClient = new MongoClient(process.env.MONGO_URI);
let mongoDb;

async function connectToMongo() {
  try {
    await mongoClient.connect();
    mongoDb = mongoClient.db(process.env.MONGO_DB_NAME);
    console.log('✅ Berhasil terhubung ke MongoDB');
  } catch (e) {
    console.error('❌ Gagal terhubung ke MongoDB', e);
    process.exit(1);
  }
}

// Ekspor semua fungsi dan koneksi
module.exports = {
  mysqlPool,
  connectToMongo,
  getDb: () => mongoDb,
};