const express = require("express");
const { createBook, getAllBooks, getBookById, deleteBook, updateBook, rateBook, getBookImage, getBestRatedBooks, processImage } = require("../controllers/book");
const authMiddleware = require("../middlewares/auth");
const upload  = require("../config/multer");

const router = express.Router();

router.post("/", authMiddleware, upload.single("image"), processImage, createBook);
router.post("/:id/rating", authMiddleware, rateBook);
router.put("/:id", authMiddleware, upload.single("image"), processImage, (req, res, next) => {
    if (!req.file) {
        req.fileId = null;
    }
    next();
}, updateBook);


router.get("/", getAllBooks);
router.get("/bestrating", getBestRatedBooks);
router.get("/:id", getBookById);
router.get("/image/:id", getBookImage);
router.delete("/:id", authMiddleware, deleteBook);

module.exports = router;
