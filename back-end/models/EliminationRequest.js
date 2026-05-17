const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");
const ExamSession = require("./ExamSession");

const EliminationRequest = sequelize.define(
  "EliminationRequest",
  {
    request_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    reason: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM("Pending", "Accepted", "Rejected"), defaultValue: "Pending" },
    decision_note: DataTypes.TEXT,
  },
  {
    tableName: "elimination_requests",
    timestamps: true,
  }
);

User.hasMany(EliminationRequest, { foreignKey: "student_id", as: "StudentEliminations" });
EliminationRequest.belongsTo(User, { foreignKey: "student_id", as: "Student" });

User.hasMany(EliminationRequest, { foreignKey: "teacher_id", as: "TeacherEliminations" });
EliminationRequest.belongsTo(User, { foreignKey: "teacher_id", as: "Teacher" });

ExamSession.hasMany(EliminationRequest, { foreignKey: "exam_session_id" });
EliminationRequest.belongsTo(ExamSession, { foreignKey: "exam_session_id" });

module.exports = EliminationRequest;
