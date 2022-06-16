import { QueryTypes } from "sequelize";
import { frisklogGraphQLError } from "../../module/http";
import { generateToken } from "../../module/token";
import {
  USER_NOT_FOUND,
  USER_USING_EMAIL,
  USER_USING_NICKNAME
} from "../../config/message/user";

export default {
  Query: {
    /**
     * 사용자 검색
     *
     * @param {number?} args.offset 건너뛸 개수
     * @param {number}  args.limit 검색결과 개수
     * @param {string?} args.order 정렬조건
     */
    users: async (_, args, { db }) => {
      const { offset = 0, limit, order = "createdAt_DESC" } = args;

      return db.User.findAndCountAll({
        include: [
          {
            model: db.Post,
            as: "Posts"
          }
        ],
        order: [order.split("_")],
        limit,
        offset
      });
    },
    /**
     * 추천 사용자 검색
     *
     * @param {number?} args.offset 건너뛸 개수
     * @param {number} args.limit 검색결과 개수
     */
    recommenders: async (_, args, { db }) => {
      const { offset = 0, limit } = args;

      return db.sequelize.query(
        `
        SELECT u.id, u.nickname, u.avatar,
        COUNT(*) AS PostCount
        FROM Users AS u
        JOIN Posts AS p ON p.UserId = u.id
        GROUP BY u.id
        ORDER BY PostCount DESC
        LIMIT ${limit} OFFSET ${offset}
        `,
        {
          type: QueryTypes.SELECT
        }
      );
    },
    /**
     * 사용자 상세 조회
     *
     * @param {number} args.id 사용자 ID
     */
    user: async (_, args, { db }) => {
      const { id } = args;

      const user = await db.User.findOne({
        where: { id },
        include: [
          {
            model: db.Post,
            as: "Posts"
          }
        ]
      });

      if (user === null) {
        frisklogGraphQLError(USER_NOT_FOUND, {
          status: 403
        });
      }

      return user;
    },
    me: async (_, __, { request, isAuthenticated, db }) => {
      const { id } = await isAuthenticated({ request });

      return db.User.findOne({
        where: { id }
      });
    }
  },
  Mutation: {
    /**
     * 로그인
     *
     * @param {string} args.email 이메일
     */
    logIn: async (_, args, { db }) => {
      const { email } = args;

      const user = await db.User.findOne({ where: { email } });

      if (user === null) {
        frisklogGraphQLError(USER_NOT_FOUND, {
          status: 403
        });
      }

      user["token"] = generateToken(user);

      return user;
    },
    /**
     * 사용자 등록
     *
     * @param {string} args.email 이메일
     * @param {string} args.nickname 별명
     * @param {string?} args.avatar 썸네일 경로
     */
    addUser: async (_, args, { db }) => {
      const { email, nickname, avatar } = args;

      const user = await db.User.findOne({
        where: {
          [db.Sequelize.Op.or]: [{ email }, { nickname }]
        }
      });

      if (user !== null) {
        if (user.email === email) {
          frisklogGraphQLError(USER_USING_EMAIL, { status: 403 });
        } else if (user.nickname === nickname) {
          frisklogGraphQLError(USER_USING_NICKNAME, { status: 403 });
        }
      }

      await db.User.create({
        email,
        nickname,
        avatar
      });

      return true;
    },
    /**
     * 내 정보 수정
     *
     * @param {string?} args.nickname 별명
     * @param {string?} args.avatar 프로필사진 경로
     * @param {boolean?} args.isDev 개발 여부
     */
    updateUser: async (_, args, { request, isAuthenticated, db }) => {
      const { nickname, avatar, isDev } = args;

      const me = await isAuthenticated({ request }, isDev);

      if (nickname) {
        // 수정할 별명이 현재 별명과 다른 경우
        if (nickname !== me.nickname) {
          const user = await db.User.findOne({
            where: { nickname }
          });

          if (user !== null) {
            frisklogGraphQLError(USER_USING_NICKNAME, {
              status: 403
            });
          }
        }
      }

      await me.update({ nickname, avatar });

      return true;
    }
  }
};
