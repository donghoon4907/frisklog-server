import { frisklogGraphQLError } from "../../module/http";
import {
  MESSAGE_DISALLOW_TYPE,
  MESSAGE_EMPTY_RECEIVERS
} from "../../config/message/message";
import OffsetPaginate from "../../module/paginate/offset";

export default {
  Query: {
    /**
     * 메세지 목록
     *
     * @param {number?} args.offset 목록 시작 인덱스
     * @param {number}  args.limit  요청 목록의 수
     * @param {string}  args.type   요청 타입
     */
    messages: async (_, args, { db, request, isAuthenticated }) => {
      const { offset = 0, limit, type } = args;

      const me = await isAuthenticated({ request });

      const where = {};

      if (type === "receive") {
        where["to"] = me.id;
      } else if (type === "sent") {
        where["from"] = me.id;
      } else {
        frisklogGraphQLError(MESSAGE_DISALLOW_TYPE, {
          status: 403
        });
      }

      const paginate = new OffsetPaginate({ offset, limit });

      const { rows, count } = await db.Message.findAndCountAll({
        where,
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
    sendMessage: async (_, args, { request, isAuthenticated, db }) => {
      const { content, receivers } = args;

      const me = await isAuthenticated({ request });

      if (receivers.length === 0) {
        frisklogGraphQLError(MESSAGE_EMPTY_RECEIVERS, {
          status: 403
        });
      }

      for (let i = 0; i < receivers.length; i++) {
        const user = await db.User.getByPk(receivers[i]);

        await db.Message.create({
          content,
          from: me.id,
          to: user.id
        });
      }

      return true;
    }
  }
};
