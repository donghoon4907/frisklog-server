import { frisklogGraphQLError } from "../../module/http";

import { COMMENT_NOT_FOUND } from "../../config/message/comment";
import { POST_NOT_FOUND } from "../../config/message/post";
import { WRONG_APPROACH } from "../../config/message";
import CursorPaginate from "../../module/paginate/cursor";

export default {
  Query: {
    /**
     * 댓글 검색
     *
     * @param {number}  args.limit  요청 목록의 수
     * @param {string}  args.postId 게시물 ID
     *
     * @param {string?} args.before        커서기준 이전컨텐츠 요청
     * @param {string?} args.after         커서기준 다음컨텐츠 요청
     * @param {string[][]} args.order         정렬
     */
    comments: async (_, args, { db }) => {
      const { limit, postId, ...other } = args;

      const where = {
        PostId: postId
      };

      const helper = new CursorPaginate({ ...other, where });

      const [totalCount, { rows, count }] = await Promise.all([
        db.Comment.count({ where }),
        db.Comment.scope("user").findAndCountAll({
          where: helper.where,
          limit,
          order: helper.order
        })
      ]);

      return helper.response(rows, count, totalCount);
    }
  },
  Mutation: {
    /**
     * 댓글 등록
     *
     * @param {string} args.postId  게시물 ID
     * @param {string} args.content 내용
     */
    addComment: async (_, args, { request, isAuthenticated, db }) => {
      const { postId, content } = args;

      const me = await isAuthenticated({ request });

      const post = await db.Post.findByPk(postId);

      if (post === null) {
        frisklogGraphQLError(POST_NOT_FOUND, {
          status: 403
        });
      }

      await db.Comment.create({
        content,
        UserId: me.id,
        PostId: postId
      });

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
