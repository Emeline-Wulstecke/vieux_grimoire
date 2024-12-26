const express = require('express');
const app = express();
require('dotenv').config(); 

const mongoose = require("mongoose");
const path = require('path');

// Connection à la base de données MongoDB
const dbURI = `mongodb+srv://${process.env.DB_ID}:${process.env.DB_PASS}@${process.env.DB_NAME}.mongodb.net/?retryWrites=true&w=majority`;

// Connexion à MongoDB
mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

  // Middleware CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });
  
  // Middleware JSON
  app.use(express.json());
  
// Routes 

app.use("/api/auth", require("./route/user.route"));

module.exports = app;