export default (sequelize, DataTypes) => {
  const Notice = sequelize.define(
    "Notice",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "제목"
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "내용"
      }
    },
    {
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
      paranoid: true
    }
  );

  Notice.associate = db => {};

  return Notice;
};
