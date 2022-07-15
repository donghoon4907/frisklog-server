import { withTimezone } from "../module/moment";

export default (sequelize, DataTypes) => {
  const Post = sequelize.define(
    "Post",
    {
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "내용"
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "카테고리명"
      },
      hasBackup: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "N",
        comment: "백업파일유무"
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

  Post.associate = db => {
    db.Post.belongsTo(db.User);
    db.Post.hasMany(db.Comment, { as: "PostComments" });
    db.Post.belongsToMany(db.User, { through: "Likes", as: "Likers" });
  };

  return Post;
};
