// Importation du module Mongoose pour gérer la base de données MongoDB
const mongoose = require("mongoose");

// Importation du plugin pour vérifier l'unicité des champs dans MongoDB
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "L'adresse e-mail est obligatoire."],
    unique: true,
    match: [/.+\@.+\..+/, "Veuillez entrer une adresse e-mail valide."]
  },
  password: {
    type: String,
    required: [true, "Le mot de passe est obligatoire."]
  },
});

// Ajout du plugin mongoose-unique-validator pour gérer l'unicité et retourner des erreurs claires
userSchema.plugin(uniqueValidator, { message: "L'adresse e-mail {VALUE} est déjà utilisée." });

// Exportation du modèle "User" basé sur le schéma défini
module.exports = mongoose.model("User", userSchema);
