export default (sequelize, DataTypes) => {
  const History = sequelize.define(
    "History",
    {
      ip: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "조회 ip 주소"
      }
    },
    {
      charset: "utf8",
      collate: "utf8_general_ci",
      updatedAt: false
    }
  );

  History.associate = db => {};

  return History;
};
