const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const upload = require("./config/multer");
const path = require("path")
require("dotenv").config();

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connexion à MongoDB réussie !"))
  .catch(err => console.error("❌ Erreur de connexion à MongoDB:", err));

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


const userRoutes = require("./routes/user");
const bookRoutes = require("./routes/book");

app.use("/api/auth", userRoutes);
app.use("/api/books", bookRoutes);
console.log("📌 Route `/api/books/:id` pour modification chargée !");



const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Serveur en marche sur le port ${PORT}`));


module.exports = { app, upload};
