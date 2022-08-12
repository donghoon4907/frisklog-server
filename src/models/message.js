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
      from: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "보낸사용자ID"
      },
      to: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "받은사용자ID"
      },
      readedTime: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "읽은 시각",
        get() {
          const readedTime = this.getDataValue("readedTime");

          if (readedTime !== null) {
            readedTime = withTimezone(readedTime);
          }

          return readedTime;
        }
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        get() {
          return withTimezone(this.getDataValue("createdAt"));
        }
      }
    },
    {
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
      updatedAt: false,
      paranoid: true
    }
  );

  Message.associate = db => {};

  return Message;
};
