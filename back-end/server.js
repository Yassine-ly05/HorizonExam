/**
 * Point d'entrée principal du serveur Back-end
 */
const path = require("path");

// Message de démarrage pour confirmer la version du serveur
console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
console.log("!! SERVER IS STARTING - VERSION: 2.0 (MYSQL)   !!");
console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

// Chargement des variables d'environnement
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const sequelize = require("./config/db");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

// Importation de tous les modèles pour initialiser les relations Sequelize
require("./models/User");
require("./models/Result");
require("./models/Attendance");
require("./models/ExamSession");
require("./models/Timetable");
require("./models/Notification");
require("./models/DoubleCorrectionRequest");
require("./models/ExamReport");
require("./models/EliminationRequest");
require("./models/ClassGroup");
require("./models/Subject");
require("./models/Room");

// Importation des routes
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const DEFAULT_PORT = Number(process.env.PORT || 5000);
let isDatabaseReady = false;

// Identifiants par défaut pour l'administrateur
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@horizon-university.tn";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin12345";

/**
 * Configuration des Middlewares
 */
app.use(cors({ origin: true, credentials: true })); // Autorise les requêtes Cross-Origin
app.use(helmet()); // Sécurise les en-têtes HTTP
app.use(morgan("dev")); // Affiche les logs des requêtes HTTP
app.use(express.json()); // Permet de lire le JSON dans les corps de requête

// Middleware pour vérifier si la base de données est prête
app.use((req, res, next) => {
  if (req.path.startsWith("/health")) return next();
  if (isDatabaseReady) return next();
  return res.status(503).json({
    message: "Database is not ready. Ensure the backend database is running and try again.",
  });
});

/**
 * Définition des Routes API
 */
app.use("/auth", authRoutes); // Authentification (Login, Google Login)
app.use("/api/student", studentRoutes); // Espace Étudiant
app.use("/api/teacher", teacherRoutes); // Espace Enseignant
app.use("/api/admin", adminRoutes); // Espace Administration

// Routes de test de santé (Health Check)
app.get("/health", (req, res) => res.json({ status: "OK", timestamp: new Date() }));
app.get("/health/db", (req, res) => res.json({ ...(sequelize.__dbInfo || {}), timestamp: new Date() }));

/**
 * Gestionnaire d'erreurs global
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

/**
 * Fonction de démarrage du serveur et synchronisation DB
 */
const startServer = async ({ port = DEFAULT_PORT } = {}) => {
  try {
    // Tentative de connexion à la base de données
    await sequelize.authenticate();
    isDatabaseReady = true;
    console.log("Database connected successfully.");
    
    // Création automatique de l'administrateur s'il n'existe pas (en mode dev)
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: false });
      const admin = await User.findOne({ where: { email: ADMIN_EMAIL } });

      if (!admin) {
        await User.create({
          name: "Admin Horizon",
          email: ADMIN_EMAIL,
          password: await bcrypt.hash(ADMIN_PASSWORD, 10),
          role: "admin",
        });
        console.log("Default admin account created.");
      }
    }
  } catch (error) {
    isDatabaseReady = false;
    console.error("Unable to connect to the database:", error);
  } finally {
    // Démarrage effectif du serveur Express
    return await new Promise((resolve) => {
      const server = app.listen(port, () => {
        const address = server.address();
        const actualPort = typeof address === "object" && address ? address.port : port;
        console.log(`Server running on port ${actualPort}`);
        resolve(server);
      });
    });
  }
};

// Démarrage automatique si le script est lancé directement
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
