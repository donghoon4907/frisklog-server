import Sequelize from "sequelize";

import { mysqlConfig } from "../config";
import User from "./user";
import Post from "./post";
import Comment from "./comment";
import Platform from "./platform";
import Category from "./category";
// import Room from "./room";
// import Member from "./member";
import Message from "./message";
// import History from "./history";

const env = process.env.NODE_ENV || "development";

const { database, username, password } = mysqlConfig[env];

const db = {};

const sequelize = new Sequelize(database, username, password, mysqlConfig[env]);

db.User = User(sequelize, Sequelize);
db.Post = Post(sequelize, Sequelize);
db.Comment = Comment(sequelize, Sequelize);
db.Platform = Platform(sequelize, Sequelize);
db.Category = Category(sequelize, Sequelize);
// db.Room = Room(sequelize, Sequelize);
// db.Member = Member(sequelize, Sequelize);
db.Message = Message(sequelize, Sequelize);
// db.History = History(sequelize, Sequelize);
// db.Notice = Notice(sequelize, Sequelize);
// db.BackupQueue = BackupQueue(sequelize, Sequelize);

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;

db.Sequelize = Sequelize;

export default db;
