"use strict"

const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const bookCtrl = require("../controller/book.controller");

// Public routes
router.get("/", bookCtrl.list);
router.get("/bestrating", bookCtrl.rank);
router.get("/:id", bookCtrl.read);


// Private routes
router.post("/", auth, bookCtrl.create);
router.put("/:id", auth, bookCtrl.update);
router.delete("/:id", auth, bookCtrl.delete);
router.post("/:id/rate", auth, bookCtrl.rate);

module.exports = router;