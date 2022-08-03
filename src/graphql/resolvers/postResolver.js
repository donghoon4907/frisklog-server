import { frisklogGraphQLError } from "../../module/http";
import {
  POST_NOT_FOUND,
  POST_CREATE_ERROR,
  POST_UPDATE_ERROR,
  POST_DESTROY_ERROR
} from "../../config/message/post";
import { CATEGORY_NOT_FOUND } from "../../config/message/category";
import { WRONG_APPROACH } from "../../config/message";
import RelayStyleCursorPagination from "../../module/paginate/cursor/relay";

export default {
  Query: {
    /**
     * 게시물 검색
     *
     * @param {number}  args.limit         요청 목록의 수
     * @param {string?} args.searchKeyword 검색어
     * @param {string?} args.userId        사용자 ID
     * @param {string?} args.isLike        내가 좋아요한 포스트 여부(마이페이지에서만 사용, userId 필요)
     * @param {string?} args.isFollowing   내가 팔로잉한 포스트 여부(userId 필요)
     *
     * @param {string?} args.before         커서기준 이전컨텐츠 요청
     * @param {string?} args.after          커서기준 다음컨텐츠 요청
     * @param {string?} args.order          정렬
     */
    posts: async (_, args, { db }) => {
      const {
        limit,
        searchKeyword,
        userId,
        isLike,
        isFollowing,
        ...other
      } = args;

      const where = {};

      const likers = {
        model: db.User,
        as: "Likers"
      };

      const followers = {
        model: db.User,
        as: "Followers"
      };

      if (searchKeyword) {
        where["content"] = {
          [db.Sequelize.Op.like]: `%${searchKeyword}%`
        };
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

      if (isFollowing) {
        delete where["UserId"];

        followers["where"] = {
          id: userId
        };
      }

      const helper = new RelayStyleCursorPagination({ ...other, where });

      const commonOption = {
        include: [
          {
            model: db.User,
            include: [
              {
                model: db.Platform
              },
              followers
            ]
          },
          likers
        ],
        distinct: true
      };

      const totalCount = await db.Post.count({ ...commonOption, where });

      const { rows, count } = await db.Post.scope([
        "categories"
      ]).findAndCountAll({
        ...commonOption,
        limit,
        order: helper.order,
        where: helper.where
      });

      return helper.builder(rows, count, totalCount);
    },
    /**
     * 카테고리별 게시물 검색
     *
     * @param {string} args.content 카테고리명
     * @param {number} args.limit   포스트 요청 목록의 수
     *
     * @param {string?} args.before 커서기준 이전컨텐츠 요청
     * @param {string?} args.after  커서기준 다음컨텐츠 요청
     * @param {string?} args.order  정렬
     */
    postsByCategory: async (_, args, { db }) => {
      const { content, limit, ...other } = args;

      const category = await db.Category.findOne({ where: { content } });

      if (category === null) {
        frisklogGraphQLError(CATEGORY_NOT_FOUND, {
          status: 403
        });
      }

      const where = {};

      const helper = new RelayStyleCursorPagination({ ...other, where });

      const allPosts = await category.getPosts();

      const totalCount = allPosts.length;

      const posts = await category.getPosts({
        where: helper.where,
        include: [
          {
            model: db.User,
            include: [
              {
                model: db.Platform
              }
            ]
          },
          {
            model: db.User,
            as: "Likers"
          },
          {
            model: db.Category,
            as: "Categories"
          }
        ],
        order: helper.order,
        limit
      });

      return helper.builder(posts, posts.length, totalCount);
    }
  },
  Mutation: {
    /**
     * 게시물 등록
     *
     * @param {string?} args.content 내용
     * @param {string[]?} args.categories 카테고리
     */
    addPost: async (_, args, { request, isAuthenticated, db }) => {
      const { content, categories } = args;

      const me = await isAuthenticated({ request });

      const post = await db.Post.create({
        content,
        UserId: me.id
      });

      if (post === null) {
        frisklogGraphQLError(POST_CREATE_ERROR, {
          status: 403
        });
      }
      // 카테고리 추가
      for (let i = 0; i < categories.length; i++) {
        const [category] = await db.Category.findOrCreate({
          where: { content: categories[i] }
        });

        await post.addCategories(category);
      }

      return true;
    },
    /**
     * 게시물 수정
     *
     * @param {string?} args.id 게시물 ID
     * @param {string?} args.content 내용
     * @param {string[]?} args.categories 카테고리
     */
    updatePost: async (_, args, { request, isAuthenticated, db }) => {
      const { id, content, categories } = args;

      const me = await isAuthenticated({ request });

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

      const updatedPost = await post.update({ content });

      if (updatedPost === null) {
        frisklogGraphQLError(POST_UPDATE_ERROR, {
          status: 403
        });
      }
      // 기존에 저장된 카테고리 삭제 작업
      const prevCats = await updatedPost.getCategories();

      await updatedPost.removeCategories(prevCats);
      // 카테고리 추가
      for (let i = 0; i < categories.length; i++) {
        const [category] = await db.Category.findOrCreate({
          where: { content: categories[i] }
        });

        await updatedPost.addCategories(category);
      }

      return true;
    },
    /**
     * 게시물 삭제
     *
     * @param {string?} args.id 게시물 ID
     */
    deletePost: async (_, args, { request, isAuthenticated, db }) => {
      const { id } = args;

      const me = await isAuthenticated({ request });

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
      // 기존에 저장된 카테고리 삭제 작업
      const categories = await deletedPost.getCategories();

      await deletedPost.removeCategories(categories);

      return true;
    },
    /**
     * 게시물 좋아요
     *
     * @param {string} args.id 게시물 ID
     */
    likePost: async (_, args, { request, isAuthenticated, db }) => {
      const { id } = args;

      const me = await isAuthenticated({ request });

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
     */
    unlikePost: async (_, args, { request, isAuthenticated, db }) => {
      const { id } = args;

      const me = await isAuthenticated({ request });

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

/*

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
*/
