const express = require("express");
const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();
const path = require('path');


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

  const app = express();

module.exports = app;