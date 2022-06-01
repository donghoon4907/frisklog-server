import Sequelize from "sequelize";
import config from "../config";
import User from "./user";
import Post from "./post";
import Comment from "./comment";
import Category from "./category";
import History from "./history";
import Notice from "./notice";

const env = process.env.NODE_ENV || "development";

const { database, username, password } = config[env];

const db = {};

const sequelize = new Sequelize(database, username, password, config[env]);

db.User = User(sequelize, Sequelize);
db.Post = Post(sequelize, Sequelize);
db.Comment = Comment(sequelize, Sequelize);
db.Category = Category(sequelize, Sequelize);
db.History = History(sequelize, Sequelize);
db.Notice = Notice(sequelize, Sequelize);

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;

db.Sequelize = Sequelize;

export default db;
