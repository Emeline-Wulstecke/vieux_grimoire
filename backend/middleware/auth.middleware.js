const jwt = require("jsonwebtoken"); // Importation du module jsonwebtoken pour gérer l'authentification avec JWT

// Middleware d'authentification
module.exports = (req, res, next) => {
  try {
    // Vérifier si l'en-tête Authorization est présent
    if (!req.headers.authorization) {
      console.error("Authorization header is missing");
      return res.status(401).json({ error: "Authorization header missing!" });
    }

   // Extraire le token de l'en-tête Authorization 
    const token = req.headers.authorization.split(" ")[1];


    // Vérifier si un token a bien été extrait
    if (!token) {
      console.error("Token is missing");
      return res.status(401).json({ error: "Token missing!" });
    }

    // Vérifier et décoder le token en utilisant la clé secrète définie dans les variables d'environnement
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Attacher l'ID utilisateur extrait à la requête
    req.auth = { userId: decodedToken.userId };
    
     // Passer au middleware suivant
    next();
  } catch (error) {
    // Log l'erreur en cas d'échec de la vérification du token
    console.error("Token validation error:", error.message);

    // Renvoyer une réponse d'erreur
    return res.status(401).json({ error: "Invalid or expired token!" });
  }
};
