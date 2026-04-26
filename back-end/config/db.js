const path = require("path");
const { Sequelize } = require("sequelize");
require("dotenv").config();

const shouldUseMysql = Boolean(
  process.env.DB_HOST || process.env.DB_USER || process.env.DB_PASSWORD || process.env.DB_NAME
);
const dialect = process.env.DB_DIALECT || (shouldUseMysql ? "mysql" : "sqlite");

let sequelize;

if (dialect === "sqlite") {
  const storage =
    process.env.DB_STORAGE || path.join(__dirname, "..", "horizonexam.sqlite");
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage,
    logging: false,
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || "horizon_exam",
    process.env.DB_USER || "root",
    process.env.DB_PASSWORD || "",
    {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      dialect: "mysql",
      logging: false,
    }
  );
}

module.exports = sequelize;
