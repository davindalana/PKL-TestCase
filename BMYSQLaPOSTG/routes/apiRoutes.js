const express = require("express");
const router = express.Router();
const postgresPool = require("../config/dbPostgres");
const mysqlPool = require("../config/dbMysql");

/**
 * ENDPOINT 1: Menerima data dari Google Sheet dan menyimpan ke PostgreSQL
 * Metode: POST
 * URL: /api/save-to-postgres
 */
router.post("/save-to-postgres", async (req, res) => {
  const data = req.body; // Data diharapkan berupa array of objects

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ success: false, message: "Data tidak valid." });
  }

  const client = await postgresPool.connect();
  try {
    await client.query('BEGIN'); // Mulai transaksi
    let processedCount = 0;
    for (const row of data) {
      if (row.service_no) {
        const query = `
          INSERT INTO data_layanan (service_no, alamat) VALUES ($1, $2)
          ON CONFLICT (service_no) DO UPDATE SET alamat = EXCLUDED.alamat;
        `;
        await client.query(query, [row.service_no, row.alamat || null]);
        processedCount++;
      }
    }
    await client.query('COMMIT'); // Simpan semua perubahan
    res.status(201).json({ success: true, message: `${processedCount} baris data berhasil disimpan ke PostgreSQL.` });
  } catch (err) {
    await client.query('ROLLBACK'); // Batalkan jika ada error
    console.error("Gagal menyimpan ke PostgreSQL:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

/**
 * ENDPOINT 2: Menyinkronkan data dari PostgreSQL ke MySQL
 * Metode: POST
 * URL: /api/sync-to-mysql
 */
router.post("/sync-to-mysql", async (req, res) => {
  try {
    // 1. Ambil data dari PostgreSQL yang memiliki service_no dan alamat yang valid
    const { rows: postgresRows } = await postgresPool.query(
      "SELECT service_no, alamat FROM data_layanan WHERE service_no IS NOT NULL AND alamat IS NOT NULL"
    );

    if (postgresRows.length === 0) {
      return res.json({
        success: true,
        message: "Tidak ada data di PostgreSQL untuk disinkronkan.",
      });
    }

    const conn = await mysqlPool.getConnection();
    let updatedCount = 0;
    try {
      await conn.beginTransaction();

      for (const row of postgresRows) {
        const query = "UPDATE work_orders SET alamat = ? WHERE service_no = ?";
        const [result] = await conn.query(query, [row.alamat, row.service_no]);

        if (result.affectedRows > 0) {
          updatedCount++;
        }
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    res.json({
      success: true,
      message: `Sinkronisasi selesai. ${updatedCount} alamat di MySQL berhasil diperbarui berdasarkan service_no yang cocok.`,
    });

  } catch (err) {
    console.error("Gagal sinkronisasi ke MySQL:", err);
    res.status(500).json({ success: false, error: "Terjadi kesalahan pada server saat sinkronisasi." });
  }
});


router.get("/view-postgres", async (req, res) => {
  try {
    const { rows } = await postgresPool.query("SELECT * FROM data_layanan");
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error("Gagal mengambil data dari PostgreSQL:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/view-mysql", async (req, res) => {
  try {
    const [rows] = await mysqlPool.query("SELECT * FROM work_orders");
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error("Gagal mengambil data dari MySQL:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * ENDPOINT 3: Menerima data Work Order dan menyimpan ke MySQL
 * Metode: POST
 * URL: /api/work-orders
 */
router.post("/work-orders", async (req, res) => {
  const data = req.body; 

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ success: false, message: "Data harus berupa array dan tidak boleh kosong." });
  }

  const columns = [
    'incident', 'ticket_id_gamas', 'external_ticket_id', 'customer_id', 'customer_name',
    'service_id', 'service_no', 'summary', 'description_assignment', 'reported_date',
    'reported_by', 'reported_priority', 'source_ticket', 'channel', 'contact_phone',
    'contact_name', 'contact_email', 'status', 'status_date', 'booking_date', 'resolve_date',
    'date_modified', 'last_update_worklog', 'closed_by', 'closed_reopen_by',
    'guarantee_status', 'ttr_customer', 'ttr_agent', 'ttr_mitra', 'ttr_nasional',
    'ttr_pending', 'ttr_region', 'ttr_witel', 'ttr_end_to_end', 'owner_group', 'owner',
    'witel', 'workzone', 'region', 'subsidiary', 'territory_near_end', 'territory_far_end',
    'customer_segment', 'customer_type', 'customer_category', 'service_type', 'slg',
    'technology', 'lapul', 'gaul', 'onu_rx', 'pending_reason', 'incident_domain', 'symptom',
    'hierarchy_path', 'solution', 'description_actual_solution', 'kode_produk', 'perangkat',
    'technician', 'device_name', 'sn_ont', 'tipe_ont', 'manufacture_ont', 'impacted_site',
    'cause', 'resolution', 'worklog_summary', 'classification_flag', 'realm',
    'related_to_gamas', 'tsc_result', 'scc_result', 'note', 'notes_eskalasi',
    'rk_information', 'external_ticket_tier_3', 'classification_path', 'urgency', 'alamat',
    'korlap' // <-- Perubahan ditambahkan di sini
  ];

  const conn = await mysqlPool.getConnection();
  try {
    await conn.beginTransaction(); 

    let processedCount = 0;
    for (const row of data) {
      const keys = Object.keys(row).filter(key => columns.includes(key));
      const values = keys.map(key => row[key]);

      if (keys.length === 0 || !row.incident) continue;

      const query = `
        INSERT INTO work_orders (${keys.join(', ')})
        VALUES (${keys.map(() => '?').join(', ')})
        ON DUPLICATE KEY UPDATE
        ${keys.filter(k => k !== 'incident').map(k => `${k} = VALUES(${k})`).join(', ')};
      `;

      await conn.query(query, values);
      processedCount++;
    }

    await conn.commit(); 
    res.status(201).json({ success: true, message: `${processedCount} baris work order berhasil diproses.` });
  } catch (err) {
    await conn.rollback(); 
    console.error("Gagal menyimpan work orders:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});


/**
 * ENDPOINT: Mengedit Work Order DAN Sinkronisasi Alamat
 * Metode: PUT
 * URL: /api/work-orders/:incident
 */
router.put("/work-orders/:incident", async (req, res) => {
    const { incident } = req.params;
    const data = req.body;

    delete data.incident;

    const allColumns = [
        'ticket_id_gamas', 'external_ticket_id', 'customer_id', 'customer_name', 'service_id', 'service_no', 'summary', 
        'description_assignment', 'reported_date', 'reported_by', 'reported_priority', 'source_ticket', 'channel', 
        'contact_phone', 'contact_name', 'contact_email', 'status', 'status_date', 'booking_date', 'resolve_date', 
        'date_modified', 'last_update_worklog', 'closed_by', 'closed_reopen_by', 'guarantee_status', 'ttr_customer', 
        'ttr_agent', 'ttr_mitra', 'ttr_nasional', 'ttr_pending', 'ttr_region', 'ttr_witel', 'ttr_end_to_end', 
        'owner_group', 'owner', 'witel', 'workzone', 'region', 'subsidiary', 'territory_near_end', 'territory_far_end', 
        'customer_segment', 'customer_type', 'customer_category', 'service_type', 'slg', 'technology', 'lapul', 'gaul', 
        'onu_rx', 'pending_reason', 'incident_domain', 'symptom', 'hierarchy_path', 'solution', 
        'description_actual_solution', 'kode_produk', 'perangkat', 'technician', 'device_name', 'sn_ont', 'tipe_ont', 
        'manufacture_ont', 'impacted_site', 'cause', 'resolution', 'worklog_summary', 'classification_flag', 'realm', 
        'related_to_gamas', 'tsc_result', 'scc_result', 'note', 'notes_eskalasi', 'rk_information', 
        'external_ticket_tier_3', 'classification_path', 'urgency', 'alamat',
        'korlap' // <-- Perubahan ditambahkan di sini
    ];
    const dateColumns = ['reported_date', 'status_date', 'booking_date', 'resolve_date', 'date_modified'];

    const keys = Object.keys(data).filter(key => allColumns.includes(key));
    if (keys.length === 0) {
        return res.status(400).json({ success: false, message: "Tidak ada data valid untuk diperbarui." });
    }

    const values = keys.map(key => {
        const value = data[key];
        if (dateColumns.includes(key) && typeof value === 'string' && value.includes('T')) {
            try { return new Date(value).toISOString().slice(0, 19).replace('T', ' '); } catch (e) { return value; }
        }
        return value;
    });

    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const updateQuery = `UPDATE work_orders SET ${setClauses} WHERE incident = ?`;

    const conn = await mysqlPool.getConnection();
    try {
        await conn.beginTransaction();
        const [result] = await conn.query(updateQuery, [...values, incident]);

        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: `Work order dengan incident ${incident} tidak ditemukan.` });
        }

        let syncMessage = "Work order berhasil diperbarui.";

        if (data.service_no) {
            const { rows: postgresRows } = await postgresPool.query(
                "SELECT alamat FROM data_layanan WHERE service_no = $1 AND alamat IS NOT NULL", [data.service_no]
            );

            if (postgresRows.length > 0) {
                const alamatFromPostgres = postgresRows[0].alamat;
                const syncQuery = "UPDATE work_orders SET alamat = ? WHERE service_no = ?";
                const [syncResult] = await conn.query(syncQuery, [alamatFromPostgres, data.service_no]);
                if (syncResult.affectedRows > 0) {
                    syncMessage += ` Alamat untuk service_no ${data.service_no} juga berhasil disinkronkan.`;
                }
            }
        }

        await conn.commit();
        res.json({ success: true, message: syncMessage });

    } catch (err) {
        await conn.rollback();
        console.error("Gagal mengedit work order dan sinkronisasi:", err);
        res.status(500).json({ success: false, error: err.message, sqlMessage: err.sqlMessage });
    } finally {
        conn.release();
    }
});


/**
 * ENDPOINT: Menghapus Work Order dari MySQL
 * Metode: DELETE
 * URL: /api/work-orders/:incident
 */
router.delete("/work-orders/:incident", async (req, res) => {
  const { incident } = req.params;

  try {
    const [result] = await mysqlPool.query("DELETE FROM work_orders WHERE incident = ?", [incident]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: `Work order dengan incident ${incident} tidak ditemukan.` });
    }

    res.json({ success: true, message: `Work order dengan incident ${incident} berhasil dihapus.` });
  } catch (err) {
    console.error("Gagal menghapus work order:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


/**
 * ENDPOINT: Menerima & Sinkronisasi Massal Work Order
 * Metode: POST
 * URL: /api/mypost
 */
router.post("/mypost", async (req, res) => {
  const data = req.body; 

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ success: false, message: "Data harus berupa array dan tidak boleh kosong." });
  }

  const allColumns = [
    'incident', 'ticket_id_gamas', 'external_ticket_id', 'customer_id', 'customer_name', 'service_id', 'service_no', 'summary', 'description_assignment', 'reported_date', 'reported_by', 'reported_priority', 'source_ticket', 'channel', 'contact_phone', 'contact_name', 'contact_email', 'status', 'status_date', 'booking_date', 'resolve_date', 'date_modified', 'last_update_worklog', 'closed_by', 'closed_reopen_by', 'guarantee_status', 'ttr_customer', 'ttr_agent', 'ttr_mitra', 'ttr_nasional', 'ttr_pending', 'ttr_region', 'ttr_witel', 'ttr_end_to_end', 'owner_group', 'owner', 'witel', 'workzone', 'region', 'subsidiary', 'territory_near_end', 'territory_far_end', 'customer_segment', 'customer_type', 'customer_category', 'service_type', 'slg', 'technology', 'lapul', 'gaul', 'onu_rx', 'pending_reason', 'incident_domain', 'symptom', 'hierarchy_path', 'solution', 'description_actual_solution', 'kode_produk', 'perangkat', 'technician', 'device_name', 'sn_ont', 'tipe_ont', 'manufacture_ont', 'impacted_site', 'cause', 'resolution', 'worklog_summary', 'classification_flag', 'realm', 'related_to_gamas', 'tsc_result', 'scc_result', 'note', 'notes_eskalasi', 'rk_information', 'external_ticket_tier_3', 'classification_path', 'urgency', 'alamat',
    'korlap' // <-- Perubahan ditambahkan di sini
  ];

  const conn = await mysqlPool.getConnection();
  try {
    await conn.beginTransaction();

    let processedCount = 0;
    const serviceNosToSync = new Set(); 

    for (const row of data) {
      const validKeys = Object.keys(row).filter(key => allColumns.includes(key) && key !== 'alamat');

      if (validKeys.length === 0 || !row.incident) continue;

      if (row.service_no) {
        serviceNosToSync.add(row.service_no);
      }

      const values = validKeys.map(key => row[key]);
      const keysToUpdate = validKeys.filter(k => k !== 'incident');

      let query = `INSERT INTO work_orders (${validKeys.join(', ')}) VALUES (${validKeys.map(() => '?').join(', ')})`;
      if (keysToUpdate.length > 0) {
        query += ` ON DUPLICATE KEY UPDATE ${keysToUpdate.map(k => `${k} = VALUES(${k})`).join(', ')}`;
      }

      await conn.query(query, values);
      processedCount++;
    }
    
    let addressUpdatedCount = 0;
    if (serviceNosToSync.size > 0) {
      const serviceNoArray = Array.from(serviceNosToSync);

      const { rows: postgresRows } = await postgresPool.query(
        'SELECT service_no, alamat FROM data_layanan WHERE service_no = ANY($1)',
        [serviceNoArray]
      );

      if (postgresRows.length > 0) {
        for (const pgRow of postgresRows) {
          const updateQuery = "UPDATE work_orders SET alamat = ? WHERE service_no = ?";
          const [result] = await conn.query(updateQuery, [pgRow.alamat, pgRow.service_no]);
          if (result.affectedRows > 0) {
            addressUpdatedCount++;
          }
        }
      }
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      message: `Operasi selesai. ${processedCount} baris work order diproses dan ${addressUpdatedCount} alamat berhasil disinkronkan.`
    });

  } catch (err) {
    await conn.rollback();
    console.error("Gagal memproses work orders:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

/**
 * ENDPOINT: Menerima data workzones
 * Metode: GET
 * URL: /api/workzones
 */
router.get("/workzones", async (req, res) => {
  try {
    // Gunakan mysqlPool dan format query untuk mysql2
    const [rows] = await mysqlPool.query( // <-- Ganti menjadi mysqlPool
      "SELECT DISTINCT workzone FROM workzone_details ORDER BY workzone ASC"
    );
    
    // Kirim sebagai array ["BLB", "BTU", "GDG", ...]
    res.json(rows.map(w => w.workzone));

  } catch (err) {
    console.error("Gagal mengambil daftar workzone:", err);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

module.exports = router;