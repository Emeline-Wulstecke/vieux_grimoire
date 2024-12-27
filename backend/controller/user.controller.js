const bcrypt = require("bcrypt");
const User = require("../model/user.model");
const jwt = require("jsonwebtoken");

exports.signup = (req, res, next) => {
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      const user = new User({
        email: req.body.email,
        password: hash,
      });
      // Sauvegarde de l'utilisateur dans la base de données
      user
        .save()
        .then(() => res.status(201).json({ message: "Utilisateur créé !" }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
  console.log("Requête reçue pour login :", req.body);

  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        console.log("Utilisateur non trouvé !");
        return res.status(401).json({ error: "Utilisateur non trouvé !" });
      }
      console.log("Utilisateur trouvé :", user);

      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            console.log("Mot de passe incorrect !");
            return res.status(401).json({ error: "Mot de passe incorrect !" });
          }
          console.log("Authentification réussie !");
          res.status(200).json({
            userId: user._id,
            token: jwt.sign({ userId: user._id }, process.env.JWT_SECRET , {
              expiresIn: "24h",
            }),
          });
        })
        .catch((error) => {
          console.error("Erreur lors de la comparaison :", error);
          res.status(500).json({ error });
        });
    })
    .catch((error) => {
      console.error("Erreur lors de la recherche de l'utilisateur :", error);
      res.status(500).json({ error });
    });
};
