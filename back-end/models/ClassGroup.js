const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ClassGroup = sequelize.define(
  "ClassGroup",
  {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  {
    tableName: "class_groups",
    timestamps: true,
  }
);

module.exports = ClassGroup;
