const mongoose = require("mongoose");

const bookSchema = mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  imageId: { type: mongoose.Schema.Types.ObjectId, ref: "uploads" },
  ratings: [
    {
      userId: { type: String, required: true },
      grade: { type: Number, required: true, min: 0, max: 5 },
    },
  ],
  averageRating: { type: Number, default: 0 },
});

module.exports = mongoose.model("Book", bookSchema);
