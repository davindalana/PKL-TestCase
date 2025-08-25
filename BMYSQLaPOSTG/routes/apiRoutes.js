const express = require("express");
const router = express.Router();
const mysqlPool = require("../config/dbMysql");

/**
 * ENDPOINT: Menerima data alamat dan menyimpan ke tabel 'data_layanan' di MySQL.
 * Metode: POST
 * URL: /api/save-addresses-to-mysql
 */
router.post("/save-addresses-to-mysql", async (req, res) => {
  const data = req.body;

  if (!Array.isArray(data) || data.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Data tidak valid." });
  }

  // Menggunakan koneksi dari MySQL Pool
  const conn = await mysqlPool.getConnection();
  try {
    await conn.beginTransaction();

    let processedCount = 0;
    for (const row of data) {
      if (row.service_no) {
        // ==> PERBAIKAN UTAMA DI SINI <==
        // Menggunakan sintaks SQL yang benar untuk MySQL
        const query = `
          INSERT INTO data_layanan (service_no, alamat) VALUES (?, ?)
          ON DUPLICATE KEY UPDATE alamat = VALUES(alamat);
        `;
        // Menggunakan placeholder '?' yang sesuai dengan library mysql2
        await conn.query(query, [row.service_no, row.alamat || null]);
        processedCount++;
      }
    }

    await conn.commit();
    res.status(201).json({
      success: true,
      message: `${processedCount} baris data alamat berhasil disimpan ke tabel data_layanan di MySQL.`,
    });
  } catch (err) {
    await conn.rollback();
    console.error("Gagal menyimpan ke data_layanan MySQL:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

/**
 * ENDPOINT: Menyinkronkan semua alamat dari 'data_layanan' ke 'work_orders' (MySQL-only)
 * Metode: POST
 * URL: /api/sync-to-mysql
 */
router.post("/sync-to-mysql", async (req, res) => {
  const conn = await mysqlPool.getConnection();
  try {
    // Satu query UPDATE JOIN yang efisien untuk menyinkronkan semua data sekaligus
    const query = `
      UPDATE work_orders wo
      JOIN data_layanan dl ON wo.service_no = dl.service_no
      SET wo.alamat = dl.alamat
      WHERE wo.alamat IS NULL OR wo.alamat != dl.alamat;
    `;

    const [result] = await conn.query(query);

    res.json({
      success: true,
      message: `Sinkronisasi selesai. ${result.affectedRows} alamat di MySQL berhasil diperbarui.`,
    });
  } catch (err) {
    console.error("Gagal sinkronisasi alamat di MySQL:", err);
    res
      .status(500)
      .json({
        success: false,
        error: "Terjadi kesalahan pada server saat sinkronisasi.",
      });
  } finally {
    if (conn) conn.release();
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
    return res
      .status(400)
      .json({
        success: false,
        message: "Data harus berupa array dan tidak boleh kosong.",
      });
  }

  const columns = [
    "incident",
    "ticket_id_gamas",
    "external_ticket_id",
    "customer_id",
    "customer_name",
    "service_id",
    "service_no",
    "summary",
    "description_assignment",
    "reported_date",
    "reported_by",
    "reported_priority",
    "source_ticket",
    "channel",
    "contact_phone",
    "contact_name",
    "contact_email",
    "status",
    "status_date",
    "booking_date",
    "resolve_date",
    "date_modified",
    "last_update_worklog",
    "closed_by",
    "closed_reopen_by",
    "guarantee_status",
    "ttr_customer",
    "ttr_agent",
    "ttr_mitra",
    "ttr_nasional",
    "ttr_pending",
    "ttr_region",
    "ttr_witel",
    "ttr_end_to_end",
    "owner_group",
    "owner",
    "witel",
    "workzone",
    "region",
    "subsidiary",
    "territory_near_end",
    "territory_far_end",
    "customer_segment",
    "customer_type",
    "customer_category",
    "service_type",
    "slg",
    "technology",
    "lapul",
    "gaul",
    "onu_rx",
    "pending_reason",
    "incident_domain",
    "symptom",
    "hierarchy_path",
    "solution",
    "description_actual_solution",
    "kode_produk",
    "perangkat",
    "technician",
    "device_name",
    "sn_ont",
    "tipe_ont",
    "manufacture_ont",
    "impacted_site",
    "cause",
    "resolution",
    "worklog_summary",
    "classification_flag",
    "realm",
    "related_to_gamas",
    "tsc_result",
    "scc_result",
    "note",
    "notes_eskalasi",
    "rk_information",
    "external_ticket_tier_3",
    "classification_path",
    "urgency",
    "alamat",
    "korlap", // <-- Perubahan ditambahkan di sini
  ];

  const conn = await mysqlPool.getConnection();
  try {
    await conn.beginTransaction();

    let processedCount = 0;
    for (const row of data) {
      const keys = Object.keys(row).filter((key) => columns.includes(key));
      const values = keys.map((key) => row[key]);

      if (keys.length === 0 || !row.incident) continue;

      const query = `
        INSERT INTO work_orders (${keys.join(", ")})
        VALUES (${keys.map(() => "?").join(", ")})
        ON DUPLICATE KEY UPDATE
        ${keys
          .filter((k) => k !== "incident")
          .map((k) => `${k} = VALUES(${k})`)
          .join(", ")};
      `;

      await conn.query(query, values);
      processedCount++;
    }

    await conn.commit();
    res
      .status(201)
      .json({
        success: true,
        message: `${processedCount} baris work order berhasil diproses.`,
      });
  } catch (err) {
    await conn.rollback();
    console.error("Gagal menyimpan work orders:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

/**
 * ENDPOINT: Mengedit Work Order (VERSI BARU: Mengembalikan data terbaru)
 * Metode: PUT
 * URL: /api/work-orders/:incident
 */
router.put("/work-orders/:incident", async (req, res) => {
  const { incident } = req.params;
  const data = req.body;

  // ... (kode validasi dan persiapan data Anda tetap sama) ...
  const allColumns = [
    "ticket_id_gamas",
    "external_ticket_id",
    "customer_id",
    "customer_name",
    "service_id",
    "service_no",
    "summary",
    "description_assignment",
    "reported_date",
    "reported_by",
    "reported_priority",
    "source_ticket",
    "channel",
    "contact_phone",
    "contact_name",
    "contact_email",
    "status",
    "status_date",
    "booking_date",
    "resolve_date",
    "date_modified",
    "last_update_worklog",
    "closed_by",
    "closed_reopen_by",
    "guarantee_status",
    "ttr_customer",
    "ttr_agent",
    "ttr_mitra",
    "ttr_nasional",
    "ttr_pending",
    "ttr_region",
    "ttr_witel",
    "ttr_end_to_end",
    "owner_group",
    "owner",
    "witel",
    "workzone",
    "region",
    "subsidiary",
    "territory_near_end",
    "territory_far_end",
    "customer_segment",
    "customer_type",
    "customer_category",
    "service_type",
    "slg",
    "technology",
    "lapul",
    "gaul",
    "onu_rx",
    "pending_reason",
    "incident_domain",
    "symptom",
    "hierarchy_path",
    "solution",
    "description_actual_solution",
    "kode_produk",
    "perangkat",
    "technician",
    "device_name",
    "sn_ont",
    "tipe_ont",
    "manufacture_ont",
    "impacted_site",
    "cause",
    "resolution",
    "worklog_summary",
    "classification_flag",
    "realm",
    "related_to_gamas",
    "tsc_result",
    "scc_result",
    "note",
    "notes_eskalasi",
    "rk_information",
    "external_ticket_tier_3",
    "classification_path",
    "urgency",
    "alamat",
    "korlap",
  ];
  const dateColumns = [
    "reported_date",
    "status_date",
    "booking_date",
    "resolve_date",
    "date_modified",
  ];
  delete data.incident;
  const keys = Object.keys(data).filter((key) => allColumns.includes(key));
  if (keys.length === 0) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Tidak ada data valid untuk diperbarui.",
      });
  }
  const values = keys.map((key) => {
    const value = data[key];
    if (
      dateColumns.includes(key) &&
      typeof value === "string" &&
      value.includes("T")
    ) {
      try {
        return new Date(value).toISOString().slice(0, 19).replace("T", " ");
      } catch (e) {
        return value;
      }
    }
    return value;
  });
  const setClauses = keys.map((k) => `${k} = ?`).join(", ");
  const updateQuery = `UPDATE work_orders SET ${setClauses} WHERE incident = ?`;

  const conn = await mysqlPool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(updateQuery, [...values, incident]);

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res
        .status(404)
        .json({
          success: false,
          message: `Work order dengan incident ${incident} tidak ditemukan.`,
        });
    }

    if (data.service_no) {
      const syncQuery = `
                UPDATE work_orders wo
                JOIN data_layanan dl ON wo.service_no = dl.service_no
                SET wo.alamat = dl.alamat
                WHERE wo.service_no = ?;
            `;
      await conn.query(syncQuery, [data.service_no]);
    }

    // ==> PERBAIKAN 1: Ambil data terbaru dari database <==
    const [updatedRows] = await conn.query(
      "SELECT * FROM work_orders WHERE incident = ?",
      [incident]
    );

    await conn.commit();

    // ==> PERBAIKAN 2: Kirim data terbaru sebagai respons <==
    res.json({
      success: true,
      message: "Work order berhasil diperbarui.",
      data: updatedRows[0], // Kirim objek data yang sudah ter-update
    });
  } catch (err) {
    await conn.rollback();
    console.error("Gagal mengedit work order:", err);
    res.status(500).json({ success: false, error: err.message });
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
    const [result] = await mysqlPool.query(
      "DELETE FROM work_orders WHERE incident = ?",
      [incident]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: `Work order dengan incident ${incident} tidak ditemukan.`,
        });
    }

    res.json({
      success: true,
      message: `Work order dengan incident ${incident} berhasil dihapus.`,
    });
  } catch (err) {
    console.error("Gagal menghapus work order:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * ENDPOINT: Menerima & Sinkronisasi Massal Work Order (VERSI BARU: SEMUA DI MYSQL)
 * Metode: POST
 * URL: /api/mypost
 */
router.post("/mypost", async (req, res) => {
  const data = req.body;

  if (!Array.isArray(data) || data.length === 0) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Data harus berupa array dan tidak boleh kosong.",
      });
  }

  // Daftar kolom yang valid di tabel work_orders
  const allColumns = [
    "incident",
    "ticket_id_gamas",
    "external_ticket_id",
    "customer_id",
    "customer_name",
    "service_id",
    "service_no",
    "summary",
    "description_assignment",
    "reported_date",
    "reported_by",
    "reported_priority",
    "source_ticket",
    "channel",
    "contact_phone",
    "contact_name",
    "contact_email",
    "status",
    "status_date",
    "booking_date",
    "resolve_date",
    "date_modified",
    "last_update_worklog",
    "closed_by",
    "closed_reopen_by",
    "guarantee_status",
    "ttr_customer",
    "ttr_agent",
    "ttr_mitra",
    "ttr_nasional",
    "ttr_pending",
    "ttr_region",
    "ttr_witel",
    "ttr_end_to_end",
    "owner_group",
    "owner",
    "witel",
    "workzone",
    "region",
    "subsidiary",
    "territory_near_end",
    "territory_far_end",
    "customer_segment",
    "customer_type",
    "customer_category",
    "service_type",
    "slg",
    "technology",
    "lapul",
    "gaul",
    "onu_rx",
    "pending_reason",
    "incident_domain",
    "symptom",
    "hierarchy_path",
    "solution",
    "description_actual_solution",
    "kode_produk",
    "perangkat",
    "technician",
    "device_name",
    "sn_ont",
    "tipe_ont",
    "manufacture_ont",
    "impacted_site",
    "cause",
    "resolution",
    "worklog_summary",
    "classification_flag",
    "realm",
    "related_to_gamas",
    "tsc_result",
    "scc_result",
    "note",
    "notes_eskalasi",
    "rk_information",
    "external_ticket_tier_3",
    "classification_path",
    "urgency",
    "alamat",
    "korlap",
  ];

  const conn = await mysqlPool.getConnection();
  try {
    // 1. Mulai Transaksi
    await conn.beginTransaction();

    let processedCount = 0;
    const serviceNosToSync = new Set();

    // --- TAHAP 1: Simpan data work order dari input ---
    for (const row of data) {
      // Abaikan 'alamat' dari input awal karena akan disinkronkan di tahap 2
      const validKeys = Object.keys(row).filter(
        (key) => allColumns.includes(key) && key !== "alamat"
      );

      if (validKeys.length === 0 || !row.incident) continue;

      // Kumpulkan service_no yang valid untuk disinkronkan
      if (row.service_no) {
        serviceNosToSync.add(row.service_no);
      }

      const values = validKeys.map((key) => row[key]);
      const keysToUpdate = validKeys.filter((k) => k !== "incident");

      let query = `INSERT INTO work_orders (${validKeys.join(
        ", "
      )}) VALUES (${validKeys.map(() => "?").join(", ")})`;
      if (keysToUpdate.length > 0) {
        query += ` ON DUPLICATE KEY UPDATE ${keysToUpdate
          .map((k) => `${k} = VALUES(${k})`)
          .join(", ")}`;
      }

      await conn.query(query, values);
      processedCount++;
    }

    // --- TAHAP 2: Sinkronisasi alamat dari tabel data_layanan (di MySQL) ---
    let addressUpdatedCount = 0;
    if (serviceNosToSync.size > 0) {
      const serviceNoArray = Array.from(serviceNosToSync);

      // Query UPDATE dengan JOIN yang efisien, hanya untuk MySQL
      const updateQuery = `
        UPDATE work_orders wo
        JOIN data_layanan dl ON wo.service_no = dl.service_no
        SET wo.alamat = dl.alamat
        WHERE wo.service_no IN (?);
      `;

      const [result] = await conn.query(updateQuery, [serviceNoArray]);
      addressUpdatedCount = result.affectedRows;
    }

    // 3. Jika semua berhasil, simpan perubahan
    await conn.commit();

    res.status(201).json({
      success: true,
      message: `Operasi selesai. ${processedCount} baris work order diproses dan ${addressUpdatedCount} alamat berhasil disinkronkan dari tabel data_layanan.`,
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
    const [rows] = await mysqlPool.query(
      // <-- Ganti menjadi mysqlPool
      "SELECT DISTINCT workzone FROM workzone_details ORDER BY workzone ASC"
    );

    // Kirim sebagai array ["BLB", "BTU", "GDG", ...]
    res.json(rows.map((w) => w.workzone));
  } catch (err) {
    console.error("Gagal mengambil daftar workzone:", err);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

/**
 * ENDPOINT BARU: Mengambil seluruh pemetaan Workzone, Korlap, dan Sektor
 * Metode: GET
 * URL: /api/workzone-map
 */
router.get("/workzone-map", async (req, res) => {
  try {
    const [rows] = await mysqlPool.query(
      "SELECT workzone, korlap_username, sektor FROM workzone_details ORDER BY workzone, korlap_username"
    );

    // Proses data mentah menjadi format yang mudah digunakan di frontend
    const map = rows.reduce((acc, { workzone, korlap_username, sektor }) => {
      if (!acc[workzone]) {
        acc[workzone] = {
          workzone: workzone,
          sektor: sektor,
          korlaps: [],
        };
      }
      acc[workzone].korlaps.push(korlap_username);
      return acc;
    }, {});

    // Kirim sebagai array objek
    res.json(Object.values(map));
  } catch (err) {
    console.error("Gagal mengambil pemetaan workzone:", err);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
});

// ENDPOINT BARU: Memindahkan WO ke Laporan
router.post("/work-orders/:incident/complete", async (req, res) => {
  const { incident } = req.params;
  const conn = await mysqlPool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Ambil data dari work_orders
    const [rows] = await conn.query(
      "SELECT * FROM work_orders WHERE incident = ?",
      [incident]
    );
    if (rows.length === 0) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Work order tidak ditemukan." });
    }
    const workOrder = rows[0];

    // 2. Masukkan ke tabel reports (asumsi nama tabel 'reports' dan strukturnya sama)
    const columns = Object.keys(workOrder);
    const values = Object.values(workOrder);
    const insertQuery = `INSERT INTO reports (${columns.join(
      ", "
    )}) VALUES (${columns.map(() => "?").join(", ")})`;
    await conn.query(insertQuery, values);

    // 3. Hapus dari tabel work_orders
    await conn.query("DELETE FROM work_orders WHERE incident = ?", [incident]);

    await conn.commit();
    res.json({
      success: true,
      message: "Work order telah dipindahkan ke laporan.",
    });
  } catch (err) {
    await conn.rollback();
    console.error("Gagal menyelesaikan work order:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// ENDPOINT BARU: Mengambil data dari tabel Laporan
router.get("/reports", async (req, res) => {
  try {
    const [rows] = await mysqlPool.query(
      "SELECT * FROM reports ORDER BY reported_date DESC"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Gagal mengambil data laporan:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
