const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const ExamSession = require("./ExamSession");

const ExamReport = sequelize.define(
  "ExamReport",
  {
    teacher_id: { type: DataTypes.INTEGER, allowNull: false },
    report_text: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    tableName: "exam_reports",
    timestamps: true,
  },
);

ExamSession.hasMany(ExamReport, { foreignKey: "exam_session_id" });
ExamReport.belongsTo(ExamSession, { foreignKey: "exam_session_id" });

module.exports = ExamReport;
