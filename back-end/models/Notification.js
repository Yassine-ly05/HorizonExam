const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Student = require("./Student");

const Notification = sequelize.define("Notification", {
  title: { type: DataTypes.STRING, allowNull: false },
  message: DataTypes.TEXT,
  type: {
    type: DataTypes.ENUM("info", "success", "warning"),
    allowNull: false,
    defaultValue: "info",
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: "notifications",
  timestamps: true
});
Student.hasMany(Notification, { foreignKey: "student_id" });
Notification.belongsTo(Student, { foreignKey: "student_id" });

module.exports = Notification;