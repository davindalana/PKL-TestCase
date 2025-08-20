// routes/wo.js
const express = require('express');
const { mysqlPool, getDb } = require('../config/db'); // Ambil getDb untuk MongoDB

const router = express.Router();

// --- ENDPOINT UNTUK LIHAT WO (MENGGABUNGKAN MYSQL + MONGODB) ---
router.get('/', async (req, res) => {
    try {
        // 1. Ambil semua data utama dari MySQL
        console.log("Mengambil data dari MySQL...");
        const [workOrders] = await mysqlPool.query('SELECT * FROM work_orders ORDER BY reported_date DESC');

        // 2. Ambil semua data alamat dari MongoDB
        console.log("Mengambil data alamat dari MongoDB...");
        const db = getDb();
        const addressCollection = db.collection('addresses'); // Asumsi nama koleksi 'addresses'
        const addressDocs = await addressCollection.find({}).toArray();

        // 3. Buat 'peta' alamat untuk pencarian cepat (lebih efisien)
        const addressMap = new Map();
        for (const doc of addressDocs) {
            // Asumsi dokumen di MongoDB punya field 'service_no' dan 'alamat'
            if (doc.service_no && doc.alamat) {
                addressMap.set(doc.service_no, doc.alamat);
            }
        }
        console.log(`Ditemukan ${addressMap.size} alamat unik di MongoDB.`);

        // 4. Gabungkan data
        const enrichedWorkOrders = workOrders.map(wo => {
            // Cari alamat di 'peta' menggunakan 'service_no' dari MySQL
            const alamatDariMongo = addressMap.get(wo.service_no);
            return {
                ...wo,
                // Timpa alamat dari MySQL dengan alamat dari Mongo jika ada
                alamat: alamatDariMongo || wo.alamat || null, 
            };
        });

        res.status(200).json(enrichedWorkOrders);

    } catch (error) {
        console.error('Error saat mengambil atau menggabungkan data:', error);
        res.status(500).json({ message: 'Gagal mengambil data.' });
    }
});

// --- ENDPOINT UNTUK INPUT WO (MENYIMPAN KE MYSQL) ---
// (Tidak ada perubahan di sini, endpoint POST tetap sama)
router.post('/', async (req, res) => {
    // ... kode POST Anda tetap di sini ...
});

module.exports = router;