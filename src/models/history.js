export default (sequelize, DataTypes) => {
  const History = sequelize.define(
    "History",
    {
      category: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "카테고리"
      },
      searchKeyword: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "검색어"
      },
      ip: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "ip"
      }
    },
    {
      charset: "utf8",
      collate: "utf8_general_ci",
      updatedAt: false
    }
  );

  History.associate = db => {
    // db.History.belongsTo(db.User, {
    //   foreignKey: "UserId",
    //   allowNull: true
    // });
  };

  return History;
};
