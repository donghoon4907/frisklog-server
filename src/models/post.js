import { setTimeZone } from "../module/moment";

export default (sequelize, DataTypes) => {
  const Post = sequelize.define(
    "Post",

    {
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "내용"
      },
      link: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "포스트주소"
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

  Post.associate = db => {
    db.Post.belongsTo(db.User);
    db.Post.hasMany(db.Comment, { as: "PostComments", onDelete: "cascade" });
    db.Post.belongsToMany(db.User, { through: "Likes", as: "Likers" });
    db.Post.belongsToMany(db.Category, { through: "PostCategories" });

    db.Post.addScope("likers", {
      include: [
        {
          model: db.User,
          as: "Likers"
        }
      ]
    });

    db.Post.addScope("categories", {
      include: [
        {
          model: db.Category,
          as: "Categories"
        }
      ]
    });
  };

  return Post;
};
