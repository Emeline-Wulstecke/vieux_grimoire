const mongoose = require("mongoose");
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

// Ajouter le plugin pour gérer l'unicité
userSchema.plugin(uniqueValidator, { message: "L'adresse e-mail {VALUE} est déjà utilisée." });

module.exports = mongoose.model("User", userSchema);
