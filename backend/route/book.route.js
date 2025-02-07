"use strict"

const express = require("express");
const router = express.Router();

// Importation du middleware d'authentification
const auth = require("../middleware/auth.middleware");

// Importation du contrôleur pour la gestion des livres
const bookCtrl = require("../controller/book.controller");

// Public routes
router.get("/", bookCtrl.list);
router.get("/bestrating", bookCtrl.rank);
router.get("/:id", bookCtrl.read); // Récupérer les détails d'un livre spécifique

 
// Private routes
router.post("/", auth, bookCtrl.create);
router.put("/:id", auth, bookCtrl.update);
router.delete("/:id", auth, bookCtrl.delete);
router.post("/:id/rating", auth, bookCtrl.rate);

module.exports = router;