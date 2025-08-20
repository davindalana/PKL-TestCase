const express = require("express");
const router = express.Router();
const Data = require("../models/Data");

// POST bulk data
router.post("/bulk", async (req, res) => {
  try {
    const data = req.body; // array of objects [{ service_no, alamat }, ...]

    if (!Array.isArray(data)) {
      return res.status(400).json({ success: false, message: "Data must be an array" });
    }

    // hapus semua data lama dulu (opsional, kalau mau selalu fresh)
    await Data.deleteMany({});

    // masukkan semua data baru
    await Data.insertMany(data);

    res.json({ success: true, message: "All data synced to MongoDB" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});




module.exports = router;
