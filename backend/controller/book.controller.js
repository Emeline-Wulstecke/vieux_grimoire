const Book = require('../model/book.book');
const fs = require('fs');

// GET /api/books
exports.getAllBooks = async (req, res) => {
    try {
        const books = await Book.find();
        res.status(200).json(books);
    } catch (error) {
        res.status(400).json({ error });
    }
};

// GET /api/books/:id
exports.getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Livre non trouvé' });
        }
        res.status(200).json(book);
    } catch (error) {
        res.status(400).json({ error });
    }
};

// GET /api/books/bestrating
exports.getBestRatedBooks = async (req, res) => {
    try {
        const books = await Book.find().sort({ averageRating: -1 }).limit(3);
        res.status(200).json(books);
    } catch (error) {
        res.status(400).json({ error });
    }
};

// POST /api/books
exports.createBook = async (req, res) => {
    try {
        const bookObject = JSON.parse(req.body.book);
        const book = new Book({
            ...bookObject,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
            averageRating: 0,
            ratings: []
        });
        await book.save();
        res.status(201).json({ message: 'Livre enregistré avec succès !' });
    } catch (error) {
        res.status(400).json({ error });
    }
};

// PUT /api/books/:id
exports.updateBook = async (req, res) => {
    try {
        const bookObject = req.file
            ? {
                  ...JSON.parse(req.body.book),
                  imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
              }
            : { ...req.body };

        const book = await Book.findByIdAndUpdate(req.params.id, { ...bookObject }, { new: true });
        if (!book) {
            return res.status(404).json({ message: 'Livre non trouvé' });
        }
        res.status(200).json({ message: 'Livre mis à jour avec succès !' });
    } catch (error) {
        res.status(400).json({ error });
    }
};

// DELETE /api/books/:id
exports.deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Livre non trouvé' });
        }
        const filename = book.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, async () => {
            await Book.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: 'Livre supprimé avec succès !' });
        });
    } catch (error) {
        res.status(400).json({ error });
    }
};

// POST /api/books/:id/rating
exports.addRating = async (req, res) => {
    try {
        const { userId, rating } = req.body;
        if (rating < 0 || rating > 5) {
            return res.status(400).json({ message: 'La note doit être comprise entre 0 et 5' });
        }

        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Livre non trouvé' });
        }

        if (book.ratings.some((r) => r.userId === userId)) {
            return res.status(400).json({ message: 'Utilisateur a déjà noté ce livre' });
        }

        book.ratings.push({ userId, grade: rating });
        book.averageRating =
            book.ratings.reduce((acc, r) => acc + r.grade, 0) / book.ratings.length;

        await book.save();
        res.status(200).json(book);
    } catch (error) {
        res.status(400).json({ error });
    }
};
