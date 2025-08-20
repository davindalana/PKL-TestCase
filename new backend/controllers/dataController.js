const Data = require("../Models/data");
const { connectMySQL } = require("../config/dbMysql");

async function uploadData(req, res) {
  try {
    // Simpan ke MongoDB
    const inserted = await Data.insertMany(req.body);

    // Sinkronisasi ke MySQL
    const mysqlConn = await connectMySQL();
    for (let row of req.body) {
      if (row["SERVICE NO"]) {
        await mysqlConn.query(
          `INSERT INTO db_wo (service_no, alamat) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE alamat = VALUES(alamat)`,
          [row["SERVICE NO"], row["ALAMAT"] || null]
        );
      }
    }

    res.json({ success: true, inserted: inserted.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { uploadData };
