const mongoose = require("mongoose");

const DataSchema = new mongoose.Schema(
  {
    "SERVICE NO": { type: String, required: true },
    "ALAMAT": { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Data", DataSchema);
