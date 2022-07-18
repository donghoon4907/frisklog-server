import { frisklogGraphQLError } from "../../module/http";
import {
  COMMENT_NOT_FOUND,
  COMMENT_CREATE_ERROR
} from "../../config/message/comment";
import { POST_NOT_FOUND } from "../../config/message/post";
import { WRONG_APPROACH } from "../../config/message";

export default {
  Query: {
    /**
     * 댓글 검색
     *
     * @param {number?} args.offset 건너뛸 개수
     * @param {number}  args.limit  검색결과 개수
     * @param {string?} args.order  정렬조건
     * @param {string?} args.postId 게시물 ID
     */
    comments: async (_, args, { db }) => {
      const { offset = 0, limit, order = "createdAt_DESC", postId } = args;

      const where = {};

      if (postId) {
        where["PostId"] = postId;
      }

      return db.Comment.findAndCountAll({
        where,
        include: [
          {
            model: db.User,
            include: [
              {
                model: db.Platform
              }
            ]
          }
        ],
        order: [order.split("_")],
        limit,
        offset
      });
    }
  },
  Mutation: {
    /**
     * 댓글 등록
     *
     * @param {number} args.postId 게시물 ID
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

      const comment = await db.Comment.create({
        content,
        UserId: me.id,
        PostId: postId
      });

      if (comment === null) {
        frisklogGraphQLError(COMMENT_CREATE_ERROR, {
          status: 403
        });
      }

      return comment;
    },
    /**
     * 댓글 수정
     *
     * @param {string?} args.id 댓글 ID
     * @param {string?} args.content 내용
     * @param {boolean?} args.isDev 개발 여부
     */
    updateComment: async (_, args, { request, isAuthenticated, db }) => {
      const { id, content, isDev } = args;

      const me = await isAuthenticated({ request }, isDev);

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
     * @param {string?} args.id 게시물 ID
     * @param {boolean?} args.isDev 개발 여부
     */
    deleteComment: async (_, args, { request, isAuthenticated, db }) => {
      const { id, isDev } = args;

      const me = await isAuthenticated({ request }, isDev);

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
