const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const Timetable = sequelize.define("Timetable", {
  exam_date: { type: DataTypes.DATEONLY, allowNull: false },
  start_time: { type: DataTypes.TIME, allowNull: false },
  end_time: { type: DataTypes.TIME },
  room: DataTypes.STRING,
  subject: DataTypes.STRING,
  exam_type: { type: DataTypes.ENUM('Exam','DS','CC','Remedial') }
}, {
  tableName: "timetables",
  timestamps: true
});
User.hasMany(Timetable, { foreignKey: "student_id" });
Timetable.belongsTo(User, { foreignKey: "student_id" });

module.exports = Timetable;