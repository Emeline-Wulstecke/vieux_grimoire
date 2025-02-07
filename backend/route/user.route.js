"use strict"

const express = require("express");
const router = express.Router();

// Importation du contrôleur utilisateur
const userCtrl = require("../controller/user.controller");

router.post("/signup", userCtrl.signup);
router.post("/login", userCtrl.login);

// Exportation du routeur pour l'utiliser dans l'application principale
module.exports = router;