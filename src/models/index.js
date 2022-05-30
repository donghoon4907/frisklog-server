import Sequelize from "sequelize";
import config from "../config";
import user from "./user";

const env = process.env.NODE_ENV || "development";

const { database, username, password } = config[env];

const db = {};

const sequelize = new Sequelize(database, username, password, config[env]);

db.user = user(sequelize, Sequelize);

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;

db.Sequelize = Sequelize;

export default db;
