const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const ExamSession = sequelize.define("ExamSession", {
  subject: { type: DataTypes.STRING, allowNull: false },
  exam_type: { type: DataTypes.ENUM('Exam','DS','CC','Remedial'), allowNull: false },
  exam_date: { type: DataTypes.DATEONLY, allowNull: false },
  start_time: DataTypes.TIME,
  end_time: DataTypes.TIME,
  room: DataTypes.STRING,
}, {
  tableName: "exam_sessions",
  timestamps: true
});

User.hasMany(ExamSession, { foreignKey: "teacher_id" });
ExamSession.belongsTo(User, { foreignKey: "teacher_id" });

module.exports = ExamSession;