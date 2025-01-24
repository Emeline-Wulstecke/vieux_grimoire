const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const formidable = require("formidable");
const Book = require("../model/book.model");

const IMG_URL = "../frontend/public/images/";
const form = new formidable.IncomingForm({
  uploadDir: IMG_URL, // Répertoire où les fichiers seront sauvegardés
  keepExtensions: true, // Conserver les extensions des fichiers
  multiples: false, // Empêche les champs et fichiers d'être traités comme des tableaux
});

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
    if (err) {
      console.error("Error parsing form:", err);
      return next(err);
    }

    console.log("Fields received:", fields);
    console.log("Files received:", files);

    try {
      const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
      const author = Array.isArray(fields.author) ? fields.author[0] : fields.author;
      const year = Array.isArray(fields.year) ? fields.year[0] : fields.year;
      const genre = Array.isArray(fields.genre) ? fields.genre[0] : fields.genre;

      const image = Array.isArray(files.image) ? files.image[0] : files.image;

      if (!title || !author || !year || !genre || !image || !image.filepath) {
        return res.status(400).json({ message: "Tous les champs (y compris l'image) sont requis." });
      }

      // Nom de l'image et chemin cible
      const imageName = `${title.replace(/ /g, "_")}-${Date.now()}.webp`;

      // Traitement de l'image avec Sharp
      await sharp(image.filepath) // Chemin source depuis formidable
        .resize(500)
        .toFormat("webp")
        .toFile(path.join(IMG_URL, imageName)); // Chemin cible avec IMG_URL

      // Création du livre
      const newBook = new Book({
        userId: req.auth.userId,
        title,
        author,
        year: parseInt(year, 10),
        genre,
        imageUrl: imageName,
        ratings: [],
        averageRating: 0,
      });

      await newBook.save();
      res.status(201).json(newBook);
    } catch (error) {
      console.error("Error creating book:", error);
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
