export default (sequelize, DataTypes) => {
  const user = sequelize.define(
    "user",
    {
      firstName: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      lastName: {
        type: DataTypes.STRING(20),
        allowNull: false
      }
    },
    {
      charset: "utf8",
      collate: "utf8_general_ci"
    }
  );

  user.associate = db => {};

  return user;
};
