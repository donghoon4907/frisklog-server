import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.join(__dirname, `../../.env.${process.env.NODE_ENV}`)
});

export default {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
    host: process.env.HOST,
    dialect: process.env.DB_TYPE,
    operatorsAliases: 0
  },
  test: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
    host: process.env.HOST,
    dialect: process.env.DB_TYPE,
    operatorsAliases: 0
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
    host: process.env.HOST,
    dialect: process.env.DB_TYPE,
    operatorsAliases: 0
  }
};
