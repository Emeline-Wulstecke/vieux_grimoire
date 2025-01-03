const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const formidable = require("formidable");
const Book = require("../model/book.model");

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
exports.create = async (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: "Erreur lors de l'upload" });

    try {
      const { title, author, year, genre } = fields;
      const image = files.image;

      if (!title || !author || !year || !genre || !image) {
        return res.status(400).json({ message: "Tous les champs sont requis" });
      }

      const imagePath = path.join(__dirname, "../uploads/", image.newFilename);

        // Process the image using sharp
      await sharp(image.filepath)
        .resize(500)
        .toFormat("jpeg")
        .jpeg({ quality: 80 })
        .toFile(imagePath);

      const newBook = new Book({
        userId: req.auth.userId,
        title,
        author,
        year,
        genre,
        imageUrl: `/uploads/${image.newFilename}`,
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

// Update an existing book
exports.update = async (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: "Erreur lors de l'upload" });

    try {
      const { title, author, year, genre } = fields;
      const image = files.image;

      const book = await Book.findById(req.params.id);
      if (!book) return res.status(404).json({ message: "Livre introuvable" });

      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: "Action non autorisée" });
      }

      if (image) {
        const imagePath = path.join(__dirname, "../uploads/", image.newFilename);
        await sharp(image.filepath)
          .resize(500)
          .toFormat("jpeg")
          .jpeg({ quality: 80 })
          .toFile(imagePath);
        fields.imageUrl = `/uploads/${image.newFilename}`;
      }

      const updatedBook = await Book.findByIdAndUpdate(req.params.id, fields, {
        new: true,
      });

      res.status(200).json(updatedBook);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

// Delete a book by its ID
exports.delete = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });

    if (book.userId !== req.auth.userId) {
      return res.status(403).json({ message: "Action non autorisée" });
    }

    const imagePath = path.join(__dirname, "../uploads/", path.basename(book.imageUrl));
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

    await book.deleteOne();
    res.status(200).json({ message: "Livre supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Rate a book
exports.rate = async (req, res) => {
  try {
    const { grade } = req.body;

    if (!grade || grade < 1 || grade > 5) {
      return res.status(400).json({ message: "La note doit être entre 1 et 5" });
    }

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });

    const existingRating = book.ratings.find(r => r.userId === req.auth.userId);

    if (existingRating) {
      existingRating.grade = grade;
    } else {
      book.ratings.push({ userId: req.auth.userId, grade });
    }

    book.averageRating =
      book.ratings.reduce((acc, r) => acc + r.grade, 0) / book.ratings.length;

    await book.save();
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};