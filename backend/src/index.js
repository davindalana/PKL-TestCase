import { Router, json } from 'itty-router';
// =================================================================================
// 헬 HELPER FUNCTIONS (FUNGSI BANTUAN)
// =================================================================================

// Helper untuk membuat respons JSON yang konsisten
const jsonResponse = (data, options = {}) => {
  const defaultOptions = { status: 200 };
  return json(data, { ...defaultOptions, ...options });
};

// Helper untuk menambahkan header CORS ke semua respons
const withCORS = (response) => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
};

// "Middleware" untuk memeriksa koneksi database di awal
const withDB = (request, env) => {
  if (!env.DB) {
    console.error("Database binding 'DB' tidak ditemukan.");
    return jsonResponse({
      success: false,
      error: "Database connection not configured."
    }, { status: 500 });
  }
};


// =================================================================================
// 🗄️ ROUTER INITIALIZATION
// =================================================================================

const router = Router();

// Menangani pre-flight request untuk CORS
router.options('*', () => new Response(null, {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}));

// Middleware untuk memeriksa DB di semua rute (kecuali rute dasar)
router.all('*', withDB);


// =================================================================================
// 🏁 API ENDPOINTS
// =================================================================================

// Rute dasar untuk cek status API
router.get("/", () => {
  return jsonResponse({
    status: 'ok',
    message: 'Backend API is running.',
    version: '1.2.0-refactored',
  });
});

/**
 * ENDPOINT: Melihat semua data Work Order dari database D1.
 * Metode: GET
 * URL: /work-orders
 */
router.get("/view-d1", async (request, env) => {
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
    const stmt = env.DB.prepare("SELECT * FROM data_layanan");
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
 * ENDPOINT: Menerima data alamat dan menyimpan ke tabel 'data_layanan' di D1.
 * Metode: POST
 * URL: /addresses
 */
router.post("/save-addresses", async (request, env) => {
  if (!env.DB) {
    return json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const data = await request.json();

    if (!Array.isArray(data) || data.length === 0) {
      return json({ success: false, message: "Data harus berupa array dan tidak boleh kosong." }, { status: 400 });
    }

    // Menggunakan 'REPLACE INTO' sebagai pengganti 'ON DUPLICATE KEY UPDATE' di D1
    // Pastikan 'service_no' adalah PRIMARY KEY di tabel 'data_layanan'
    const query = "REPLACE INTO data_layanan (service_no, alamat) VALUES (?, ?);";

    // Siapkan batch statements untuk efisiensi
    const stmts = data
      .filter(row => row.service_no) // Hanya proses baris yang memiliki service_no
      .map(row => env.DB.prepare(query).bind(row.service_no, row.alamat || null));

    if (stmts.length === 0) {
      return json({ success: true, message: "Tidak ada data valid untuk diproses." });
    }

    await env.DB.batch(stmts);

    return json({
      success: true,
      message: `${stmts.length} baris data alamat berhasil disimpan.`,
    }, { status: 201 });

  } catch (err) {
    console.error("Gagal menyimpan ke data_layanan D1:", err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
});


/**
 * ENDPOINT: Menyinkronkan semua alamat dari 'data_layanan' ke 'work_orders' di D1
 * Metode: POST
 * URL: /sync-all-addresses
 */
router.post("/sync-all", async (request, env) => {
  if (!env.DB) {
    return json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    // LANGKAH 1: Ambil semua data alamat yang relevan dari 'data_layanan'
    const { results: addressesToSync } = await env.DB.prepare(
      "SELECT service_no, alamat FROM data_layanan WHERE service_no IS NOT NULL AND alamat IS NOT NULL"
    ).all();

    if (!addressesToSync || addressesToSync.length === 0) {
      return json({ success: true, message: "Tidak ada alamat baru untuk disinkronkan." });
    }

    // LANGKAH 2: Buat batch UPDATE statement untuk 'work_orders'
    // D1 tidak mendukung 'UPDATE JOIN', jadi kita lakukan secara manual
    const stmts = addressesToSync.map(addr =>
      env.DB.prepare("UPDATE work_orders SET alamat = ? WHERE service_no = ?")
        .bind(addr.alamat, addr.service_no)
    );

    const batchResult = await env.DB.batch(stmts);

    // Hitung jumlah update yang berhasil
    const successfulUpdates = batchResult.filter(r => r.success && r.meta.changes > 0).length;

    return json({
      success: true,
      message: `Sinkronisasi selesai. ${successfulUpdates} alamat di work_orders berhasil diperbarui.`,
    });

  } catch (err) {
    console.error("Gagal sinkronisasi alamat di D1:", err);
    return json({ success: false, error: "Terjadi kesalahan pada server saat sinkronisasi." }, { status: 500 });
  }
});

/**
 * ENDPOINT: Menerima data Work Order dan menyinkronkan alamat.
 * Metode: POST
 * URL: /sync-work-orders
 */
router.post("/mypost", async (request, env) => {
  if (!env.DB) {
    return json({ success: false, error: "Database connection not configured." }, { status: 500 });
  }

  const data = await request.json();
  if (!Array.isArray(data) || data.length === 0) {
    return json({ success: false, message: "Data harus berupa array dan tidak boleh kosong." }, { status: 400 });
  }

  // Daftar kolom yang valid (sesuaikan dengan skema tabel D1 Anda)
  const columns = ["incident", "ticket_id_gamas", "external_ticket_id", "customer_id", "customer_name", "service_id", "service_no", "summary", "description_assignment", "reported_date", "reported_by", "reported_priority", "source_ticket", "channel", "contact_phone", "contact_name", "contact_email", "status", "status_date", "booking_date", "resolve_date", "date_modified", "last_update_worklog", "closed_by", "closed_reopen_by", "guarantee_status", "ttr_customer", "ttr_agent", "ttr_mitra", "ttr_nasional", "ttr_pending", "ttr_region", "ttr_witel", "ttr_end_to_end", "owner_group", "owner", "witel", "workzone", "region", "subsidiary", "territory_near_end", "territory_far_end", "customer_segment", "customer_type", "customer_category", "service_type", "slg", "technology", "lapul", "gaul", "onu_rx", "pending_reason", "incident_domain", "symptom", "hierarchy_path", "solution", "description_actual_solution", "kode_produk", "perangkat", "technician", "device_name", "sn_ont", "tipe_ont", "manufacture_ont", "impacted_site", "cause", "resolution", "worklog_summary", "classification_flag", "realm", "related_to_gamas", "tsc_result", "scc_result", "note", "notes_eskalasi", "rk_information", "external_ticket_tier_3", "classification_path", "urgency", "alamat", "korlap"];

  let totalUpdates = 0;
  let workOrderProcessed = 0;

  try {
    // LANGKAH 1: Proses dan simpan/perbarui data work orders yang diterima dari request
    const workOrderStmts = [];
    for (const row of data) {
      if (!row.incident) continue;

      const validKeys = Object.keys(row).filter(key => columns.includes(key));
      const values = validKeys.map(key => row[key]);

      const query = `REPLACE INTO work_orders (${validKeys.join(', ')}) VALUES (${validKeys.map(() => '?').join(', ')});`;
      workOrderStmts.push(env.DB.prepare(query).bind(...values));
      workOrderProcessed++;
    }

    if (workOrderStmts.length > 0) {
      await env.DB.batch(workOrderStmts);
    }

    // LANGKAH 2: Ambil alamat dari data_layanan dan sinkronkan ke work_orders
    const { results: addressesToSync } = await env.DB.prepare(
      "SELECT service_no, alamat FROM data_layanan WHERE service_no IN (SELECT service_no FROM work_orders) AND alamat IS NOT NULL"
    ).all();

    if (addressesToSync && addressesToSync.length > 0) {
      const syncStmts = addressesToSync.map(addr =>
        env.DB.prepare("UPDATE work_orders SET alamat = ? WHERE service_no = ?")
          .bind(addr.alamat, addr.service_no)
      );

      const batchResult = await env.DB.batch(syncStmts);
      totalUpdates = batchResult.filter(r => r.success && r.meta.changes > 0).length;
    }

    // Memberikan respons yang lebih informatif
    return json({
      success: true,
      message: `Proses sinkronisasi selesai. ${workOrderProcessed} work order diproses. ${totalUpdates} alamat berhasil diperbarui.`,
    }, { status: 201 });

  } catch (err) {
    console.error("Gagal memproses data dan sinkronisasi:", err);
    return json({ success: false, error: "Gagal memproses data.", details: err.message }, { status: 500 });
  }
});


/**
 * ENDPOINT: Melihat semua data Work Order dari database D1.
 * Metode: GET
 * URL: /work-orders
 */
router.get("/view-mysql", async (request, env) => {
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
router.post("/work-orders", async (request, env) => {
  try {
    const data = await request.json();
    if (!Array.isArray(data) || data.length === 0) {
      return jsonResponse({ success: false, message: "Input data harus berupa array dan tidak boleh kosong." }, { status: 400 });
    }

    const columns = ["incident", "ticket_id_gamas", "external_ticket_id", "customer_id", "customer_name", "service_id", "service_no", "summary", "description_assignment", "reported_date", "reported_by", "reported_priority", "source_ticket", "channel", "contact_phone", "contact_name", "contact_email", "status", "status_date", "booking_date", "resolve_date", "date_modified", "last_update_worklog", "closed_by", "closed_reopen_by", "guarantee_status", "ttr_customer", "ttr_agent", "ttr_mitra", "ttr_nasional", "ttr_pending", "ttr_region", "ttr_witel", "ttr_end_to_end", "owner_group", "owner", "witel", "workzone", "region", "subsidiary", "territory_near_end", "territory_far_end", "customer_segment", "customer_type", "customer_category", "service_type", "slg", "technology", "lapul", "gaul", "onu_rx", "pending_reason", "incident_domain", "symptom", "hierarchy_path", "solution", "description_actual_solution", "kode_produk", "perangkat", "technician", "device_name", "sn_ont", "tipe_ont", "manufacture_ont", "impacted_site", "cause", "resolution", "worklog_summary", "classification_flag", "realm", "related_to_gamas", "tsc_result", "scc_result", "note", "notes_eskalasi", "rk_information", "external_ticket_tier_3", "classification_path", "urgency", "alamat", "korlap"];

    const stmts = data
      .filter(row => row.incident) // Wajib ada primary key
      .map(row => {
        // ✅ LOGIKA BACKEND: Jika reported_date tidak ada, buat baru.
        if (!row.reported_date) {
          row.reported_date = new Date().toISOString();
        }
        // Pastikan status awal adalah 'open' atau sejenisnya jika belum ada
        if (!row.status) {
          row.status = 'open';
        }

        const validKeys = Object.keys(row).filter(key => columns.includes(key));
        const values = validKeys.map(key => row[key]);
        const query = `REPLACE INTO work_orders (${validKeys.join(', ')}) VALUES (${'?'.repeat(validKeys.length).split('').join(',')});`;
        return env.DB.prepare(query).bind(...values);
      });

    if (stmts.length > 0) {
      await env.DB.batch(stmts);
    }

    return jsonResponse({ success: true, message: `${stmts.length} work order berhasil diproses.` }, { status: 201 });

  } catch (err) {
    console.error("Gagal menyimpan work orders:", err);
    return jsonResponse({ success: false, error: "Gagal memproses data.", details: err.message }, { status: 500 });
  }
});

/**
 * ENDPOINT: Menghapus Work Order dari D1
 * Metode: DELETE
 * URL: /work-orders/:incident
 */
router.delete("/work-orders/:incident", async (request, env) => {
  // 1. Validasi Koneksi Database (Sudah bagus)
  if (!env.DB) {
    console.error("Koneksi D1 Database tidak terkonfigurasi di env.");
    return json({ success: false, error: "Konfigurasi server bermasalah." }, { status: 500 });
  }

  const { incident } = request.params;

  // 2. [PENYEMPURNAAN] Validasi Input dari Client
  // Pastikan parameter 'incident' tidak kosong atau tidak valid.
  if (!incident || incident.trim() === '') {
    return json({ success: false, error: "Parameter 'incident' tidak boleh kosong." }, { status: 400 }); // 400 Bad Request
  }

  try {
    // 3. Eksekusi Query dengan Prepared Statement (Sudah bagus)
    const stmt = env.DB.prepare("DELETE FROM work_orders WHERE incident = ?").bind(incident);
    const { meta } = await stmt.run();

    // 4. [PENYEMPURNAAN] Cek Hasil Operasi
    // D1 `.run()` akan melempar error jika query gagal, jadi kita hanya perlu cek
    // jumlah baris yang berubah (meta.changes). Jika 0, berarti data tidak ditemukan.
    if (meta.changes === 0) {
      return json(
        { success: false, message: `Work order dengan incident '${incident}' tidak ditemukan.` },
        { status: 404 } // 404 Not Found
      );
    }

    // Jika berhasil (meta.changes > 0)
    return json({
      success: true,
      message: `Work order dengan incident '${incident}' berhasil dihapus.`,
      changes: meta.changes
    });

  } catch (err) {
    // 5. Penanganan Error Internal (Sudah bagus)
    console.error(`Gagal menghapus work order '${incident}':`, err);
    return json(
        { success: false, error: "Terjadi kesalahan internal pada server." },
        { status: 500 } // 500 Internal Server Error
    );
  }
});

/**
 * ENDPOINT: Mengambil daftar workzone unik dari D1
 * Metode: GET
 * URL: /workzones
 */
router.get("/workzones", async (request, env) => {
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
router.get("/workzone-map", async (request, env) => {
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
router.put("/work-orders/:incident", async (request, env) => {
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
router.post("/work-orders/:incident/complete", async (request, env) => {
  const { incident } = request.params;
  try {
    const { results } = await env.DB.prepare("SELECT * FROM work_orders WHERE incident = ?").bind(incident).all();
    if (results.length === 0) {
      return jsonResponse({ success: false, message: "Work order tidak ditemukan." }, { status: 404 });
    }
    
    const workOrder = results[0];

    // ✅ LOGIKA BACKEND: Atur status dan waktu selesai saat tiket ditutup.
    workOrder.status = 'CLOSED'; // Atau 'resolved', sesuaikan dengan sistem Anda
    workOrder.resolve_date = new Date().toISOString();
    workOrder.date_modified = new Date().toISOString();

    const columns = Object.keys(workOrder);
    const values = Object.values(workOrder);

    const stmts = [
      env.DB.prepare(`REPLACE INTO reports (${columns.join(', ')}) VALUES (${'?'.repeat(columns.length).split('').join(',')})`).bind(...values),
      env.DB.prepare("DELETE FROM work_orders WHERE incident = ?").bind(incident)
    ];
    await env.DB.batch(stmts);

    return jsonResponse({ success: true, message: "Work order telah dipindahkan ke laporan." });

  } catch (err) {
    console.error("Gagal menyelesaikan work order:", err);
    return jsonResponse({ success: false, error: err.message }, { status: 500 });
  }
});



/**
 * ENDPOINT: Mengambil data dari tabel Laporan di D1
 * Metode: GET
 * URL: /reports
 */
router.get("/reports", async (request, env) => {
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
router.post("/reports/:incident/reopen", async (request, env) => {
  const { incident } = request.params;
  try {
    const { results } = await env.DB.prepare("SELECT * FROM reports WHERE incident = ?").bind(incident).all();
    if (results.length === 0) {
      return jsonResponse({ success: false, message: "Laporan tidak ditemukan." }, { status: 404 });
    }
    const reportData = results[0];

    // ✅ LOGIKA BACKEND: Buka kembali tiket, ubah status & hapus waktu selesai.
    reportData.status = 'OPEN'; // Atau 'open'
    reportData.resolve_date = null; // TTR akan berjalan lagi di frontend
    reportData.date_modified = new Date().toISOString();

    const columns = Object.keys(reportData);
    const values = Object.values(reportData);

    const stmts = [
      env.DB.prepare(`REPLACE INTO work_orders (${columns.join(', ')}) VALUES (${'?'.repeat(columns.length).split('').join(',')})`).bind(...values),
      env.DB.prepare("DELETE FROM reports WHERE incident = ?").bind(incident)
    ];
    await env.DB.batch(stmts);

    return jsonResponse({ success: true, message: "Work order telah dibuka kembali." });

  } catch (err) {
    console.error("Gagal membuka kembali work order:", err);
    return jsonResponse({ success: false, error: err.message }, { status: 500 });
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
  async fetch(request, env, ctx) {
    const response = await router.handle(request, env, ctx);
    return withCORS(response); // <-- Tambahkan header CORS ke semua response
  }
};
