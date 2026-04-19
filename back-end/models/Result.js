const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Student = require("./Student");        
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
Student.hasMany(Result, { foreignKey: "Student_id" });
Result.belongsTo(Student, { foreignKey: "Student_id" });

ExamSession.hasMany(Result, { foreignKey: "ExamSession_id" });
Result.belongsTo(ExamSession, { foreignKey: "ExamSession_id" });

module.exports = Result;