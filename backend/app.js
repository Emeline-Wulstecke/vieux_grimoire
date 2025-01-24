const express = require('express');
const app = express();
const cors = require("cors");
require('dotenv').config(); 

const mongoose = require("mongoose");

// Connexion à la base de données MongoDB
const dbURI = `mongodb+srv://${process.env.DB_ID}:${process.env.DB_PASS}@cluster0.y9qc2qd.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


mongoose
  .connect(dbURI)
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(err => console.error('Connexion à MongoDB échouée :', err));

// Middleware CORS
app.use(cors());

// Middleware JSON
app.use(express.json());

// Routes 
app.use("/api/auth", require("./route/user.route"));
app.use("/api/books", require("./route/book.route"));

module.exports = app;
