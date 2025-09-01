// Lokasi: express/routes/apiRoutes.js

const express = require("express");
const router = express.Router();
const db = require("../config/dbMysql");
const moment = require("moment-timezone");

// FUNGSI BARU: Kalkulasi durasi untuk TTR
const calculateDuration = (start, end) => {
  if (!start || !end) return null;

  const startDate = moment(start);
  const endDate = moment(end);

  if (!startDate.isValid() || !endDate.isValid()) return null;

  let diff = endDate.diff(startDate); // Selisih dalam milidetik
  if (diff < 0) diff = 0;

  const duration = moment.duration(diff);
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();

  let result = "";
  if (days > 0) result += `${days}H `;
  if (hours > 0) result += `${hours}J `;
  result += `${minutes}M`;

  return result.trim();
};

// Endpoint untuk mengambil semua work order
router.get("/view-mysql", (req, res) => {
  const query = "SELECT * FROM incidents ORDER BY incident DESC";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Gagal mengambil data dari MySQL:", err);
      return res.status(500).json({ message: "Gagal mengambil data" });
    }
    res.json({ data: results });
  });
});

// Endpoint untuk mengambil workzone map
router.get("/workzone-map", (req, res) => {
  const query = "SELECT * FROM workzone_map";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Gagal mengambil data workzone:", err);
      return res.status(500).json({ message: "Gagal mengambil data workzone" });
    }
    res.json(results);
  });
});

// MODIFIKASI ENDPOINT UPDATE (PUT)
router.put("/work-orders/:incident", (req, res) => {
  const { incident } = req.params;
  const updatedFields = req.body;

  let workOrderData = { ...updatedFields };

  const isResolvedOrClosed =
    updatedFields.status === "RESOLVED" || updatedFields.status === "CLOSED";
  const now = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");

  db.query(
    "SELECT reported_date, resolve_date FROM incidents WHERE incident = ?",
    [incident],
    (err, results) => {
      if (err) {
        console.error("Gagal mengambil data original:", err);
        return res
          .status(500)
          .json({ success: false, message: "Kesalahan server." });
      }
      if (results.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Insiden tidak ditemukan." });
      }

      const originalData = results[0];

      // 1. Logika untuk status RESOLVED atau CLOSED
      if (isResolvedOrClosed) {
        // Hanya set resolve_date jika belum pernah diisi sebelumnya
        if (!originalData.resolve_date) {
          workOrderData.resolve_date = now;
        } else {
          // Jika sudah ada, gunakan tanggal resolve yang sudah ada
          workOrderData.resolve_date = originalData.resolve_date;
        }

        workOrderData.status_date = now;

        // Hitung TTR menggunakan reported_date dari DB dan resolve_date yang baru
        const ttr = calculateDuration(
          originalData.reported_date,
          workOrderData.resolve_date
        );
        if (ttr) {
          workOrderData.ttr_customer = ttr;
          workOrderData.ttr_agent = ttr;
          workOrderData.ttr_mitra = ttr;
          workOrderData.ttr_nasional = ttr;
          workOrderData.ttr_end_to_end = ttr;
        }
      } else {
        // 2. Jika status diubah kembali ke BUKAN resolved/closed (misal: RE-OPEN)
        // Hapus nilai TTR dan resolve_date
        workOrderData.resolve_date = null;
        workOrderData.ttr_customer = null;
        workOrderData.ttr_agent = null;
        workOrderData.ttr_mitra = null;
        workOrderData.ttr_nasional = null;
        workOrderData.ttr_end_to_end = null;
        workOrderData.status_date = now;
      }

      workOrderData.date_modified = now;

      const query = "UPDATE incidents SET ? WHERE incident = ?";
      db.query(query, [workOrderData, incident], (err, result) => {
        if (err) {
          console.error("Gagal update data:", err);
          return res
            .status(500)
            .json({ success: false, message: "Gagal menyimpan ke database." });
        }
        // Kirim kembali data yang sudah lengkap (termasuk TTR yang baru dihitung)
        res.json({
          success: true,
          message: "Data berhasil diperbarui",
          data: workOrderData,
        });
      });
    }
  );
});

// Endpoint untuk menghapus
router.delete("/work-orders/:incident", (req, res) => {
  const { incident } = req.params;
  const query = "DELETE FROM incidents WHERE incident = ?";
  db.query(query, [incident], (err, result) => {
    if (err) {
      console.error("Gagal menghapus data:", err);
      return res
        .status(500)
        .json({ success: false, message: "Gagal menghapus" });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Insiden tidak ditemukan" });
    }
    res.json({ success: true, message: "Data berhasil dihapus" });
  });
});

// Endpoint untuk memindahkan tiket ke laporan (complete)
router.post("/work-orders/:incident/complete", (req, res) => {
  const { incident } = req.params;

  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ error: "Gagal memulai transaksi" });
    }

    const selectQuery = "SELECT * FROM incidents WHERE incident = ?";
    db.query(selectQuery, [incident], (err, results) => {
      if (err) {
        return db.rollback(() =>
          res.status(500).json({ error: "Gagal mengambil data insiden" })
        );
      }
      if (results.length === 0) {
        return db.rollback(() =>
          res.status(404).json({ error: "Insiden tidak ditemukan" })
        );
      }

      const incidentData = results[0];
      const insertQuery = "INSERT INTO reports SET ?";
      db.query(insertQuery, incidentData, (err, result) => {
        if (err) {
          return db.rollback(() =>
            res.status(500).json({ error: "Gagal memindahkan data ke laporan" })
          );
        }

        const deleteQuery = "DELETE FROM incidents WHERE incident = ?";
        db.query(deleteQuery, [incident], (err, result) => {
          if (err) {
            return db.rollback(() =>
              res
                .status(500)
                .json({ error: "Gagal menghapus data dari insiden" })
            );
          }

          db.commit((err) => {
            if (err) {
              return db.rollback(() =>
                res.status(500).json({ error: "Gagal menyelesaikan transaksi" })
              );
            }
            res.json({
              success: true,
              message: "Tiket berhasil diselesaikan dan dipindahkan.",
            });
          });
        });
      });
    });
  });
});

module.exports = router;
