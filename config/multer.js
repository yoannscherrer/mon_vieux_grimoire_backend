const multer = require("multer");
const { GridFSBucket } = require("mongodb");
const mongoose = require("mongoose");

const storage = multer.memoryStorage();
const upload = multer({ storage });

async function uploadToGridFS(req, res, next) {
  try {
    if (!req.file) {
      console.log("⚠️ Aucune image reçue dans `uploadToGridFS`.");
      return next(); // On passe à la suite sans erreur, car l'image est optionnelle
    }

    console.log("📂 Fichier détecté, enregistrement dans GridFS...");
    console.log("🖼️ Nom du fichier :", req.file.originalname);
    console.log("📏 Taille :", req.file.size, "bytes");
    console.log("🔄 Type MIME :", req.file.mimetype);

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: "uploads" });

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });

    uploadStream.end(req.file.buffer);
    
    console.log("🔄 Upload terminé, attente de l'ID...");

    uploadStream.on("finish", () => {
      req.fileId = uploadStream.id.toString();
      console.log("✅ Image stockée avec ID :", req.fileId);
      next();
    });

    uploadStream.on("error", (err) => {
      console.error("❌ Erreur lors de l'upload GridFS :", err);
      res.status(500).json({ message: "Erreur interne du serveur (GridFS)" });
    });

  } catch (error) {
    console.error("❌ Erreur interne dans `uploadToGridFS` :", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
}

module.exports = { upload, uploadToGridFS };
