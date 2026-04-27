const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");
const Result = require("./Result");

const DoubleCorrectionRequest = sequelize.define("DoubleCorrectionRequest", {
  request_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('Pending','Accepted','Rejected'), defaultValue: 'Pending' },
  decision_note: DataTypes.TEXT,
}, {
  tableName: "double_correction_requests",
  timestamps: true
});
User.hasMany(DoubleCorrectionRequest, { foreignKey: "student_id" });
DoubleCorrectionRequest.belongsTo(User, { foreignKey: "student_id" });

Result.hasMany(DoubleCorrectionRequest, { foreignKey: "result_id" });
DoubleCorrectionRequest.belongsTo(Result, { foreignKey: "result_id" });

module.exports = DoubleCorrectionRequest;