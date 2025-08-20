// config/dbMongo.js
const mongoose = require("mongoose");

async function connectMongo() {
  try {
    await mongoose.connect("mongodb+srv://rommymario01:XGjbuJS3zD0azeoG@cluster0.rosxozp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB error:", err);
  }
}

// export dengan CommonJS
module.exports = connectMongo;
