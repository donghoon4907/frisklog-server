import { frisklogGraphQLError } from "../../module/http";
import { ROOM_NOT_FOUND } from "../../config/message/room";

export default {
  Query: {
    /**
     * 채팅방의 메세지 검색
     *
     * @param {number?} args.offset 목록 시작 인덱스
     * @param {number}  args.limit  요청 목록의 수
     */
    messages: async (_, args, { db, request, isAuthenticated }) => {
      const { offset = 0, limit } = args;

      const me = await isAuthenticated({ request });

      const rooms = await db.Room.scope({
        method: ["byMember", me.id]
      }).findAll({
        include: [
          {
            model: db.Message,
            as: "Messages"
          }
        ],
        offset,
        limit
      });

      for (let i = 0; i < rooms.length; i++) {
        const partner = await rooms[i].getPartner(db, me.id);

        rooms[i].Partner = partner.toJSON();
      }

      return rooms;
    }
  },
  Mutation: {
    /**
     * 메세지 등록
     *
     * @param {string} args.content 메세지
     * @param {string} args.roomId  채팅방 ID
     */
    addMessage: async (_, args, { request, isAuthenticated, db, pubSub }) => {
      const { content, roomId } = args;

      const me = await isAuthenticated({ request });

      const message = await db.Message.create({
        content,
        UserId: me.id,
        RoomId: roomId
      });

      pubSub.publish("message", roomId, {
        mutation: "CREATED",
        node: message
      });

      return true;
    }
  },
  Subscription: {
    messageAdded: {
      subscribe: async (_, args, { db, pubSub }) => {
        const { roomId } = args;

        const room = await db.Room.findByPk(roomId);

        if (room === null) {
          frisklogGraphQLError(ROOM_NOT_FOUND, {
            status: 403
          });
        }

        pubSub.subscribe("message", roomId);
      },
      resolve: payload => payload
    }
  }
};
