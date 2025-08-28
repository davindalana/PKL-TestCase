import { Router, error, json } from 'itty-router';
// Sesuaikan path ke file konfigurasi database Anda
import mysqlPool from './config/dbMysql';

// Membuat instance router dengan base path /api
const router = Router({ base: '/api' });

// =================================================================
// == HANDLER UNTUK CORS (Cross-Origin Resource Sharing)          ==
// =================================================================
// Di lingkungan serverless seperti Cloudflare Workers, kita perlu menangani
// request pre-flight (OPTIONS) secara manual.
const handleCors = (request) => {
  const headers = {
    'Access-Control-Allow-Origin': '*', // Izinkan semua origin, atau ganti dengan URL frontend Anda untuk keamanan
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  // Jika ini adalah request pre-flight, kita cukup kembalikan header-nya.
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  // Untuk request lain, kita akan tambahkan header ini nanti di response.
  return headers;
};


// =================================================================
// == ADAPTASI ENDPOINT DARI apiRoutes.js                         ==
// =================================================================

// 1. ENDPOINT: Menerima data alamat dan menyimpan ke 'data_layanan'
router.post("/save-addresses-to-mysql", async (request) => {
  const data = await request.json();

  if (!Array.isArray(data) || data.length === 0) {
    return error(400, { success: false, message: "Data tidak valid." });
  }

  const conn = await mysqlPool.getConnection();
  try {
    await conn.beginTransaction();
    let processedCount = 0;
    for (const row of data) {
      if (row.service_no) {
        const query = `
          INSERT INTO data_layanan (service_no, alamat) VALUES (?, ?)
          ON DUPLICATE KEY UPDATE alamat = VALUES(alamat);
        `;
        await conn.query(query, [row.service_no, row.alamat || null]);
        processedCount++;
      }
    }
    await conn.commit();
    return json({
      success: true,
      message: `${processedCount} baris data alamat berhasil disimpan.`,
    }, { status: 201 });
  } catch (err) {
    await conn.rollback();
    console.error("Gagal menyimpan ke data_layanan MySQL:", err);
    return error(500, { success: false, error: err.message });
  } finally {
    conn.release();
  }
});


// 2. ENDPOINT: Menyinkronkan alamat dari 'data_layanan' ke 'work_orders'
router.post("/sync-to-mysql", async () => {
  const conn = await mysqlPool.getConnection();
  try {
    const query = `
      UPDATE work_orders wo
      JOIN data_layanan dl ON wo.service_no = dl.service_no
      SET wo.alamat = dl.alamat
      WHERE wo.alamat IS NULL OR wo.alamat != dl.alamat;
    `;
    const [result] = await conn.query(query);
    return json({
      success: true,
      message: `Sinkronisasi selesai. ${result.affectedRows} alamat diperbarui.`,
    });
  } catch (err) {
    console.error("Gagal sinkronisasi alamat di MySQL:", err);
    return error(500, { success: false, error: "Terjadi kesalahan pada server." });
  } finally {
    if (conn) conn.release();
  }
});


// 3. ENDPOINT: Melihat semua data Work Order
router.get("/view-mysql", async () => {
  try {
    const [rows] = await mysqlPool.query("SELECT * FROM work_orders");
    return json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error("Gagal mengambil data dari MySQL:", err);
    return error(500, { success: false, error: err.message });
  }
});


// 4. ENDPOINT: Menerima data Work Order dan menyimpan ke MySQL (Gabungan dari /work-orders dan /mypost)
// Kita hanya butuh satu endpoint untuk ini. Saya adaptasi dari /mypost yang lebih lengkap.
router.post("/mypost", async (request) => {
  const data = await request.json();
  if (!Array.isArray(data) || data.length === 0) {
    return error(400, { success: false, message: "Data harus berupa array." });
  }
  
  // Daftar kolom ini bisa disimpan di sini atau diimpor dari file lain
  const allColumns = ["incident", "ticket_id_gamas", /* ...dan seterusnya, salin semua kolom dari apiRoutes.js ... */ "korlap"];

  const conn = await mysqlPool.getConnection();
  try {
    await conn.beginTransaction();
    let processedCount = 0;
    const serviceNosToSync = new Set();

    for (const row of data) {
      const validKeys = Object.keys(row).filter(key => allColumns.includes(key) && key !== "alamat");
      if (validKeys.length === 0 || !row.incident) continue;
      if (row.service_no) serviceNosToSync.add(row.service_no);
      
      const values = validKeys.map(key => row[key]);
      const keysToUpdate = validKeys.filter(k => k !== "incident");
      let query = `INSERT INTO work_orders (${validKeys.join(", ")}) VALUES (${validKeys.map(() => "?").join(", ")})`;
      if (keysToUpdate.length > 0) {
        query += ` ON DUPLICATE KEY UPDATE ${keysToUpdate.map(k => `${k} = VALUES(${k})`).join(", ")}`;
      }
      await conn.query(query, values);
      processedCount++;
    }

    let addressUpdatedCount = 0;
    if (serviceNosToSync.size > 0) {
      const serviceNoArray = Array.from(serviceNosToSync);
      const updateQuery = `
        UPDATE work_orders wo JOIN data_layanan dl ON wo.service_no = dl.service_no
        SET wo.alamat = dl.alamat WHERE wo.service_no IN (?);
      `;
      const [result] = await conn.query(updateQuery, [serviceNoArray]);
      addressUpdatedCount = result.affectedRows;
    }
    await conn.commit();
    return json({
      success: true,
      message: `Operasi selesai. ${processedCount} baris diproses, ${addressUpdatedCount} alamat disinkronkan.`,
    }, { status: 201 });
  } catch (err) {
    await conn.rollback();
    console.error("Gagal memproses work orders:", err);
    return error(500, { success: false, error: err.message });
  } finally {
    conn.release();
  }
});


// 5. ENDPOINT: Menghapus Work Order
router.delete("/work-orders/:incident", async (request) => {
  const { incident } = request.params;
  try {
    const [result] = await mysqlPool.query("DELETE FROM work_orders WHERE incident = ?", [incident]);
    if (result.affectedRows === 0) {
      return error(404, { success: false, message: `Work order ${incident} tidak ditemukan.` });
    }
    return json({ success: true, message: `Work order ${incident} berhasil dihapus.` });
  } catch (err) {
    console.error("Gagal menghapus work order:", err);
    return error(500, { success: false, error: err.message });
  }
});


// 6. ENDPOINT: Mengambil daftar workzone unik
router.get("/workzones", async () => {
    try {
        const [rows] = await mysqlPool.query("SELECT DISTINCT workzone FROM workzone_details ORDER BY workzone ASC");
        return json(rows.map(w => w.workzone));
    } catch (err) {
        console.error("Gagal mengambil daftar workzone:", err);
        return error(500, { error: "Terjadi kesalahan pada server" });
    }
});


// 7. ENDPOINT: Mengambil peta workzone beserta korlap
router.get("/workzone-map", async () => {
    try {
        const [rows] = await mysqlPool.query("SELECT sektor, workzone, korlap_username FROM workzone_details ORDER BY sektor, workzone");
        const workzoneGroups = rows.reduce((acc, { sektor, workzone, korlap_username }) => {
            const key = `${sektor}|${workzone}`;
            if (!acc[key]) {
                acc[key] = { sektor, workzone, korlaps: [] };
            }
            if (korlap_username) acc[key].korlaps.push(korlap_username);
            return acc;
        }, {});
        return json(Object.values(workzoneGroups));
    } catch (err) {
        return error(500, { error: "Terjadi kesalahan pada server" });
    }
});


// 8. ENDPOINT: Mengedit Work Order
router.put("/work-orders/:incident", async (request) => {
  const { incident } = request.params;
  const data = await request.json();
  const conn = await mysqlPool.getConnection();

  try {
    await conn.beginTransaction();

    const datetimeColumns = ['reported_date', 'status_date', 'booking_date', 'resolve_date', 'date_modified', 'last_update_worklog'];
    for (const key of Object.keys(data)) {
      if (datetimeColumns.includes(key) && data[key]) {
        try {
          data[key] = new Date(data[key]).toISOString().slice(0, 19).replace('T', ' ');
        } catch (e) {
          console.error(`Format tanggal tidak valid untuk ${key}:`, data[key]);
          data[key] = null;
        }
      }
    }

    const keysToUpdate = Object.keys(data).filter(key => key !== 'incident');
    if (keysToUpdate.length === 0) {
      return error(400, { success: false, message: "Tidak ada data untuk diperbarui." });
    }

    const setClauses = keysToUpdate.map(k => `\`${k}\` = ?`).join(', ');
    const updateQuery = `UPDATE work_orders SET ${setClauses} WHERE incident = ?`;
    await conn.query(updateQuery, [...keysToUpdate.map(key => data[key]), incident]);

    if (data.service_no) {
      const syncQuery = `
        UPDATE work_orders wo JOIN data_layanan dl ON wo.service_no = dl.service_no
        SET wo.alamat = dl.alamat WHERE wo.service_no = ?;
      `;
      await conn.query(syncQuery, [data.service_no]);
    }

    const [updatedRows] = await conn.query(`SELECT * FROM work_orders WHERE incident = ?`, [incident]);
    await conn.commit();

    if (updatedRows.length === 0) {
      return error(404, { success: false, message: "Work order tidak ditemukan setelah update." });
    }
    return json({ success: true, message: `Work order berhasil diperbarui.`, data: updatedRows[0] });

  } catch (err) {
    await conn.rollback();
    console.error("Gagal mengedit work order:", err);
    return error(500, { success: false, error: err.message });
  } finally {
    conn.release();
  }
});


// 9. ENDPOINT: Memindahkan WO ke Laporan (Complete)
router.post("/work-orders/:incident/complete", async (request) => {
    const { incident } = request.params;
    const conn = await mysqlPool.getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.query("SELECT * FROM work_orders WHERE incident = ?", [incident]);
        if (rows.length === 0) {
            return error(404, { success: false, message: "Work order tidak ditemukan." });
        }
        const workOrder = rows[0];
        const columns = Object.keys(workOrder);
        const values = Object.values(workOrder);
        const insertQuery = `INSERT INTO reports (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
        await conn.query(insertQuery, values);
        await conn.query("DELETE FROM work_orders WHERE incident = ?", [incident]);
        await conn.commit();
        return json({ success: true, message: "Work order telah dipindahkan ke laporan." });
    } catch (err) {
        await conn.rollback();
        console.error("Gagal menyelesaikan work order:", err);
        return error(500, { success: false, error: err.message });
    } finally {
        conn.release();
    }
});


// 10. ENDPOINT: Mengambil data dari tabel Laporan
router.get("/reports", async () => {
    try {
        const [rows] = await mysqlPool.query("SELECT * FROM reports ORDER BY reported_date DESC");
        return json({ success: true, data: rows });
    } catch (err) {
        console.error("Gagal mengambil data laporan:", err);
        return error(500, { success: false, error: err.message });
    }
});


// 11. ENDPOINT: Mengembalikan laporan ke work_orders (Re-open)
router.post("/reports/:incident/reopen", async (request) => {
    const { incident } = request.params;
    const conn = await mysqlPool.getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.query("SELECT * FROM reports WHERE incident = ?", [incident]);
        if (rows.length === 0) {
            return error(404, { success: false, message: "Laporan tidak ditemukan." });
        }
        const reportData = rows[0];
        const columns = Object.keys(reportData);
        const values = Object.values(reportData);
        const insertQuery = `REPLACE INTO work_orders (${columns.map(c => `\`${c}\``).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
        await conn.query(insertQuery, values);
        await conn.query("DELETE FROM reports WHERE incident = ?", [incident]);
        await conn.commit();
        return json({ success: true, message: "Work order telah berhasil dikembalikan." });
    } catch (err) {
        await conn.rollback();
        console.error("Gagal mengembalikan work order:", err);
        return error(500, { success: false, error: err.message });
    } finally {
        conn.release();
    }
});


// Menangani rute yang tidak ditemukan (404)
router.all("*", () => new Response("404, Not Found!", { status: 404 }));

// =================================================================
// == PINTU MASUK UTAMA WORKER                                    ==
// =================================================================
// Fungsi fetch ini akan menangani semua request yang masuk ke Worker Anda.
export default {
    async fetch(request, env, ctx) {
        const corsHeaders = handleCors(request);
        // Jika ini request OPTIONS, langsung kembalikan response pre-flight.
        if (request.method === 'OPTIONS') {
            return corsHeaders;
        }

        // Jika bukan, lanjutkan ke router untuk menangani request.
        const response = await router.handle(request, env, ctx);

        // Tambahkan header CORS ke response yang akan dikirim kembali.
        Object.keys(corsHeaders).forEach(key => {
            response.headers.set(key, corsHeaders[key]);
        });
        
        return response;
    }
};