// routes/wo.js
const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const { mysqlPool } = require('../config/db');

const router = express.Router();

// --- FUNGSI UNTUK MEMBACA GOOGLE SHEETS ---
async function getSheetData() {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, '../config/credentials.json'),
            scopes: 'https://www.googleapis.com/auth/spreadsheets.readonly',
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: '1zaj-PamtaEyFccWNEE3qpAeaatcfHWLFs7FfwN_nIQc', // ID Spreadsheet Anda
            range: 'data_pkl!A:I', // Sesuaikan dengan nama Sheet dan jangkauan kolom
        });

        return response.data.values;
    } catch (err) {
        console.error('Gagal mengambil data dari Google Sheet:', err);
        return null;
    }
}

// --- ENDPOINT UNTUK LIHAT WO (MENGGABUNGKAN DATA) ---
router.get('/', async (req, res) => {
    try {
        // 1. Ambil semua data utama dari MySQL
        const [workOrders] = await mysqlPool.query('SELECT * FROM work_orders ORDER BY reported_date DESC');

        // 2. Ambil semua data alamat dari Google Sheets
        const sheetData = await getSheetData();

        // 3. Buat 'peta' alamat untuk pencarian cepat
        const addressMap = new Map();
        if (sheetData && sheetData.length > 1) {
            const headers = sheetData[0];
            // ===== PERUBAHAN 1: Cari header 'name' bukan 'id' =====
            const nameIndex = headers.indexOf('name');
            const alamatIndex = headers.indexOf('ALAMAT');

            if (nameIndex === -1 || alamatIndex === -1) {
                throw new Error("Kolom 'name' atau 'ALAMAT' tidak ditemukan di Google Sheet");
            }

            for (let i = 1; i < sheetData.length; i++) {
                const row = sheetData[i];
                // ===== PERUBAHAN 2: Ambil nilai dari kolom 'name' =====
                const name = row[nameIndex];
                const alamat = row[alamatIndex];

                // ===== PERUBAHAN 3: Gunakan 'name' sebagai kunci peta =====
                if (name) {
                    addressMap.set(name.toString(), alamat);
                }
            }
        }

        // 4. Gabungkan data
        const enrichedWorkOrders = workOrders.map(wo => {
            // Cari alamat di 'peta' menggunakan 'service_no'
            const alamatDariSheet = addressMap.get(wo.service_no);
            return {
                ...wo,
                alamat: alamatDariSheet || wo.alamat,
            };
        });

        res.status(200).json(enrichedWorkOrders);

    } catch (error) {
        console.error('Error saat mengambil atau menggabungkan data:', error);
        res.status(500).json({ message: 'Gagal mengambil data.' });
    }
});

// --- ENDPOINT UNTUK INPUT WO (MENYIMPAN KE MYSQL) ---
router.post('/', async (req, res) => {
    const workOrders = req.body;

    if (!Array.isArray(workOrders) || workOrders.length === 0) {
        return res.status(400).json({ message: 'Input tidak valid.' });
    }

    const allColumns = [
        'incident', 'ttr_customer', 'summary', 'reported_date', 'owner_group', 'owner', 'customer_segment', 'service_type',
        'witel', 'workzone', 'status', 'status_date', 'ticket_id_gamas', 'reported_by', 'contact_phone', 'contact_name',
        'contact_email', 'booking_date', 'description_assignment', 'reported_priority', 'source_ticket', 'subsidiary',
        'external_ticket_id', 'channel', 'customer_type', 'closed_by', 'closed_reopen_by', 'customer_id', 'customer_name',
        'service_id', 'service_no', 'slg', 'technology', 'lapul', 'gaul', 'onu_rx', 'pending_reason', 'date_modified',
        'incident_domain', 'region', 'symptom', 'hierarchy_path', 'solution', 'description_actual_solution', 'kode_produk',
        'perangkat', 'technician', 'device_name', 'worklog_summary', 'last_update_worklog', 'classification_flag', 'realm',
        'related_to_gamas', 'tsc_result', 'scc_result', 'ttr_agent', 'ttr_mitra', 'ttr_nasional', 'ttr_pending', 'ttr_region',
        'ttr_witel', 'ttr_end_to_end', 'note', 'guarantee_status', 'resolve_date', 'sn_ont', 'tipe_ont', 'manufacture_ont',
        'impacted_site', 'cause', 'resolution', 'notes_eskalasi', 'rk_information', 'external_ticket_tier_3', 'customer_category',
        'classification_path', 'territory_near_end', 'territory_far_end', 'urgency', 'alamat'
        // Kolom alamat di sini akan diisi null saat input, lalu diperkaya dari Google Sheet saat ditampilkan
    ];

    const connection = await mysqlPool.getConnection();
    try {
        const query = `
      INSERT INTO work_orders (${allColumns.join(', ')}) 
      VALUES ?
      ON DUPLICATE KEY UPDATE
        summary = VALUES(summary), status = VALUES(status), 
        resolve_date = VALUES(resolve_date), technician = VALUES(technician),
        worklog_summary = VALUES(worklog_summary) 
    `;

        const values = workOrders.map(wo => {
            return allColumns.map(col => wo[col] || null);
        });

        await connection.query(query, [values]);
        res.status(201).json({ message: 'Data berhasil disimpan ke MySQL.' });

    } catch (error) {
        console.error('Error saat menyimpan ke MySQL:', error);
        res.status(500).json({ message: 'Terjadi kesalahan di server.' });
    } finally {
        connection.release();
    }
});

module.exports = router;