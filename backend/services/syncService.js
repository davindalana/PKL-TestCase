// services/syncService.js
const { mysqlPool } = require('../config/db');
const { getDb } = require('../config/db');

async function syncWorkOrders(workOrders) {
  // Pastikan inputnya adalah array dan tidak kosong
  if (!Array.isArray(workOrders) || workOrders.length === 0) {
    throw new Error('Data input tidak valid.');
  }

  const connection = await mysqlPool.getConnection();

  try {
    console.log('Memulai proses update MySQL...');
    // 1. UPDATE DATA DI MYSQL
    for (const wo of workOrders) {
      // Pastikan ada ID dan Alamat sebelum update
      if (wo.id && wo.alamat) {
        await connection.execute(
          'UPDATE orders SET alamat = ? WHERE id = ?',
          [wo.alamat, wo.id]
        );
      }
    }
    console.log('✅ Update MySQL selesai.');

    // 2. AMBIL DATA LENGKAP DARI MYSQL
    const ids = workOrders.map(wo => wo.id).filter(id => id); // Ambil semua ID yang valid
    const [updatedRows] = await connection.query(
      'SELECT id, nama, alamat, incident, summary, reported_date FROM orders WHERE id IN (?)',
      [ids]
    );

    // 3. SINKRONKAN KE MONGODB
    if (updatedRows.length > 0) {
      const db = getDb();
      const woCollection = db.collection('work_orders');
      
      const bulkOps = updatedRows.map(row => ({
        updateOne: {
          filter: { id: row.id }, // Cocokkan berdasarkan ID
          update: { $set: row },   // Update dengan data baru dari MySQL
          upsert: true,             // Jika belum ada, buat baru
        },
      }));

      await woCollection.bulkWrite(bulkOps);
      console.log('✅ Sinkronisasi ke MongoDB selesai.');
    }
  } finally {
    connection.release(); // Selalu lepaskan koneksi setelah selesai
  }
}

module.exports = { syncWorkOrders };