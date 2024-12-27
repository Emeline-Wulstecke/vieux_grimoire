const mongoose = require('mongoose');

const bookSchema = mongoose.Schema({
    userId: { type: String, required: true }, // L'utilisateur qui a créé le livre
    title: { type: String, required: true },
    author: { type: String, required: true },
    year: { type: Number, required: true },
    genre: { type: String, required: true },
    imageUrl: { type: String, required: true }, // URL de l'image
    ratings: [
        {
            userId: { type: String, required: true }, // Utilisateur ayant noté
            grade: { type: Number, required: true }  // Note
        }
    ],
    averageRating: { type: Number, default: 0 } // Note moyenne
});

module.exports = mongoose.model('Book', bookSchema);
