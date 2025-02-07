const bcrypt = require("bcrypt");  // Module pour le hachage des mots de passe
const User = require("../model/user.model"); // Importation du modèle utilisateur
const jwt = require("jsonwebtoken"); // Module pour la gestion des tokens JWT

// Contrôleur pour l'inscription d'un utilisateur
exports.signup = (req, res, next) => {
  User.findOne({ email: req.body.email }) // Vérifie si l'email existe déjà
    .then((existingUser) => {
      if (existingUser) {
        return res.status(400).json({ error: "Email déjà utilisé !" });
      }

  // Hachage du mot de passe avec bcrypt (10 rounds de salage)
      bcrypt
        .hash(req.body.password, 10)
        .then((hash) => {
          const user = new User({
            email: req.body.email,
            password: hash,
          });

  // Sauvegarde de l'utilisateur en base de données
          user
            .save()
            .then(() => res.status(201).json({ message: "Utilisateur créé !" }))
            .catch((error) => res.status(400).json({ error }));
        })
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};


exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: "Utilisateur non trouvé !" });
      }

      bcrypt.compare(req.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            return res.status(401).json({ error: "Mot de passe incorrect !" });
          }

          // Générer un vrai token JWT
          const token = jwt.sign(
            { userId: user._id }, // Payload : données encodées dans le token
            process.env.JWT_SECRET, // Clé secrète pour signer le token
            { expiresIn: "24h" } // Durée de validité
          );

          res.status(200).json({
            userId: user._id,
            token: token,
          });
        })
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
