import { Router, json } from 'itty-router';

// Inisialisasi router baru
const router = Router();

/**
 * Rute dasar untuk mengecek apakah Worker berjalan dengan benar.
 * Mengembalikan pesan status dan versi.
 */
router.get("/", () => {
  return json({
    status: 'ok',
    message: 'Backend API is running.',
    version: '1.0.0',
  });
});

/**
 * ENDPOINT: Melihat semua data Work Order dari database D1.
 * Metode: GET
 * URL: /work-orders
 */
router.get("/api/view-mysql", async (request, env) => {
  // Pastikan binding database D1 ada
  if (!env.DB) {
    console.error("Database binding 'DB' tidak ditemukan. Pastikan sudah dikonfigurasi di wrangler.toml");
    return json({
      success: false,
      error: "Database connection not configured."
    }, { status: 500 });
  }

  try {
    // Siapkan dan eksekusi query untuk mengambil semua data dari tabel 'work_orders'
    const stmt = env.DB.prepare("SELECT * FROM work_orders");
    const { results } = await stmt.all();

    // Kembalikan data yang ditemukan sebagai response JSON
    return json({
      success: true,
      count: results.length,
      data: results,
    });

  } catch (err) {
    // Tangani jika terjadi error saat query ke database
    console.error("Gagal mengambil data dari D1:", err);

    return json({
      success: false,
      error: "Failed to retrieve data from database.",
      details: err.message
    }, { status: 500 });
  }
});

/**
 * ENDPOINT 3 (MODIFIKASI D1): Menerima data Work Order dan menyimpan ke D1 (UPSERT).
 * Metode: POST
 * URL: /work-orders
 */
router.post("/api/work-orders", async (request, env) => {
  if (!env.DB) {
    return json({ success: false, error: "Database connection not configured." }, { status: 500 });
  }

  const data = await request.json();

  if (!Array.isArray(data) || data.length === 0) {
    return json({ success: false, message: "Data harus berupa array dan tidak boleh kosong." }, { status: 400 });
  }

  // Daftar kolom yang valid (sesuaikan dengan skema tabel D1 Anda)
  const columns = ["incident", "ticket_id_gamas", "external_ticket_id", "customer_id", "customer_name", "service_id", "service_no", "summary", "description_assignment", "reported_date", "reported_by", "reported_priority", "source_ticket", "channel", "contact_phone", "contact_name", "contact_email", "status", "status_date", "booking_date", "resolve_date", "date_modified", "last_update_worklog", "closed_by", "closed_reopen_by", "guarantee_status", "ttr_customer", "ttr_agent", "ttr_mitra", "ttr_nasional", "ttr_pending", "ttr_region", "ttr_witel", "ttr_end_to_end", "owner_group", "owner", "witel", "workzone", "region", "subsidiary", "territory_near_end", "territory_far_end", "customer_segment", "customer_type", "customer_category", "service_type", "slg", "technology", "lapul", "gaul", "onu_rx", "pending_reason", "incident_domain", "symptom", "hierarchy_path", "solution", "description_actual_solution", "kode_produk", "perangkat", "technician", "device_name", "sn_ont", "tipe_ont", "manufacture_ont", "impacted_site", "cause", "resolution", "worklog_summary", "classification_flag", "realm", "related_to_gamas", "tsc_result", "scc_result", "note", "notes_eskalasi", "rk_information", "external_ticket_tier_3", "classification_path", "urgency", "alamat", "korlap"];

  try {
    // D1 mendukung 'batching' untuk performa yang lebih baik
    const stmts = [];
    for (const row of data) {
      if (!row.incident) continue; // Kunci utama 'incident' wajib ada

      const validKeys = Object.keys(row).filter(key => columns.includes(key));
      const values = validKeys.map(key => row[key]);
      const keysToUpdate = validKeys.filter(k => k !== 'incident');

      // Karena D1 tidak punya ON DUPLICATE KEY UPDATE, kita REPLACE (DELETE + INSERT)
      // Pastikan 'incident' adalah PRIMARY KEY di skema tabel Anda
      const query = `REPLACE INTO work_orders (${validKeys.join(', ')}) VALUES (${validKeys.map(() => '?').join(', ')});`;
      stmts.push(env.DB.prepare(query).bind(...values));
    }

    if (stmts.length > 0) {
      await env.DB.batch(stmts);
    }

    return json({ success: true, message: `${stmts.length} baris work order berhasil diproses.` }, { status: 201 });

  } catch (err) {
    console.error("Gagal menyimpan work orders ke D1:", err);
    return json({ success: false, error: "Gagal memproses data.", details: err.message }, { status: 500 });
  }
});

/**
 * ENDPOINT: Menghapus Work Order dari D1
 * Metode: DELETE
 * URL: /work-orders/:incident
 */
router.delete("/api/work-orders/:incident", async (request, env) => {
  if (!env.DB) {
    return json({ success: false, error: "Database connection not configured." }, { status: 500 });
  }

  const { incident } = request.params;

  try {
    const stmt = env.DB.prepare("DELETE FROM work_orders WHERE incident = ?").bind(incident);
    const { success, meta } = await stmt.run();

    // meta.changes akan berisi jumlah baris yang terpengaruh
    if (!success || meta.changes === 0) {
      return json({ success: false, message: `Work order dengan incident ${incident} tidak ditemukan.` }, { status: 404 });
    }

    return json({ success: true, message: `Work order dengan incident ${incident} berhasil dihapus.` });
  } catch (err) {
    console.error("Gagal menghapus work order dari D1:", err);
    return json({ success: false, error: "Gagal menghapus data.", details: err.message }, { status: 500 });
  }
});

/**
 * ENDPOINT: Sinkronisasi data (contoh untuk /mypost)
 * Metode: POST
 * URL: /sync-address
 */
router.post("/api/mypost", async (request, env) => {
  if (!env.DB) {
    return json({ success: false, error: "Database connection not configured." }, { status: 500 });
  }

  const data = await request.json();
  if (!Array.isArray(data) || data.length === 0) {
    return json({ success: false, message: "Data harus berupa array dan tidak boleh kosong." }, { status: 400 });
  }

  try {
    const serviceNosToSync = [...new Set(data.map(row => row.service_no).filter(Boolean))];
    if (serviceNosToSync.length === 0) {
      return json({ success: true, message: "Tidak ada service_no yang valid untuk disinkronkan." });
    }

    // 1. Ambil semua alamat dari 'data_layanan' dalam satu query
    const placeholders = serviceNosToSync.map(() => '?').join(',');
    const query = `SELECT service_no, alamat FROM data_layanan WHERE service_no IN (${placeholders})`;
    const { results: addresses } = await env.DB.prepare(query).bind(...serviceNosToSync).all();

    if (!addresses || addresses.length === 0) {
      return json({ success: true, message: "Tidak ada alamat yang cocok ditemukan di data_layanan." });
    }

    // 2. Buat batch UPDATE statement untuk 'work_orders'
    const stmts = addresses.map(addr =>
      env.DB.prepare("UPDATE work_orders SET alamat = ? WHERE service_no = ?")
        .bind(addr.alamat, addr.service_no)
    );

    const batchResult = await env.DB.batch(stmts);

    // Menghitung jumlah update yang berhasil
    const successfulUpdates = batchResult.filter(r => r.success).length;

    return json({
      success: true,
      message: `Sinkronisasi selesai. ${successfulUpdates} dari ${addresses.length} alamat berhasil diperbarui.`
    });

  } catch (err) {
    console.error("Gagal sinkronisasi alamat:", err);
    return json({ success: false, error: "Gagal sinkronisasi data.", details: err.message }, { status: 500 });
  }
});

/**
 * ENDPOINT: Mengambil daftar workzone unik dari D1
 * Metode: GET
 * URL: /workzones
 */
router.get("/api/workzones", async (request, env) => {
  if (!env.DB) {
    return json({ error: "Database not configured" }, { status: 500 });
  }
  try {
    const stmt = env.DB.prepare("SELECT DISTINCT workzone FROM workzone_details ORDER BY workzone ASC");
    const { results } = await stmt.all();
    // Kirim sebagai array ["BLB", "BTU", "GDG", ...]
    return json(results.map(w => w.workzone));
  } catch (err) {
    console.error("Gagal mengambil daftar workzone:", err);
    return json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
});

/**
 * ENDPOINT: Mengambil peta workzone beserta korlap dari D1
 * Metode: GET
 * URL: /workzone-map
 */
router.get("/api/workzone-map", async (request, env) => {
  if (!env.DB) {
    return json({ error: "Database not configured" }, { status: 500 });
  }
  try {
    const stmt = env.DB.prepare("SELECT sektor, workzone, korlap_username FROM workzone_details ORDER BY sektor, workzone");
    const { results } = await stmt.all();

    const workzoneGroups = results.reduce((acc, { sektor, workzone, korlap_username }) => {
      const key = `${sektor}|${workzone}`;
      if (!acc[key]) {
        acc[key] = { sektor, workzone, korlaps: [] };
      }
      if (korlap_username) {
        acc[key].korlaps.push(korlap_username);
      }
      return acc;
    }, {});

    return json(Object.values(workzoneGroups));
  } catch (err) {
    console.error("Gagal mengambil peta workzone:", err);
    return json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
});

/**
 * ENDPOINT: Mengedit Work Order di D1
 * Metode: PUT
 * URL: /work-orders/:incident
 */
router.put("/api/work-orders/:incident", async (request, env) => {
  if (!env.DB) {
    return json({ error: "Database not configured" }, { status: 500 });
  }

  const { incident } = request.params;
  const data = await request.json();

  try {
    const keysToUpdate = Object.keys(data).filter(key => key !== 'incident');
    if (keysToUpdate.length === 0) {
      return json({ success: false, message: "Tidak ada data untuk diperbarui." }, { status: 400 });
    }

    const setClauses = keysToUpdate.map(k => `${k} = ?`).join(', ');
    const values = keysToUpdate.map(key => data[key]);

    // Query untuk update data utama
    const updateStmt = env.DB.prepare(`UPDATE work_orders SET ${setClauses} WHERE incident = ?`).bind(...values, incident);

    // D1 tidak mendukung transaksi, jadi kita jalankan query secara berurutan
    await updateStmt.run();

    // Sinkronisasi alamat jika service_no ada di data
    if (data.service_no) {
      const { results: layanan } = await env.DB.prepare("SELECT alamat FROM data_layanan WHERE service_no = ?").bind(data.service_no).all();
      if (layanan && layanan.length > 0 && layanan[0].alamat) {
        await env.DB.prepare("UPDATE work_orders SET alamat = ? WHERE service_no = ?").bind(layanan[0].alamat, data.service_no).run();
      }
    }

    // Ambil data terbaru untuk dikembalikan
    const { results: updatedRows } = await env.DB.prepare("SELECT * FROM work_orders WHERE incident = ?").bind(incident).all();
    if (updatedRows.length === 0) {
      return json({ success: false, message: "Work order tidak ditemukan setelah update." }, { status: 404 });
    }

    return json({ success: true, message: `Work order berhasil diperbarui.`, data: updatedRows[0] });

  } catch (err) {
    console.error("Gagal mengedit work order:", err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
});


/**
 * ENDPOINT: Memindahkan WO ke Laporan di D1
 * Metode: POST
 * URL: /work-orders/:incident/complete
 */
router.post("/api/work-orders/:incident/complete", async (request, env) => {
  if (!env.DB) {
    return json({ error: "Database not configured" }, { status: 500 });
  }

  const { incident } = request.params;

  try {
    const { results } = await env.DB.prepare("SELECT * FROM work_orders WHERE incident = ?").bind(incident).all();
    if (results.length === 0) {
      return json({ success: false, message: "Work order tidak ditemukan." }, { status: 404 });
    }
    const workOrder = results[0];

    const columns = Object.keys(workOrder);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(workOrder);

    // Gunakan batch untuk menjalankan INSERT dan DELETE
    const stmts = [
      env.DB.prepare(`INSERT INTO reports (${columns.join(', ')}) VALUES (${placeholders})`).bind(...values),
      env.DB.prepare("DELETE FROM work_orders WHERE incident = ?").bind(incident)
    ];

    await env.DB.batch(stmts);

    return json({ success: true, message: "Work order telah dipindahkan ke laporan." });
  } catch (err) {
    console.error("Gagal menyelesaikan work order:", err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
});


/**
 * ENDPOINT: Mengambil data dari tabel Laporan di D1
 * Metode: GET
 * URL: /reports
 */
router.get("/api/reports", async (request, env) => {
  if (!env.DB) {
    return json({ error: "Database not configured" }, { status: 500 });
  }
  try {
    const stmt = env.DB.prepare("SELECT * FROM reports ORDER BY reported_date DESC");
    const { results } = await stmt.all();
    return json({ success: true, data: results });
  } catch (err) {
    console.error("Gagal mengambil data laporan:", err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
});

/**
 * ENDPOINT: Mengembalikan laporan ke work_orders di D1
 * Metode: POST
 * URL: /reports/:incident/reopen
 */
router.post("/api/reports/:incident/reopen", async (request, env) => {
  if (!env.DB) {
    return json({ error: "Database not configured" }, { status: 500 });
  }

  const { incident } = request.params;

  try {
    const { results } = await env.DB.prepare("SELECT * FROM reports WHERE incident = ?").bind(incident).all();
    if (results.length === 0) {
      return json({ success: false, message: "Laporan tidak ditemukan." }, { status: 404 });
    }
    const reportData = results[0];

    const columns = Object.keys(reportData);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(reportData);

    // Gunakan batch untuk REPLACE dan DELETE
    const stmts = [
      env.DB.prepare(`REPLACE INTO work_orders (${columns.join(', ')}) VALUES (${placeholders})`).bind(...values),
      env.DB.prepare("DELETE FROM reports WHERE incident = ?").bind(incident)
    ];

    await env.DB.batch(stmts);

    return json({ success: true, message: "Work order telah berhasil dikembalikan dari laporan." });
  } catch (err) {
    console.error("Gagal mengembalikan work order:", err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
});

/**
 * Fallback untuk menangani semua rute lain yang tidak cocok.
 * Mengembalikan response 404 Not Found.
 */
router.all("*", () => new Response("404, Not Found.", { status: 404 }));

/**
 * Export router untuk ditangani oleh Cloudflare Workers.
 */
export default {
  fetch: router.handle,
};