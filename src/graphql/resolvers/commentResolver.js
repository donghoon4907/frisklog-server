import { frisklogGraphQLError } from "../../module/http";
import { COMMENT_NOT_FOUND } from "../../config/message/comment";
import { POST_NOT_FOUND } from "../../config/message/post";
import { WRONG_APPROACH } from "../../config/message";

export default {
  Mutation: {
    /**
     * 댓글 등록
     *
     * @param {number} args.postId 게시물 ID
     * @param {string} args.content 내용
     * @param {boolean?} args.isDev 개발 여부
     */
    addComment: async (_, args, { request, isAuthenticated, db }) => {
      const { postId, content, isDev } = args;

      const me = await isAuthenticated({ request }, isDev);

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
