import { frisklogGraphQLError } from "../../module/http";
import { USER_NOT_FOUND } from "../../config/message/user";
import { ROOM_NOT_FOUND } from "../../config/message/room";

export default {
  Query: {
    /**
     * 최근에 업데이트된 채팅방 검색
     *
     * @param {number?} args.offset 목록 시작 인덱스
     * @param {number}  args.limit  요청 목록의 수
     */
    rooms: async (_, args, { db, request, isAuthenticated }) => {
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
    },
    /**
     * 채팅방 상세 정보
     *
     * @param {string} args.id 채팅방 ID
     */
    room: async (_, args, { db, request, isAuthenticated }) => {
      const { id } = args;

      const me = await isAuthenticated({ request });

      const room = await db.Room.findOne({ where: { id } });

      if (room === null) {
        frisklogGraphQLError(ROOM_NOT_FOUND, {
          status: 403
        });
      }

      const partner = await room.getPartner(db, me.id);

      room.Partner = partner.toJSON();

      return room;
    }
  },
  Mutation: {
    /**
     * 채팅방 등록
     *
     * @param {string?} args.title  채팅방 제목
     * @param {string}  args.userId 사용자 ID
     */
    addRoom: async (_, args, { request, isAuthenticated, db }) => {
      const { title, userId } = args;

      const me = await isAuthenticated({ request });

      const user = await db.User.findByPk(userId);

      if (user === null) {
        frisklogGraphQLError(USER_NOT_FOUND, {
          status: 403
        });
      }

      const myRooms = await db.Room.findAllByUser(me.id);

      let newRoom = null;
      for (let i = 0; i < myRooms.length; i++) {
        const exist = await myRooms[i].hasMember(user.id);

        if (exist) {
          newRoom = myRooms[i];
          break;
        }
      }

      if (newRoom === null) {
        const params = {};

        if (title) {
          params["title"] = title;
        }

        const room = await db.Room.create(params);

        const members = [me, user];
        for (let i = 0; i < members.length; i++) {
          await room.addMember(db, members[i].id);
        }

        newRoom = room;
      }

      return newRoom;
    }
  }
};
