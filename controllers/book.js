const mongoose = require("mongoose");
const Book = require("../models/book");
const GridFSBucket = require("mongodb").GridFSBucket;

const conn = mongoose.connection;
let gfs;

conn.once("open", () => {
  gfs = new GridFSBucket(conn.db, { bucketName: "uploads" });
});

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
    let bookData;
    if (typeof req.body.book === "string") {
      bookData = JSON.parse(req.body.book);
    } else {
      bookData = req.body;
    }
    const { userId, title, author, year, genre, ratings, averageRating } = bookData;

    if (!userId || !title || !author || !year || !genre) {
      return res.status(400).json({ message: "Données invalides" });
    }

    const imageId = req.fileId ? new mongoose.Types.ObjectId(req.fileId) : null;
    const imageUrl = imageId ? `/api/books/image/${imageId}` : null; 

    const newBook = new Book({
        userId,
        title,
        author,
        year,
        genre,
        imageUrl: imageId ? `http://localhost:4000/api/books/image/${imageId}` : null, 
        ratings: ratings || [],
        averageRating: averageRating || 0
      });

    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
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
      const bookId = req.params.id;  
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      const updatedBookData = JSON.parse(req.body.book); 
      if (req.fileId) {
        console.log("📸 Nouvelle image reçue, ID :", req.fileId);
        book.imageId = req.fileId; 
      }
  
      Object.assign(book, updatedBookData);
      await book.save();
      res.status(200).json({ message: "Livre mis à jour avec succès", book });
    } catch (error) {
      res.status(500).json({ message: "Erreur interne du serveur" });
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



