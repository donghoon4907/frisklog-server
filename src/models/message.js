import { withTimezone } from "../module/moment";

export default (sequelize, DataTypes) => {
  const Message = sequelize.define(
    "Message",
    {
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: "내용"
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "타입",
        defaultValue: "chat",
        validate: {
          isIn: [["chat", "notice"]]
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

  Message.associate = db => {
    db.Message.belongsTo(db.Room);
    db.Message.belongsTo(db.User);
  };

  return Message;
};
