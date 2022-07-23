import { withTimezone } from "../module/moment";

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
        allowNull: true,
        comment: "이메일"
      },
      link: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "블로그주소"
      },
      // password: {
      //   type: DataTypes.STRING,
      //   allowNull: true,
      //   comment: "암호"
      // },
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
        allowNull: false,
        comment: "프로필사진",
        defaultValue: "/avatar.png"
      },
      createdAt: {
        type: DataTypes.DATE,
        get() {
          return withTimezone(this.getDataValue("createdAt"));
        }
      },
      updatedAt: {
        type: DataTypes.DATE,
        get() {
          return withTimezone(this.getDataValue("updatedAt"));
        }
      }
    },
    {
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
      paranoid: true
    }
  );

  User.associate = db => {
    db.User.belongsTo(db.Platform);
    db.User.hasMany(db.Post, { as: "Posts", onDelete: "cascade" });
    db.User.hasMany(db.Comment, { as: "UserComments", onDelete: "cascade" });
    db.User.belongsToMany(db.Post, { through: "Likes", as: "LikedPost" });
    db.User.belongsToMany(db.User, {
      through: "Follows",
      as: "Followers",
      foreignKey: "FollowingId"
    });
    db.User.belongsToMany(db.User, {
      through: "Follows",
      as: "Followings",
      foreignKey: "FollowerId"
    });
  };

  return User;
};
