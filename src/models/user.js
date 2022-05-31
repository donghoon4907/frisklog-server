export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
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

  User.associate = db => {};

  return User;
};
