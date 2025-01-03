const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      console.error("Authorization header is missing");
      return res.status(401).json({ error: "Authorization header missing!" });
    }

    // Extraire le token
    const token = req.headers.authorization.split(" ")[1];
    console.log("Token:", token);

    if (!token) {
      console.error("Token is missing");
      return res.status(401).json({ error: "Token missing!" });
    }

    // Vérifiez et décodez le token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Attacher l'ID utilisateur extrait à la requête
    req.auth = { userId: decodedToken.userId };
    console.log("Authenticated User ID:", req.auth.userId);
    
    next();
  } catch (error) {
    // Log l'erreur
    console.error("Token validation error:", error.message);

    // Renvoyer une réponse d'erreur
    return res.status(401).json({ error: "Invalid or expired token!" });
  }
};
