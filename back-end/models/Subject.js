const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Subject = sequelize.define(
  "Subject",
  {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  {
    tableName: "subjects",
    timestamps: true,
  }
);

module.exports = Subject;
