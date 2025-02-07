const http  = require("http");
const app   = require("./app");

// Fonction pour normaliser le port
const normalizePort = val => {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
};

// Définition du port à utiliser
const port = normalizePort(process.env.PORT || "4000");
app.set("port", port);

// Gestionnaire d'erreurs
const errorHandler = error => {
  if (error.syscall !== "listen") {
    throw error;
  }

  const address = server.address(); // Récupère l'adresse du serveur
  const bind    = typeof address === "string" ? "pipe " + address : "port: " + port;

    // Gestion des erreurs spécifiques
  switch (error.code) {
    case "EACCES": // Permission refusée
      console.error(bind + " requires elevated privileges.");
      process.exit(1); // Arrête l'exécution avec un code d'erreur
      break;

    case "EADDRINUSE":
      console.error(bind + " is already in use.");
      process.exit(1);
      break;

    default:
      throw error;
  }
};

// Création du serveur HTTP en utilisant l'application Express
const server = http.createServer(app);

server.on("error", errorHandler);
// Gestionnaire d'événement lorsque le serveur démarre correctement
server.on("listening", () => {
  
  const address = server.address();
  const bind    = typeof address === "string" ? "pipe " + address : "port " + port;

  console.log("Listening on " + bind);
});

// Le serveur écoute sur le port défini
server.listen(port);