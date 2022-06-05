import moment from "moment";

export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      nickname: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "별명"
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: "이메일"
      },
      isMaster: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "관리자 여부"
      },
      token: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "인증 토큰"
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "프로필사진"
      },
      createdAt: {
        type: DataTypes.DATE,
        get() {
          return moment(this.getDataValue("createdAt")).format(
            "YYYY-MM-DD HH:mm:ss"
          );
        }
      },
      updatedAt: {
        type: DataTypes.DATE,
        get() {
          return moment(this.getDataValue("updatedAt")).format(
            "YYYY-MM-DD HH:mm:ss"
          );
        }
      }
    },
    {
      charset: "utf8",
      collate: "utf8_general_ci",
      paranoid: true
    }
  );

  User.associate = db => {
    db.User.hasMany(db.Post, { as: "Posts" });
    db.User.hasMany(db.Comment, { as: "UserComments" });
    db.User.belongsToMany(db.Post, { through: "Likes", as: "LikedPost" });
  };

  return User;
};
