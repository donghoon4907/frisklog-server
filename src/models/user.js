import { withTimezone } from "../module/moment";
import { DEFAULT_AVATAR } from "../module/constants";

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
        type: DataTypes.VIRTUAL,
        get() {
          return `/user/${this.id}`;
        },
        set(value) {
          throw new Error("link는 변경할 수 없습니다.");
        }
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
        allowNull: false,
        comment: "프로필사진",
        defaultValue: DEFAULT_AVATAR
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "offline",
        validate: {
          isIn: [["online", "offline", "away", "busy"]]
        },
        comment: "상태"
      },
      statusText: {
        type: DataTypes.VIRTUAL,
        get() {
          const status = this.status;

          let statusText = null;
          if (status === "online") {
            statusText = "온라인";
          } else if (status === "offline") {
            statusText = "오프라인";
          } else if (status === "away") {
            statusText = "자리비움";
          } else if (status === "busy") {
            statusText = "바쁨";
          }

          return statusText;
        },
        set(value) {
          throw new Error("statusText는 변경할 수 없습니다.");
        }
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

  User.beforeUpdate(user => {
    const { avatar } = user;

    const hasDomain = avatar.includes("http");

    if (!hasDomain) {
      user.avatar = process.env.BACKEND_ROOT + avatar;
    }
  });

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

    db.User.addScope("posts", {
      include: [
        {
          model: db.Post,
          as: "Posts"
        }
      ]
    });
    db.User.addScope("followers", {
      include: [
        {
          model: db.User,
          as: "Followers"
        }
      ]
    });
    db.User.addScope("platform", {
      include: [
        {
          model: db.Platform,
          as: "Platform"
        }
      ]
    });
  };

  return User;
};
