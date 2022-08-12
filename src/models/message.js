import { setTimeZone } from "../module/moment";
import { MESSAGE_NOT_FOUND } from "../config/message/message";
import { frisklogGraphQLError } from "../module/http";

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
        comment: "보낸사용자ID",
        async get() {
          return this.getUser(this.getDataValue("from"));
        }
      },
      to: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "받은사용자ID",
        async get() {
          return this.getUser(this.getDataValue("to"));
        }
      },
      readedTime: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "읽은 시각",
        get() {
          const readedTime = this.getDataValue("readedTime");

          if (readedTime !== null) {
            readedTime = setTimeZone(readedTime);
          }

          return readedTime;
        },
        set(value) {
          const readedTime = setTimeZone(value);

          this.setDataValue(readedTime);
        }
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        get() {
          return setTimeZone(this.getDataValue("createdAt"));
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

  Message.associate = db => {
    db.Message.getByPk = async function(id) {
      const message = this.findByPk(id);

      if (message === null) {
        frisklogGraphQLError(MESSAGE_NOT_FOUND, {
          status: 403
        });
      }

      return message;
    };

    db.Message.prototype.getUser = async function(userId) {
      return db.User.findByPk(userId);
    };

    db.Message.prototype.getPreviousItem = async function() {
      return db.Message.findOne({
        where: {
          id: {
            [Op.gt]: this.id
          }
        }
      });
    };

    db.Message.prototype.getNextItem = async function() {
      return db.Message.findOne({
        where: {
          id: {
            [Op.gt]: this.id
          }
        }
      });
    };
  };

  return Message;
};
