const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

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
User.hasMany(Notification, { foreignKey: "student_id" });
Notification.belongsTo(User, { foreignKey: "student_id" });

module.exports = Notification;