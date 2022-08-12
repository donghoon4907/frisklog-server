import { Op } from "sequelize";

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

    db.Room.addScope("byMember", UserId => ({
      include: [
        {
          model: db.Member,
          as: "Members",
          require: true,
          where: {
            UserId
          }
        }
      ]
    }));
  };

  Room.findAllByUser = async function(UserId) {
    return this.scope({ method: ["byMember", UserId] }).findAll();
  };

  Room.prototype.getPartner = async function(db, UserId) {
    const members = await this.getMembers({
      where: {
        UserId: {
          [Op.not]: UserId
        }
      }
    });

    return db.User.findByPk(members[0].UserId);
  };

  Room.prototype.hasMember = async function(UserId) {
    const members = await this.getMembers({ where: { UserId } });

    return members.length === 1;
  };

  Room.prototype.addMember = async function(db, UserId) {
    const member = await db.Member.create({ UserId });

    return this.addMembers(member);
  };

  return Room;
};
