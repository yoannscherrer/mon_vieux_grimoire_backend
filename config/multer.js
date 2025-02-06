const multer = require("multer");
const { GridFSBucket } = require("mongodb");
const mongoose = require("mongoose");

const storage = multer.memoryStorage(); 
const upload = multer({ storage });

async function uploadToGridFS(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucune image envoyée" });
    }
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: "uploads" });

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on("finish", () => {
      req.fileId = uploadStream.id;
      next();
    });

    uploadStream.on("error", (err) => {
      res.status(500).json({ message: "Erreur interne du serveur" });
    });

  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
}

module.exports = { upload, uploadToGridFS };
