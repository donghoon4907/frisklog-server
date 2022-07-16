import { QueryTypes } from "sequelize";
import bcrypt from "bcrypt";
import { frisklogGraphQLError } from "../../module/http";
import { generateToken, getToken, refreshToken } from "../../module/token";
import {
  USER_NOT_FOUND,
  USER_USING_EMAIL,
  USER_USING_NICKNAME,
  USER__MISMATCH__PASSWORD,
  USER_CREATE_ERROR
} from "../../config/message/user";
import { WRONG_AUTH } from "../../config";

const FRISKLOG_PLATFORM_ID = parseInt(process.env.PLATFORM_ID, 10);

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
        where: {
          PlatformId: FRISKLOG_PLATFORM_ID
        },
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
        SELECT u.id, u.nickname, u.avatar, u.PlatformId, u.link,
        (SELECT COUNT(*) FROM Posts WHERE UserId = u.id AND deletedAt is NULL) PostCount
        FROM Users AS u
        JOIN Posts AS p 
        ON p.UserId = u.id
        GROUP BY u.id
        HAVING PostCount > 0 and u.PlatformId = ${FRISKLOG_PLATFORM_ID}
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
     * @param {string} args.email    이메일
     * @param {string} args.password 암호
     */
    logIn: async (_, args, { db }) => {
      const { email, password } = args;

      const user = await db.User.findOne({
        where: { email, PlatformId: FRISKLOG_PLATFORM_ID }
      });

      if (user === null) {
        frisklogGraphQLError(USER_NOT_FOUND, {
          status: 403
        });
      }

      const auth = await bcrypt.compare(password, user.password);

      if (!auth) {
        frisklogGraphQLError(USER__MISMATCH__PASSWORD, {
          status: 403
        });
      }

      user["token"] = generateToken(user);

      return user;
    },
    /**
     * 구글 로그인
     *
     * @param {string}  args.email    이메일
     */
    logInWithGoogle: async (_, args, { db }) => {
      const { email, nickname } = args;

      const [user] = await db.User.findOrCreate({
        where: {
          email
        },
        defaults: {
          nickname
        }
      });

      user["token"] = generateToken(user);

      return user;
    },
    /**
     * 사용자 등록
     *
     * @param {string}  args.email    이메일
     * @param {string}  args.nickname 별명
     * @param {string?} args.avatar   썸네일 경로
     * @param {string}  args.password 암호
     */
    addUser: async (_, args, { db }) => {
      const { email, password, nickname, avatar } = args;

      const user = await db.User.findOne({
        where: {
          [db.Sequelize.Op.or]: [{ email }, { nickname }],
          PlatformId: FRISKLOG_PLATFORM_ID
        }
      });

      if (user !== null) {
        if (user.email === email) {
          frisklogGraphQLError(USER_USING_EMAIL, { status: 403 });
        } else if (user.nickname === nickname) {
          frisklogGraphQLError(USER_USING_NICKNAME, { status: 403 });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const createdUser = await db.User.create({
        email,
        password: hashedPassword,
        nickname,
        avatar,
        PlatformId: FRISKLOG_PLATFORM_ID
      });

      if (createdUser === null) {
        frisklogGraphQLError(USER_CREATE_ERROR, {
          status: 403
        });
      }

      await createdUser.update({ link: `/user/${createdUser.id}` });

      return true;
    },
    /**
     * 내 정보 수정
     *
     * @param {string}   args.password 암호
     * @param {string?}  args.nickname 별명
     * @param {string?}  args.avatar   프로필사진 경로
     * @deprecated {boolean?} args.isDev    개발 여부
     */
    updateUser: async (_, args, { request, isAuthenticated, db }) => {
      const { password, nickname, avatar } = args;

      const me = await isAuthenticated({ request });

      const param = {};

      if (nickname) {
        // 수정할 별명이 현재 별명과 다른 경우
        if (nickname !== me.nickname) {
          const user = await db.User.findOne({
            where: { nickname, PlatformId: FRISKLOG_PLATFORM_ID }
          });

          if (user !== null) {
            frisklogGraphQLError(USER_USING_NICKNAME, {
              status: 403
            });
          }

          param["nickname"] = nickname;
        }
      }

      if (avatar) {
        param["avatar"] = avatar;
      }

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 12);

        param["password"] = hashedPassword;
      }

      const updatedUser = await me.update(param);

      const prevToken = getToken(request);

      const nextToken = refreshToken(prevToken, updatedUser);

      if (nextToken === null) {
        frisklogGraphQLError(WRONG_AUTH, {
          status: 401
        });
      }

      updatedUser["token"] = nextToken;

      return updatedUser;
    }
  }
};
