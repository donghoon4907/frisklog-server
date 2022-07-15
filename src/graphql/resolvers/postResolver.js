import moment from "moment";
import { literal } from "sequelize";

import { frisklogGraphQLError, getIpClient } from "../../module/http";
import {
  POST_NOT_FOUND,
  POST_CREATE_ERROR,
  POST_UPDATE_ERROR,
  POST_DESTROY_ERROR
} from "../../config/message/post";
import { WRONG_APPROACH } from "../../config/message";
// import { createPost, updatePost } from "../../module/backup";

export default {
  Query: {
    /**
     * 게시물 검색
     *
     * @param {number?}  args.offset 건너뛸 개수
     * @param {number}   args.limit 검색결과 개수
     * @param {string?}  args.order 정렬조건
     * @param {string?}  args.searchKeyword 검색어
     * @param {string?}  args.category 카테고리
     * @param {string?}  args.userId 사용자 ID
     * @deprecated {boolean?} args.isThereThumb 썸네일유무
     * @param {string?}  args.isLike 내가 좋아요한 포스트 여부(마이페이지에서만 사용, userId 필요)
     */
    posts: async (_, args, { db }) => {
      const {
        offset = 0,
        limit,
        order = "createdAt_DESC",
        searchKeyword,
        category,
        userId,
        isLike
        // isThereThumb,
        // isDev
      } = args;
      // post's condition
      const where = {};
      // post's user
      const user = {
        model: db.User
      };
      // post;s likers
      const likers = {
        model: db.User,
        as: "Likers"
      };

      // if (searchKeyword) {
      //   ["content"].forEach(column => {
      //     where[db.Sequelize.Op.or].push({
      //       [column]: {
      //         [db.Sequelize.Op.like]: `%${searchKeyword}%`
      //       }
      //     });
      //   });
      // } else {
      //   delete where[db.Sequelize.Op.or];
      // }

      if (searchKeyword) {
        where["content"] = {
          [db.Sequelize.Op.like]: `%${searchKeyword}%`
        };
      }

      if (category) {
        where["category"] = category;
      }

      if (userId) {
        where["UserId"] = userId;
      }

      if (isLike) {
        delete where["UserId"];

        likers["where"] = {
          id: userId
        };
      }

      // if (isThereThumb) {
      //   where[db.Sequelize.Op.not] = {
      //     thumbnail: null
      //   };
      // }

      const posts = db.Post.findAndCountAll({
        where,
        paranoid: true,
        include: [
          user,
          likers
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

      // 검색 시 history 추가
      if (category || searchKeyword) {
        const param = {};

        param.ip = await getIpClient();

        if (searchKeyword) {
          param["searchKeyword"] = searchKeyword;
        }

        if (category) {
          param["category"] = category;
        }

        const from = moment();
        from.set({ hour: 0, minute: 0, second: 0 });

        const to = moment();
        to.set({ hour: 23, minute: 59, second: 59 });

        // 검색 이력 확인
        const history = await db.History.findOne({
          where: {
            ...param,
            createdAt: {
              [db.Sequelize.Op.lt]: to,
              [db.Sequelize.Op.gt]: from
            }
          }
        });

        if (history === null) {
          await db.History.create(param);
        }
      }

      return posts;
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
    },
    /**
     * 추천 카테고리 검색
     *
     * @param {number?} args.offset 건너뛸 개수
     * @param {number}  args.limit  검색결과 개수
     */
    recommendCategories: async (_, args, { db }) => {
      const { offset = 0, limit } = args;

      return db.Post.findAll({
        attributes: [
          "category",
          [db.Sequelize.fn("COUNT", "*"), "searchCount"]
        ],
        group: "category",
        having: literal(`COUNT(*) > 0`),
        order: literal(`searchCount DESC`),
        limit,
        offset,
        raw: true
      });
    }
  },
  Mutation: {
    /**
     * 게시물 등록
     *
     * @deprecated {string?} args.title 제목
     * @deprecated {string?} args.description 소개
     * @param {string?} args.content 내용
     * @param {string?} args.category 카테고리명
     * @deprecated {string?} args.thumbnail 썸네일 경로
     * @param {boolean?} args.isDev 개발 여부
     */
    addPost: async (_, args, { request, isAuthenticated, db }) => {
      const { content, category, isDev } = args;

      const me = await isAuthenticated({ request }, isDev);

      const post = await db.Post.create({
        content,
        category,
        UserId: me.id,
        hasBackup: "Y"
      });

      if (post === null) {
        frisklogGraphQLError(POST_CREATE_ERROR, {
          status: 403
        });
      }
      // 백업작업 추가
      // const { UserId, ...meta } = post.toJSON();

      // const isSuccessBackup = createPost(me.email, meta);

      // if (!isSuccessBackup) {
      //   frisklogGraphQLError(POST_BACKUP_ERROR, {
      //     status: 403
      //   });
      // }

      return true;
    },
    /**
     * 게시물 수정
     *
     * @param {string?} args.id 게시물 ID
     * @deprecated {string?} args.title 제목
     * @deprecated {string?} args.description 소개
     * @param {string?} args.content 내용
     * @param {string?} args.category 카테고리명
     * @deprecated {string?} args.thumbnail 썸네일 경로
     * @param {boolean?} args.isDev 개발 여부
     */
    updatePost: async (_, args, { request, isAuthenticated, db }) => {
      const { id, content, category, isDev } = args;

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

      const updatedPost = await post.update({
        content,
        category
      });

      if (updatedPost === null) {
        frisklogGraphQLError(POST_UPDATE_ERROR, {
          status: 403
        });
      }

      // 백업작업 추가
      // const { UserId, ...meta } = updatedPost.toJSON();

      // const isSuccessBackup = updatePost(me.email, meta);

      // if (!isSuccessBackup) {
      //   frisklogGraphQLError(POST_BACKUP_ERROR, {
      //     status: 403
      //   });
      // }

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

      const deletedPost = await post.destroy();

      if (deletedPost === null) {
        frisklogGraphQLError(POST_DESTROY_ERROR, {
          status: 403
        });
      }

      // 백업작업 추가
      // const { UserId, ...meta } = deletedPost.toJSON();

      // const isSuccessBackup = updatePost(me.email, meta);

      // if (!isSuccessBackup) {
      //   frisklogGraphQLError(POST_BACKUP_ERROR, {
      //     status: 403
      //   });
      // }

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
