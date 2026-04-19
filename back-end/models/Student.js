const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Student = sequelize.define("Student", {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.ENUM("student", "teacher", "admin"),
    allowNull: false,
    defaultValue: "student",
  },
  class: DataTypes.STRING,
  semester: DataTypes.INTEGER
}, {
  tableName: "students",
  timestamps: true
});

module.exports = Student; 