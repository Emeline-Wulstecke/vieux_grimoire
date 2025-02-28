const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const formidable = require("formidable");
const Book = require("../model/book.model");

const PUBLIC_URL = "../frontend/public";
const IMG_URL = "/images/";
const BACK_IMG_URL = PUBLIC_URL+IMG_URL;
const form = new formidable.IncomingForm({
  uploadDir: BACK_IMG_URL, // Répertoire où les fichiers seront sauvegardés
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
    const books = await Book.find().sort({ averageRating: -1 }).limit(3);
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
      return next(err);
    }

    try {
      const book = JSON.parse(fields.book[0]);
      const title = book.title;
      const author =  book.author;
      const year = book.year;
      const genre = book.genre;
      const image = files.image[0].filepath;

      if (!title || !author || !year || !genre || !image) {
        return res.status(400).json({ message: "Tous les champs (y compris l'image) sont requis." });
      }

      // Nom de l'image et chemin cible
      const imageName = `${IMG_URL}${title.replace(/ /g, "_")}-${Date.now()}.webp`;

      // Traitement de l'image avec Sharp
      await sharp(image)
        .resize(500)
        .toFormat("webp")
        .toFile(PUBLIC_URL+imageName); 

        // Supprimer l'image originale après traitement
      if (fs.existsSync(image)) fs.unlinkSync(image);
       
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

exports.update = async (req, res) => {
form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Erreur lors de l'analyse de la requête :", err);
      return res.status(500).json({ message: "Erreur lors de l'analyse de la requête", error: err.message });
    }

    try {
      const bookId = req.params.id;
   

      const book = await Book.findById(bookId);
      if (!book) {
        console.error("Livre introuvable");
        return res.status(404).json({ message: "Livre introuvable" });
      }

      if (book.userId !== req.auth.userId) {
        console.error("Non autorisé à modifier ce livre");
        return res.status(403).json({ message: "Non autorisé à modifier ce livre" });
      }

      const parsedFields = JSON.parse(fields.book[0]);
      const updatedBook = {
        title: parsedFields.title || book.title,
        author: parsedFields.author || book.author,
        year: parsedFields.year || book.year,
        genre: parsedFields.genre || book.genre,
        imageUrl: book.imageUrl,
      };

      const image = files.image[0].filepath;

      if (image) {
        const imageName = `${IMG_URL}${updatedBook.title.replace(/ /g, "_")}-${Date.now()}.webp`;

        await sharp(image)
          .resize(500)
          .toFormat("webp")
          .toFile(PUBLIC_URL + imageName);

        if (book.imageUrl && fs.existsSync(PUBLIC_URL + book.imageUrl)) {
          fs.unlinkSync(PUBLIC_URL + book.imageUrl);
        }

        updatedBook.imageUrl = imageName;
        fs.unlinkSync(image);
      }

      const savedBook = await Book.findByIdAndUpdate(bookId, updatedBook, {
        new: true,
        runValidators: true,
      });

      const bookToReturn = {
        ...savedBook.toObject(),
        id: savedBook._id,
      };
      delete bookToReturn._id;

      res.status(200).json(bookToReturn);
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour du livre", error: error.message });
    }
  });
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

    const imagePath = path.join(PUBLIC_URL, book.imageUrl);
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
    const { rating } = req.body;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Livre introuvable" });

    const existingRating = book.ratings.find((rating) => rating.userId === req.auth.userId);
    if (existingRating) {
      return res.status(400).json({ message: "Vous avez déjà noté ce livre" });
    }

    book.ratings.push({ userId: req.auth.userId, grade:rating });

    const totalRating = book.ratings.reduce((sum, r) => sum + r.grade, 0);
    book.averageRating = totalRating / book.ratings.length;

    await book.save();
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
