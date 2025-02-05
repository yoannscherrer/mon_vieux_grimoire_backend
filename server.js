const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Grid = require("gridfs-stream");
const upload = require("./config/multer");
require("dotenv").config();

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));


const app = express();
app.use(cors());
app.use(express.json());

const userRoutes = require("./routes/user");
const bookRoutes = require("./routes/book");

app.use("/api/auth", userRoutes);
app.use("/api/books", bookRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// 📌 Configuration de GridFS
const conn = mongoose.connection;
let gfs;

conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
  console.log("📂 GridFS is ready!");
});


// 📌 S'assurer que `upload` et `gfs` sont bien exportés
module.exports = { app, upload, gfs };
