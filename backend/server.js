// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// Import connectToMongo dari db.js
const { mysqlPool, connectToMongo } = require('./config/db');
const woRoutes = require('./routes/wo');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/api/wo', woRoutes);

// Jalankan koneksi MongoDB terlebih dahulu
connectToMongo().then(() => {
  app.listen(PORT, async () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    try {
      await mysqlPool.query('SELECT 1');
      console.log('✅ Berhasil terhubung ke MySQL');
    } catch (err) {
      console.error('❌ Gagal terhubung ke MySQL:', err.message);
    }
  });
});