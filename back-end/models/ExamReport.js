const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const ExamSession = require("./ExamSession");
const User = require("./User");

const ExamReport = sequelize.define(
  "ExamReport",
  {
    report_text: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    tableName: "exam_reports",
    timestamps: true,
  },
);

ExamSession.hasMany(ExamReport, { foreignKey: "exam_session_id" });
ExamReport.belongsTo(ExamSession, { foreignKey: "exam_session_id" });

User.hasMany(ExamReport, { foreignKey: "teacher_id" });
ExamReport.belongsTo(User, { foreignKey: "teacher_id" });

module.exports = ExamReport; 
