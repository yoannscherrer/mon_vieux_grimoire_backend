const mongoose = require("mongoose");
const Book = require("../models/book");
const conn = mongoose.connection;
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

exports.processImage = async (req, res, next) => { 
    if (!req.file) {
        return next(); // Si pas d'image, on continue sans erreur
      }
    
      const newFilename = `compressed-${Date.now()}.webp`; // On convertit en WebP pour meilleure compression
      const outputPath = `uploads/${newFilename}`;
    
      try {
        await sharp(req.file.path)
          .resize(500) // Redimensionne à 500px de largeur
          .webp({ quality: 80 }) // Compression en WebP qualité 80%
          .toFile(outputPath);
    
        // Supprime l'ancienne image non compressée
        fs.unlinkSync(req.file.path);
    
        req.file.filename = newFilename;
        req.file.path = outputPath;
        next();
      } catch (error) {
        console.error("❌ Erreur lors du traitement de l’image :", error);
        return res.status(500).json({ message: "Erreur lors du traitement de l’image" });
      }
};

exports.getBookImage = async (req, res) => {
  try {
    const imageId = new mongoose.Types.ObjectId(req.params.id);

    const file = await conn.db.collection("uploads.files").findOne({ _id: imageId });

    if (!file) {
      return res.status(404).json({ message: "Image non trouvée" });
    }
    res.set("Content-Type", file.contentType);
    const readStream = gfs.openDownloadStream(imageId); 
    readStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de l'image" });
  }
};

exports.createBook = async (req, res) => {
  try {
      const bookData = JSON.parse(req.body.book);

      // Vérifie s'il y a une image
      const fileName = req.file ? req.file.filename : null;
      const imageUrl = fileName ? `${req.protocol}://${req.get("host")}/uploads/${fileName}` : null;

      const book = new Book({
          ...bookData,
          imageUrl: imageUrl
      });

      await book.save();
      res.status(201).json({ message: "Livre ajouté avec succès", book });
  } catch (error) {
      res.status(500).json({ message: "Erreur interne du serveur", error });
  }
};

  

exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des livres" });
  }
};


exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Livre non trouvé" });

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération du livre" });
  }
};

exports.deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: "Livre non trouvé" });
        }
        if (book.userId.toString() !== req.auth.userId) {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer ce livre" });
        }

        await Book.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Livre supprimé avec succès" });

    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la suppression du livre" });
    }
};

exports.updateBook = async (req, res) => {
  try {
      const book = await Book.findById(req.params.id);
      if (!book) return res.status(404).json({ message: "Livre non trouvé" });

      const bookData = req.body.book ? JSON.parse(req.body.book) : req.body;

      if (req.file) {
          if (book.imageUrl?.startsWith(`${req.protocol}://${req.get("host")}/uploads/`)) {
              const oldImagePath = path.join(__dirname, "..", book.imageUrl.replace(`${req.protocol}://${req.get("host")}`, ""));
              if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
          }
          book.imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      }

      Object.assign(book, bookData);
      await book.save();

      res.status(200).json({ message: "Livre mis à jour avec succès", book });

  } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du livre", error });
  }
};

  exports.rateBook = async (req, res) => {
    try {
      if (!req.auth || !req.auth.userId) {
        return res.status(401).json({ message: "Utilisateur non authentifié !" });
      }
  
      const { rating } = req.body;
      const userId = req.auth.userId;
      const bookId = req.params.id;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "La note doit être entre 1 et 5" });
      }
  
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      const existingRatingIndex = book.ratings.findIndex(r => r.userId === userId);
  
      if (existingRatingIndex !== -1) {
        book.ratings[existingRatingIndex].grade = rating;
      } else {
        book.ratings.push({ userId, grade: rating });
      }
  
      const totalGrades = book.ratings.reduce((sum, r) => sum + r.grade, 0);
      const totalRatings = book.ratings.length;
      book.averageRating = totalRatings > 0 ? Number((totalGrades / totalRatings).toFixed(2)) : 0;
  
      await book.save();
      res.status(200).json(book);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur lors de la notation du livre" });
    }
  };

  exports.getBestRatedBooks = async (req, res) => {
    try {
        const books = await Book.find().sort({ averageRating: -1 }).limit(3);
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des livres", error });
    }
};



