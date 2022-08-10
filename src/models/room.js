import { withTimezone } from "../module/moment";

export default (sequelize, DataTypes) => {
  const Room = sequelize.define(
    "Room",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "채팅방명"
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
      charset: "utf8",
      collate: "utf8_general_ci",
      paranoid: true
    }
  );

  Room.associate = db => {
    db.Room.hasMany(db.Member, { as: "Members", onDelete: "cascade" });
    db.Room.hasMany(db.Message, { as: "Messages", onDelete: "cascade" });
  };

  return Room;
};
