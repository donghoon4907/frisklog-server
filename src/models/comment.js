import { withTimezone } from "../module/moment";

export default (sequelize, DataTypes) => {
  const Comment = sequelize.define(
    "Comment",
    {
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: "내용"
      },
      createdAt: {
        type: DataTypes.DATE,
        get() {
          return withTimezone(this.getDataValue("createdAt"));
        }
      },
      updatedAt: {
        type: DataTypes.DATE,
        get() {
          return withTimezone(this.getDataValue("updatedAt"));
        }
      }
    },
    {
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
      paranoid: true
    }
  );
  Comment.scopes = db => {
    db.Comment.addScope("user", {
      include: [
        {
          model: db.User,
          include: [
            {
              model: db.Platform
            }
          ]
        }
      ]
    });
  };
  Comment.associate = db => {
    db.Comment.belongsTo(db.User, { onDelete: "cascade" });
    db.Comment.belongsTo(db.Post, { onDelete: "cascade" });
  };

  return Comment;
};
