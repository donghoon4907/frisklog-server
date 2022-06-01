export default (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
    {
      useCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "사용횟수"
      },
      content: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "카테고리명"
      }
    },
    {
      charset: "utf8",
      collate: "utf8_general_ci"
    }
  );

  Category.associate = db => {};

  return Category;
};
