const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Student = require("./Student");
const ExamSession = require("./ExamSession");

const Attendance = sequelize.define("Attendance", {
  exam_date: { type: DataTypes.DATEONLY, allowNull: false },
  exam_type: { type: DataTypes.ENUM('Exam','DS','CC','Remedial'), allowNull: false },
  status: { type: DataTypes.ENUM('Present','Absent'), allowNull: false },
  teacher_id: DataTypes.INTEGER,
}, {
  tableName: "attendance",
  timestamps: true
});
Student.hasMany(Attendance, { foreignKey: "student_id" });
Attendance.belongsTo(Student, { foreignKey: "student_id" });
ExamSession.hasMany(Attendance, { foreignKey: "exam_session_id" });
Attendance.belongsTo(ExamSession, { foreignKey: "exam_session_id" });

module.exports = Attendance;