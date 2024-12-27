"use strict"

const express = require("express");
const router = express.Router();

const userCtrl = require("../controller/user.controller");
console.log("Nous sommes dans la route user.route.js");
router.post("/signup", userCtrl.signup);
router.post("/login", userCtrl.login);

module.exports = router;