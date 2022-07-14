import Sequelize from "sequelize";
import { mysqlConfig } from "../config";
import User from "./user";
import Post from "./post";
import Comment from "./comment";
// import Category from "./category";
import History from "./history";
// import Notice from "./notice";
import BackupQueue from "./backup_queue";

const env = process.env.NODE_ENV || "development";

const { database, username, password } = mysqlConfig[env];

const db = {};

const sequelize = new Sequelize(database, username, password, mysqlConfig[env]);

db.User = User(sequelize, Sequelize);
db.Post = Post(sequelize, Sequelize);
db.Comment = Comment(sequelize, Sequelize);
// db.Category = Category(sequelize, Sequelize);
db.History = History(sequelize, Sequelize);
// db.Notice = Notice(sequelize, Sequelize);
db.BackupQueue = BackupQueue(sequelize, Sequelize);

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;

db.Sequelize = Sequelize;

export default db;
