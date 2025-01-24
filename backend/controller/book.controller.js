const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const formidable = require("formidable");
const Book = require("../model/book.model");

const IMG_URL = "../frontend/public/images/";
const form = new formidable.IncomingForm({ uploadDir: IMG_URL, keepExtensions: true });

//Public routes
// Fetch the list of all books
exports.list = async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch details of a book by its ID
exports.read = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get books by average rating
exports.rank = async (req, res) => {
  try {
    const books = await Book.find().sort({ averageRating: -1 }).limit(5);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Private routes
// Create a new book entry

exports.create = async (req, res, next) => {
  form.parse(req, async (err, fields, files) => {

    if (err) { next(err); return }

    try {
      const { title, author, year, genre } = fields;
      const {image} = files;

    
      if (!title || !author || !year || !genre || !image) {
        return res.status(400).json({ message: "Tous les champs sont requis" });
      }

      const imageName = title + "-" + Date.now() + ".webp";

        // Process the image using sharp
      await sharp(IMG_URL + image[0].newFilename)
        .resize(500)
        .toFormat("webp")
        .jpeg({ quality: 80 })
        .toFile(IMG_URL + imageName);

      const newBook = new Book({
        userId: req.auth.userId,
        title,
        author,
        year,
        genre,
        imageUrl: imageName,
        ratings: [],
        averageRating: 0,
      });

      await newBook.save();
      res.status(201).json(newBook);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};
// Update a book entry
exports.update = async (req, res) => {
  try {
    const bookId = req.params.id;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });

    if (book.userId !== req.auth.userId) {
      return res.status(403).json({ message: "Non autorisé à modifier ce livre" });
    }

    const updatedBook = await Book.findByIdAndUpdate(bookId, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a book entry
exports.delete = async (req, res) => {
  try {
    const bookId = req.params.id;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });

    if (book.userId !== req.auth.userId) {
      return res.status(403).json({ message: "Non autorisé à supprimer ce livre" });
    }

    await Book.findByIdAndDelete(bookId);

    const imagePath = path.join(IMG_URL, book.imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    res.status(200).json({ message: "Livre supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a rating to a book
exports.rate = async (req, res) => {
  try {
    const bookId = req.params.id;
    const { grade } = req.body;

    if (grade < 1 || grade > 5) {
      return res.status(400).json({ message: "La note doit être comprise entre 1 et 5" });
    }

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });

    const existingRating = book.ratings.find((r) => r.userId === req.auth.userId);
    if (existingRating) {
      return res.status(400).json({ message: "Vous avez déjà noté ce livre" });
    }

    book.ratings.push({ userId: req.auth.userId, grade });

    const totalRating = book.ratings.reduce((sum, r) => sum + r.grade, 0);
    book.averageRating = totalRating / book.ratings.length;

    await book.save();
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
