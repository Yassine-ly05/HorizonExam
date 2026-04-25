const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");
const ExamSession = require("./ExamSession");

const Attendance = sequelize.define("Attendance", {
  exam_date: { type: DataTypes.DATEONLY, allowNull: false },
  exam_type: { type: DataTypes.ENUM('Exam','DS','CC','Remedial'), allowNull: false },
  status: { type: DataTypes.ENUM('Present','Absent'), allowNull: false },
}, {
  tableName: "attendance",
  timestamps: true
});

User.hasMany(Attendance, { foreignKey: "student_id" });
Attendance.belongsTo(User, { foreignKey: "student_id" });

User.hasMany(Attendance, { foreignKey: "teacher_id", as: "TeacherAttendance" });
Attendance.belongsTo(User, { foreignKey: "teacher_id", as: "Teacher" });

ExamSession.hasMany(Attendance, { foreignKey: "exam_session_id" });
Attendance.belongsTo(ExamSession, { foreignKey: "exam_session_id" });

module.exports = Attendance;