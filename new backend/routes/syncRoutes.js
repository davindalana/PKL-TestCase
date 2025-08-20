
// routes/syncRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/dbMysql");
const { MongoClient } = require("mongodb");

const mongoUri = "mongodb://localhost:27017";
const client = new MongoClient(mongoUri);

router.post("/sync/alamat", async (req, res) => {
  try {
    await client.connect();
    const mongoDb = client.db("your_mongo_db_name");
    const mongoData = await mongoDb.collection("db_wo").find({}, { projection: { service_no: 1, alamat: 1 } }).toArray();

    let updatedCount = 0;

    for (const row of mongoData) {
      if (row.alamat && row.service_no) {
        await new Promise((resolve, reject) => {
          db.query(
            "UPDATE db_wo SET alamat = ? WHERE service_no = ?",
            [row.alamat, row.service_no],
            (err, result) => {
              if (err) return reject(err);
              if (result.affectedRows > 0) updatedCount++;
              resolve();
            }
          );
        });
      }
    }

    res.json({ success: true, message: `Sinkronisasi selesai, ${updatedCount} baris diperbarui.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    await client.close();
  }
});

module.exports = router;
