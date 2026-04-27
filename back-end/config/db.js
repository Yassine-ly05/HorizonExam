/**
 * Configuration de la base de données avec Sequelize
 */
const path = require("path");
const { Sequelize } = require("sequelize");

// Chargement des variables d'environnement depuis le fichier .env
const envPath = path.join(__dirname, "..", ".env");
require("dotenv").config({ path: envPath });

// Récupération des paramètres de connexion
const dbDialect = process.env.DB_DIALECT || "sqlite"; // Fallback to sqlite for easy local setup
const dbName = process.env.DB_NAME || "horizon_exam";
const dbUser = process.env.DB_USER || "root";
const dbPass = process.env.DB_PASSWORD || "";
const dbHost = process.env.DB_HOST || "localhost";
const dbPort = process.env.DB_PORT || 3306;

/**
 * Initialisation de l'instance Sequelize
 */
let sequelize;

if (dbDialect === "sqlite") {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: path.join(__dirname, "..", "database.sqlite"),
    logging: false,
  });
} else {
  sequelize = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    port: dbPort,
    dialect: "mysql",
    logging: false,
  });
}

// Information de débogage stockée dans l'instance
sequelize.__dbInfo = { 
  dialect: dbDialect, 
  host: dbDialect === "sqlite" ? "local" : dbHost, 
  port: dbDialect === "sqlite" ? "N/A" : dbPort, 
  database: dbDialect === "sqlite" ? "database.sqlite" : dbName 
};

module.exports = sequelize;
