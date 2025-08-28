import { Router, error, json } from 'itty-router';

const router = Router({ base: '/api' });

// =================================================================
// == HANDLER UNTUK CORS (Cross-Origin Resource Sharing)          ==
// =================================================================
// Middleware untuk menangani request pre-flight (OPTIONS)
const handleCors = request => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
};

// Fungsi untuk menambahkan header CORS ke semua response
const withCorsHeaders = response => {
  if (response && response.headers) {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  return response;
};

// Terapkan middleware CORS di awal untuk menangani pre-flight
router.all('*', handleCors);


// =================================================================
// == ADAPTASI ENDPOINT (Sekarang Menggunakan Cloudflare D1)      ==
// =================================================================

// Endpoint dasar untuk memeriksa status backend
router.get('/', () => {
  return json({
    status: 'ok',
    message: 'Backend PKL-TestCase is running.',
    version: '1.0.0',
  });
});

// Melihat semua data Work Order
router.get('/view-mysql', async (request, env) => {
  try {
    const stmt = env.DB.prepare('SELECT * FROM work_orders');
    const { results } = await stmt.all();
    return json({ success: true, count: results.length, data: results });
  } catch (e) {
    console.error('D1 Error:', e);
    return error(500, { success: false, error: e.message });
  }
});

// Menyimpan/memperbarui data Work Order dalam jumlah besar
router.post('/mypost', async (request, env) => {
  const data = await request.json();
  if (!Array.isArray(data) || data.length === 0) {
    return error(400, 'Data harus berupa array dan tidak boleh kosong.');
  }

  try {
    const statements = data.map(row => {
      const keys = Object.keys(row);
      const placeholders = keys.map(() => '?').join(',');
      const values = keys.map(k => row[k]);
      // INSERT OR REPLACE akan meng-update baris jika 'incident' sudah ada, atau membuat baru jika belum.
      const query = `INSERT OR REPLACE INTO work_orders (${keys.join(',')}) VALUES (${placeholders})`;
      return env.DB.prepare(query).bind(...values);
    });

    await env.DB.batch(statements);
    return json({ success: true, message: `Operasi selesai. ${data.length} baris work order diproses.` }, { status: 201 });
  } catch (e) {
    console.error('D1 Batch Error:', e);
    return error(500, { success: false, error: e.message });
  }
});

// Mengambil peta workzone beserta korlap
router.get('/workzone-map', async (request, env) => {
  try {
    const stmt = env.DB.prepare('SELECT sektor, workzone, korlap_username FROM workzone_details ORDER BY sektor, workzone');
    const { results } = await stmt.all();
    const workzoneGroups = results.reduce((acc, { sektor, workzone, korlap_username }) => {
      const key = `${sektor}|${workzone}`;
      if (!acc[key]) acc[key] = { sektor, workzone, korlaps: [] };
      if (korlap_username) acc[key].korlaps.push(korlap_username);
      return acc;
    }, {});
    return json(Object.values(workzoneGroups));
  } catch (e) {
    return error(500, { error: e.message });
  }
});

// Mengedit satu Work Order
router.put('/work-orders/:incident', async (request, env) => {
  const { incident } = request.params;
  const data = await request.json();

  try {
    const keysToUpdate = Object.keys(data).filter(key => key !== 'incident');
    if (keysToUpdate.length === 0) {
      return error(400, 'Tidak ada data untuk diperbarui.');
    }
    const setClauses = keysToUpdate.map(k => `${k} = ?`).join(', ');
    const values = keysToUpdate.map(key => data[key]);

    const stmt = env.DB.prepare(`UPDATE work_orders SET ${setClauses} WHERE incident = ?`).bind(...values, incident);
    await stmt.run();

    const { results } = await env.DB.prepare('SELECT * FROM work_orders WHERE incident = ?').bind(incident).all();
    return json({ success: true, message: 'Work order berhasil diperbarui.', data: results[0] });
  } catch (e) {
    return error(500, { success: false, error: e.message });
  }
});

// Menghapus satu Work Order
router.delete('/work-orders/:incident', async (request, env) => {
  const { incident } = request.params;
  try {
    const res = await env.DB.prepare('DELETE FROM work_orders WHERE incident = ?').bind(incident).run();
    if (res.changes === 0) {
      return error(404, `Work order ${incident} tidak ditemukan.`);
    }
    return json({ success: true, message: `Work order ${incident} berhasil dihapus.` });
  } catch (e) {
    return error(500, { success: false, error: e.message });
  }
});

// Memindahkan WO ke Laporan (Complete)
router.post('/work-orders/:incident/complete', async (request, env) => {
    const { incident } = request.params;
    try {
        const { results } = await env.DB.prepare("SELECT * FROM work_orders WHERE incident = ?").bind(incident).all();
        if (results.length === 0) {
            return error(404, { success: false, message: "Work order tidak ditemukan." });
        }
        const workOrder = results[0];
        const keys = Object.keys(workOrder);
        const placeholders = keys.map(() => '?').join(',');
        const values = keys.map(k => workOrder[k]);
        
        const insertStmt = env.DB.prepare(`INSERT INTO reports (${keys.join(',')}) VALUES (${placeholders})`).bind(...values);
        const deleteStmt = env.DB.prepare("DELETE FROM work_orders WHERE incident = ?").bind(incident);

        await env.DB.batch([insertStmt, deleteStmt]);
        
        return json({ success: true, message: "Work order telah dipindahkan ke laporan." });
    } catch (e) {
        console.error("D1 Error:", e);
        return error(500, { success: false, error: e.message });
    }
});

// Mengambil semua data Laporan
router.get("/reports", async (request, env) => {
    try {
        const { results } = await env.DB.prepare("SELECT * FROM reports ORDER BY reported_date DESC").all();
        return json({ success: true, data: results });
    } catch (e) {
        return error(500, { error: e.message });
    }
});

// Mengembalikan laporan ke work_orders (Re-open)
router.post('/reports/:incident/reopen', async (request, env) => {
    const { incident } = request.params;
    try {
        const { results } = await env.DB.prepare("SELECT * FROM reports WHERE incident = ?").bind(incident).all();
        if (results.length === 0) {
            return error(404, { success: false, message: "Laporan tidak ditemukan." });
        }
        const reportData = results[0];
        const keys = Object.keys(reportData);
        const placeholders = keys.map(() => '?').join(',');
        const values = keys.map(k => reportData[k]);

        const insertStmt = env.DB.prepare(`INSERT OR REPLACE INTO work_orders (${keys.join(',')}) VALUES (${placeholders})`).bind(...values);
        const deleteStmt = env.DB.prepare("DELETE FROM reports WHERE incident = ?").bind(incident);

        await env.DB.batch([insertStmt, deleteStmt]);

        return json({ success: true, message: "Work order telah berhasil dikembalikan." });
    } catch (e) {
        console.error("D1 Error:", e);
        return error(500, { success: false, error: e.message });
    }
});


// Fallback untuk rute yang tidak ditemukan
router.all('*', () => new Response('404, Not Found!', { status: 404 }));

// =================================================================
// == PINTU MASUK UTAMA WORKER                                    ==
// =================================================================
export default {
  fetch: (request, env, ctx) =>
    router.handle(request, env, ctx)
      .then(response => {
        // Jika ini bukan response, buat response baru
        if (!(response instanceof Response)) {
            response = json(response);
        }
        // Tambahkan header CORS ke semua response yang berhasil
        return withCorsHeaders(response);
      })
      .catch(err => {
        // Jika terjadi error, buat response error dan tambahkan juga header CORS
        const errorResponse = error(500, { success: false, message: err.stack });
        return withCorsHeaders(errorResponse);
      }),
};