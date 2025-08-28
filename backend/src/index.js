// davindalana/pkl-testcase/PKL-TestCase-55577bf0c5377d152bc7c33fd3edd4082395d349/backend/src.index.js

import { Router } from 'itty-router';
import { error, json } from 'itty-router-extras';

router.get('/api/view-mysql', async (req, env) => {
  const { results } = await env.DB.prepare('SELECT * FROM work_orders').all();
  return json({ success: true, count: results.length, data: results });
});


// Inisialisasi router
const router = Router();

// =================================================================
// ==                DEFINISI SEMUA RUTE ANDA                     ==
// =================================================================

// Rute dasar untuk cek status
router.get('/', () => {
  console.log(">>> Root route hit");
  return json({
    status: 'ok',
    message: 'Backend PKL-TestCase is running correctly.',
    version: '3.0.0-final',
  });
});


// Semua rute API Anda harus diawali dengan /api
router.get('/api/view-mysql', async (req, env) => {
  const { results } = await env.DB.prepare('SELECT * FROM work_orders').all();
  return json({ success: true, count: results.length, data: results });
});


router.post('/api/mypost', async (req, env) => {
	const data = await req.json();
	if (!Array.isArray(data) || data.length === 0) return error(400, 'Data must be a non-empty array.');

	const stmts = data.map((row) => {
		const keys = Object.keys(row).filter((k) => row[k] !== undefined && row[k] !== null);
		const placeholders = keys.map(() => '?').join(',');
		const values = keys.map((k) => row[k]);
		const query = `INSERT OR REPLACE INTO work_orders (${keys.join(',')}) VALUES (${placeholders})`;
		return env.DB.prepare(query).bind(...values);
	});

	if (stmts.length > 0) {
		await env.DB.batch(stmts);
	}
	return json({ success: true, message: `Processed ${stmts.length} rows.` }, { status: 201 });
});

router.get('/api/workzone-map', async (req, env) => {
	const { results } = await env.DB.prepare('SELECT sektor, workzone, korlap_username FROM workzone_details ORDER BY sektor, workzone').all();
	const workzoneGroups = results.reduce((acc, { sektor, workzone, korlap_username }) => {
		const key = `${sektor}|${workzone}`;
		if (!acc[key]) acc[key] = { sektor, workzone, korlaps: [] };
		if (korlap_username) acc[key].korlaps.push(korlap_username);
		return acc;
	}, {});
	return json(Object.values(workzoneGroups));
});

router.put('/api/work-orders/:incident', async (req, env) => {
	const { incident } = req.params;
	const data = await req.json();
	const keys = Object.keys(data).filter((k) => k !== 'incident');
	if (keys.length === 0) return error(400, 'No data to update.');

	const setClauses = keys.map((k) => `${k} = ?`).join(', ');
	const values = keys.map((k) => data[k]);

	await env.DB.prepare(`UPDATE work_orders SET ${setClauses} WHERE incident = ?`).bind(...values, incident).run();
	const { results } = await env.DB.prepare('SELECT * FROM work_orders WHERE incident = ?').bind(incident).all();
	return json({ success: true, data: results[0] });
});

router.delete('/api/work-orders/:incident', async (req, env) => {
	const { incident } = req.params;
	const { changes } = await env.DB.prepare('DELETE FROM work_orders WHERE incident = ?').bind(incident).run();
	if (changes === 0) return error(404, `Incident ${incident} not found.`);
	return json({ success: true, message: `Incident ${incident} deleted.` });
});

router.post('/api/work-orders/:incident/complete', async (req, env) => {
	const { incident } = req.params;
	const { results } = await env.DB.prepare('SELECT * FROM work_orders WHERE incident = ?').bind(incident).all();
	if (results.length === 0) return error(404, 'Work order not found.');

	const workOrder = results[0];
	const keys = Object.keys(workOrder);
	const placeholders = keys.map(() => '?').join(',');
	const values = Object.values(workOrder);

	await env.DB.batch([
		env.DB.prepare(`INSERT INTO reports (${keys.join(',')}) VALUES (${placeholders})`).bind(...values),
		env.DB.prepare('DELETE FROM work_orders WHERE incident = ?').bind(incident),
	]);
	return json({ success: true, message: 'Work order moved to reports.' });
});

router.get('/api/reports', async (req, env) => {
	const { results } = await env.DB.prepare('SELECT * FROM reports ORDER BY reported_date DESC').all();
	return json({ success: true, data: results });
});

router.post('/api/reports/:incident/reopen', async (req, env) => {
	const { incident } = req.params;
	const { results } = await env.DB.prepare('SELECT * FROM reports WHERE incident = ?').bind(incident).all();
	if (results.length === 0) return error(404, 'Report not found.');

	const reportData = results[0];
	const keys = Object.keys(reportData);
	const placeholders = keys.map(() => '?').join(',');
	const values = Object.values(reportData);

	await env.DB.batch([
		env.DB.prepare(`INSERT OR REPLACE INTO work_orders (${keys.join(',')}) VALUES (${placeholders})`).bind(...values),
		env.DB.prepare('DELETE FROM reports WHERE incident = ?').bind(incident),
	]);
	return json({ success: true, message: 'Work order restored.' });
});

// Rute fallback 404
router.all('*', () => error(404, 'Route not found.'));

// =================================================================
// ==                PINTU MASUK UTAMA WORKER                     ==
// =================================================================
export default {
  async fetch(request, env, ctx) {
    console.log(">>> Incoming request:", request.method, request.url);

    try {
      let response = await router.handle(request, env, ctx);

      if (!response) {
        console.log(">>> No route matched.");
        response = error(404, "Route not found.");
      }

      // langsung return tanpa re-wrap
      return response;
    } catch (err) {
      console.error(">>> ERROR:", err);
      return error(500, err.message || "Internal Server Error");
    }
  },
};
