const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");        
const ExamSession = require('./ExamSession');

const Result = sequelize.define("Result", {
  grade: { type: DataTypes.FLOAT, allowNull: false },
  semester: DataTypes.INTEGER,
  status: {
    type: DataTypes.ENUM("Pending", "Validated", "Published"),
    allowNull: false,
    defaultValue: "Pending",
  },
}, {
  tableName: "results",
  timestamps: true
});

// علاقات
User.hasMany(Result, { foreignKey: "student_id" });
Result.belongsTo(User, { foreignKey: "student_id" });

ExamSession.hasMany(Result, { foreignKey: "exam_session_id" });
Result.belongsTo(ExamSession, { foreignKey: "exam_session_id" });

module.exports = Result;