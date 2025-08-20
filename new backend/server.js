const express = require("express");
const bodyParser = require("body-parser");
const connectMongo = require("./config/dbMongo");
const dataRoutes = require("./routes/dataRoutes");

const app = express();
app.use(bodyParser.json());
app.use(express.json());

// Koneksi MongoDB
connectMongo();

// Routing
app.use("/", dataRoutes);
app.use("/api", dataRoutes);
app.post("/api/mongodb/bulk", async (req, res) => {
  try {
    const data = req.body; // array of object dari sheet
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "Data kosong" });
    }

    // ambil hanya service_no dan alamat (atau semua data kalau mau)
    const docs = data.map(row => ({
      service_no: row.service_no,
      alamat: row.alamat
    }));

    await mongoDb.collection("db_wo").insertMany(docs);

    res.json({ success: true, message: "Data masuk ke MongoDB", rows: docs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/mysql/bulk", (req, res) => {
  const data = req.body; // array of objek dari Sheet

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ error: "Data kosong" });
  }

  // Ambil nama kolom tabel (harus sesuai dengan MySQL)
  const columns = [
    "service_no", "alamat", "aksi", "incident", "ttr_customer", "summary",
    "reported_date", "owner_group", "owner", "customer_segment",
    "service_type", "witel", "workzone", "status", "status_date",
    "ticket_id_gamas", "reported_by", "contact_phone", "contact_name",
    "contact_email", "booking_date", "description_assignment",
    "reported_priority", "source_ticket", "subsidiary", "external_ticket_id",
    "channel", "customer_type", "closed_by", "closed_reopen_by", "customer_id",
    "customer_name", "service_id", "slg", "technology", "lapul", "gaul",
    "onu_rx", "pending_reason", "datemodified", "incident_domain", "region",
    "symptom", "hierarchy_path", "solution", "description_actual_solution",
    "kode_produk", "perangkat", "technician", "device_name", "worklog_summary",
    "last_update_worklog", "classification_flag", "realm", "related_to_gamas",
    "tsc_result", "scc_result", "ttr_agent", "ttr_mitra", "ttr_nasional",
    "ttr_pending", "ttr_region", "ttr_witel", "ttr_end_to_end", "note",
    "guarantee_status", "resolve_date", "sn_ont", "tipe_ont", "manufacture_ont",
    "impacted_site", "cause", "resolution", "notes_eskalasi", "rk_information",
    "external_ticket_tier3", "customer_category", "classification_path",
    "teritory_near_end", "teritory_far_end", "urgency", "urgency_description"
  ];

  const values = data.map(row =>
    columns.map(col => row[col] ?? null) // jika tidak ada di sheet, isi null
  );

  const sql = `INSERT INTO db_wo (${columns.join(",")}) VALUES ?`;

  db.query(sql, [values], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, message: "Data masuk ke MySQL", rows: result.affectedRows });
  });
});

const syncRoutes = require("./routes/syncRoutes");
app.use("/api", syncRoutes);


const PORT = 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
