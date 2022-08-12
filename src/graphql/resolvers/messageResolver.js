import { Op } from "sequelize";

import { frisklogGraphQLError } from "../../module/http";
import { USER_NOT_FOUND } from "../../config/message/user";
import OffsetPaginate from "../../module/paginate/offset";

export default {
  Query: {
    /**
     * 받은 메세지 목록
     *
     * @param {number?} args.offset 목록 시작 인덱스
     * @param {number}  args.limit  요청 목록의 수
     */
    receivedMessages: async (_, args, { db, request, isAuthenticated }) => {
      const { offset = 0, limit } = args;

      const me = await isAuthenticated({ request });

      const paginate = new OffsetPaginate({ offset, limit });

      const { rows, count } = await db.Message.findAndCountAll({
        where: {
          to: me.id
        },
        order: [["id", "DESC"]],
        offset,
        limit
      });

      return paginate.response(rows, count);
    },
    /**
     * 보낸 메세지 목록
     *
     * @param {number?} args.offset 목록 시작 인덱스
     * @param {number}  args.limit  요청 목록의 수
     */
    sentMessages: async (_, args, { db, request, isAuthenticated }) => {
      const { offset = 0, limit } = args;

      const me = await isAuthenticated({ request });

      const paginate = new OffsetPaginate({ offset, limit });

      const { rows, count } = await db.Message.findAndCountAll({
        where: {
          from: me.id
        },
        order: [["id", "DESC"]],
        offset,
        limit
      });

      return paginate.response(rows, count);
    },
    /**
     * 메세지 상세
     *
     */
    message: async (_, args, { db, request, isAuthenticated }) => {
      const { id } = args;

      const me = await isAuthenticated({ request });

      const message = await db.Message.getByPk(id);

      if (message.to.id === me.id && message.readedTime === null) {
        message.readedTime = new Date();

        await message.save();
      }

      let previousItemId = null;

      const previousMessage = await message.getPreviousItem();
      if (previousMessage !== null) {
        previousItemId = previousMessage.id;
      }

      let nextItemId = null;

      const nextMessage = await message.getNextItem();
      if (nextMessage !== null) {
        nextItemId = nextMessage.id;
      }

      return {
        node: message,
        metadata: {
          previousItemId,
          nextItemId
        }
      };
    }
  },
  Mutation: {
    /**
     * 메세지 보내기
     *
     * @param {string} args.content 메세지 내용
     * @param {string} args.to      사용자 ID
     */
    sendMessage: async (_, args, { request, isAuthenticated, db, pubSub }) => {
      const { content, to } = args;

      const me = await isAuthenticated({ request });

      const user = await db.User.findByPk(to);

      if (user === null) {
        frisklogGraphQLError(USER_NOT_FOUND, {
          status: 403
        });
      }

      const message = await db.Message.create({
        content,
        from: me.id,
        to: user.id
      });

      return message;
    }
  }
};
