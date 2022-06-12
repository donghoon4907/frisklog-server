import { frisklogGraphQLError } from "../../module/http";
import { POST_NOT_FOUND } from "../../config/message/post";
import { WRONG_APPROACH } from "../../config/message";

export default {
  Query: {
    /**
     * 게시물 검색
     *
     * @param {number?} args.offset 건너뛸 개수
     * @param {number} args.limit 검색결과 개수
     * @param {string?} args.order 정렬조건
     * @param {string?} args.searchKeyword 검색어
     * @param {string?} args.category 카테고리
     * @param {number?} args.userId 사용자 ID
     * @param {boolean?} args.isThereThumb 썸네일유무
     */
    posts: async (_, args, { db }) => {
      const {
        offset = 0,
        limit,
        order = "createdAt_DESC",
        searchKeyword,
        category,
        userId,
        isThereThumb
      } = args;

      const where = {
        [db.Sequelize.Op.or]: []
      };

      if (searchKeyword) {
        ["title", "description"].forEach(column => {
          where[db.Sequelize.Op.or].push({
            [column]: {
              [db.Sequelize.Op.like]: `%${searchKeyword}%`
            }
          });
        });
      } else {
        delete where[db.Sequelize.Op.or];
      }

      if (category) {
        where["category"] = category;
      }

      if (userId) {
        where["UserId"] = userId;
      }

      if (isThereThumb) {
        where[db.Sequelize.Op.not] = {
          thumbnail: null
        };
      }

      return db.Post.findAndCountAll({
        where,
        include: [
          {
            model: db.User
          },
          {
            model: db.User,
            as: "Likers"
          }
          // {
          //   model: db.Comment,
          //   as: "PostComments",
          //   include: [
          //     {
          //       model: db.User
          //     }
          //   ]
          // }
        ],
        order: [order.split("_")],
        limit,
        offset
      });
    },
    /**
     * 게시물 상세 조회
     *
     * @param {number} args.id 게시물 ID
     */
    post: async (_, args, { db }) => {
      const { id } = args;

      const post = await db.Post.findOne({
        where: { id },
        include: [
          {
            model: db.User
          },
          {
            model: db.User,
            as: "Likers"
          }
          // {
          //   model: db.Comment,
          //   as: "PostComments",
          //   include: [
          //     {
          //       model: db.User
          //     }
          //   ]
          // }
        ]
      });

      if (post === null) {
        frisklogGraphQLError(POST_NOT_FOUND, {
          status: 403
        });
      }

      // to-be 조회수 증가

      return post;
    }
  },
  Mutation: {
    /**
     * 게시물 등록
     *
     * @param {string?} args.title 제목
     * @param {string?} args.description 소개
     * @param {string?} args.content 내용
     * @param {string?} args.category 카테고리명
     * @param {string?} args.thumbnail 썸네일 경로
     * @param {boolean?} args.isDev 개발 여부
     */
    addPost: async (_, args, { request, isAuthenticated, db }) => {
      const { title, description, content, category, thumbnail, isDev } = args;

      const me = await isAuthenticated({ request }, isDev);

      await db.Post.create({
        title,
        description,
        content,
        category,
        thumbnail,
        UserId: me.id
      });

      return true;
    },
    /**
     * 게시물 수정
     *
     * @param {string?} args.id 게시물 ID
     * @param {string?} args.title 제목
     * @param {string?} args.description 소개
     * @param {string?} args.content 내용
     * @param {string?} args.category 카테고리명
     * @param {string?} args.thumbnail 썸네일 경로
     * @param {boolean?} args.isDev 개발 여부
     */
    updatePost: async (_, args, { request, isAuthenticated, db }) => {
      const {
        id,
        title,
        description,
        content,
        category,
        thumbnail,
        isDev
      } = args;

      const me = await isAuthenticated({ request }, isDev);

      const post = await db.Post.findByPk(id);

      if (post === null) {
        frisklogGraphQLError(POST_NOT_FOUND, {
          status: 403
        });
        // 본인 게시물이 아닌 경우
      } else if (post.UserId !== me.id) {
        frisklogGraphQLError(WRONG_APPROACH, {
          status: 403
        });
      }

      await post.update({ title, description, content, category, thumbnail });

      return true;
    },
    /**
     * 게시물 삭제
     *
     * @param {string?} args.id 게시물 ID
     * @param {boolean?} args.isDev 개발 여부
     */
    deletePost: async (_, args, { request, isAuthenticated, db }) => {
      const { id, isDev } = args;

      const me = await isAuthenticated({ request }, isDev);

      const post = await db.Post.findByPk(id);

      if (post === null) {
        frisklogGraphQLError(POST_NOT_FOUND, {
          status: 403
        });
        // 본인 게시물이 아닌 경우
      } else if (post.UserId !== me.id) {
        frisklogGraphQLError(WRONG_APPROACH, {
          status: 403
        });
      }

      await post.destroy();

      return true;
    },
    /**
     * 게시물 좋아요
     *
     * @param {string} args.id 게시물 ID
     * @param {boolean?} args.isDev 개발 여부
     */
    likePost: async (_, args, { request, isAuthenticated, db }) => {
      const { id, isDev } = args;

      const me = await isAuthenticated({ request }, isDev);

      const post = await db.Post.findByPk(id);

      if (post === null) {
        frisklogGraphQLError(POST_NOT_FOUND, {
          status: 403
        });
      } else {
        await post.addLiker(me.id);
      }

      return true;
    },
    /**
     * 게시물 좋아요 취소
     *
     * @param {string?} args.id 게시물 ID
     * @param {boolean?} args.isDev 개발 여부
     */
    unlikePost: async (_, args, { request, isAuthenticated, db }) => {
      const { id, isDev } = args;

      const me = await isAuthenticated({ request }, isDev);

      const post = await db.Post.findByPk(id);

      if (post === null) {
        frisklogGraphQLError(POST_NOT_FOUND, {
          status: 403
        });
      } else {
        await post.removeLiker(me.id);
      }

      return true;
    }
  }
};
