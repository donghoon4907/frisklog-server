export default (sequelize, DataTypes) => {
  const Post = sequelize.define(
    "Post",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "제목"
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "소개"
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "내용"
      },
      viewCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "조회수"
      },
      thumbnail: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "썸네일"
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "카테고리명"
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
    db.Post.belongsToMany(db.User, { through: "Like", as: "Likers" });
  };

  return Post;
};
