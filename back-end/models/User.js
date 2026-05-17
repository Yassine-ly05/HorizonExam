/**
 * Modèle Utilisateur (User) pour Sequelize
 */
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  // Nom complet de l'utilisateur
  name: { type: DataTypes.STRING, allowNull: false },
  
  // Email unique (utilisé pour le login)
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  
  // Mot de passe (hashé en base)
  password: { type: DataTypes.STRING, allowNull: false },
  
  // Rôle de l'utilisateur déterminant ses permissions
  role: {
    type: DataTypes.ENUM("student", "teacher", "admin"),
    allowNull: false,
    defaultValue: "student",
  },
  
  // Classe (pour les étudiants, ex: ING1-A)
  class: DataTypes.STRING,
  
  // Semestre actuel
  semester: DataTypes.INTEGER
}, {
  tableName: "users", // Nom de la table dans MySQL
  timestamps: true    // Ajoute automatiquement createdAt et updatedAt
});

module.exports = User; 