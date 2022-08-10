import { frisklogGraphQLError } from "../../module/http";
import { USER_NOT_FOUND } from "../../config/message/user";

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

      const rooms = await db.Room.findAll({
        includes: [
          {
            model: db.User,
            as: "Members",
            where: {
              id: me.id
            }
          },
          {
            model: db.Message
          }
        ],
        offset,
        limit,
        order: [db.Message, "createdAt", "DESC"]
      });

      return rooms;
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

      const room = await db.Room.create({
        title
      });

      await room.addMembers([me, user]);

      return true;
    },
    /**
     * 댓글 수정
     *
     * @param {string} args.id      댓글 ID
     * @param {string} args.content 내용
     */
    updateComment: async (_, args, { request, isAuthenticated, db }) => {
      const { id, content } = args;

      const me = await isAuthenticated({ request });

      const comment = await db.Comment.findByPk(id);

      if (comment === null) {
        frisklogGraphQLError(COMMENT_NOT_FOUND, {
          status: 403
        });
        // 본인 댓글이 아닌 경우
      } else if (comment.UserId !== me.id) {
        frisklogGraphQLError(WRONG_APPROACH, {
          status: 403
        });
      }

      await comment.update({ content });

      return true;
    },
    /**
     * 댓글 삭제
     *
     * @param {string} args.id 게시물 ID
     */
    deleteComment: async (_, args, { request, isAuthenticated, db }) => {
      const { id } = args;

      const me = await isAuthenticated({ request });

      const comment = await db.Comment.findByPk(id);

      if (comment === null) {
        frisklogGraphQLError(COMMENT_NOT_FOUND, {
          status: 403
        });
        // 본인 댓글이 아닌 경우
      } else if (comment.UserId !== me.id) {
        frisklogGraphQLError(WRONG_APPROACH, {
          status: 403
        });
      }

      await comment.destroy();

      return true;
    }
  }
};
