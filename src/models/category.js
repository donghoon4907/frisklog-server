export default (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
    {
      content: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "카테고리명"
      }
    },
    {
      charset: "utf8",
      collate: "utf8_general_ci",
      createdAt: false,
      updatedAt: false
    }
  );

  Category.associate = db => {
    db.Category.belongsToMany(db.Post, { through: "PostCategory" });
  };

  return Category;
};
