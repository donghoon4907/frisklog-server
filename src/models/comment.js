import { setTimeZone } from "../module/moment";

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
          return setTimeZone(this.getDataValue("createdAt"));
        }
      },
      updatedAt: {
        type: DataTypes.DATE,
        get() {
          return setTimeZone(this.getDataValue("updatedAt"));
        }
      }
    },
    {
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
      paranoid: true
    }
  );

  Comment.associate = db => {
    db.Comment.belongsTo(db.User);
    db.Comment.belongsTo(db.Post);

    db.Comment.addScope("user", {
      include: [
        {
          model: db.User
        }
      ]
    });
  };

  return Comment;
};
