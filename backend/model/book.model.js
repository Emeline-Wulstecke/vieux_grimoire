const mongoose = require('mongoose');

// Définition du schéma pour les livres
const bookSchema = mongoose.Schema({
    userId: { type: String, required: true }, 
    title: { type: String, required: true },
    author: { type: String, required: true },
    year: { type: Number, required: true },
    genre: { type: String, required: true },
    imageUrl: { type: String, required: true },
    ratings: [
        {
            userId: { type: String, required: true }, // ID de l'utilisateur qui a noté le livre
            grade: { type: Number, required: true }  
        }
    ],
    averageRating: { type: Number, default: 0 } // Note moyenne
});

module.exports = mongoose.model('Book', bookSchema);
