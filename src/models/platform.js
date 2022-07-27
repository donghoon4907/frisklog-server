export default (sequelize, DataTypes) => {
  const Platform = sequelize.define(
    "Platform",
    {
      platformName: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "플랫폼명"
      },
      logoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "로고이미지경로"
      },
      domainUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "도메인경로"
      }
      // storageUrl: {
      //   type: DataTypes.STRING,
      //   allowNull: false,
      //   comment: "저장소경로"
      // }
    },
    {
      charset: "utf8",
      collate: "utf8_general_ci",
      createdAt: false,
      updatedAt: false
    }
  );

  Platform.associate = db => {
    db.Platform.hasMany(db.User, { as: "Users" });
  };

  return Platform;
};
