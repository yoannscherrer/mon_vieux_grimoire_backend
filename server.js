const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { GridFSBucket } = require("mongodb"); 
const upload = require("./config/multer");
require("dotenv").config();

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connexion à MongoDB réussie !"))
  .catch(err => console.error("❌ Erreur de connexion à MongoDB:", err));

const app = express();
app.use(cors());
app.use(express.json());

const userRoutes = require("./routes/user");
const bookRoutes = require("./routes/book");

app.use("/api/auth", userRoutes);
app.use("/api/books", bookRoutes);


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Serveur en marche sur le port ${PORT}`));

const conn = mongoose.connection;
let gfs;

conn.once("open", () => {
  gfs = new GridFSBucket(conn.db, { bucketName: "uploads" });
  console.log("GridFSBucket est prêt !");
});


module.exports = { app, upload, gfs };
