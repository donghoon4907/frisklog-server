import { QueryTypes } from "sequelize";
import bcrypt from "bcrypt";
import { frisklogGraphQLError } from "../../module/http";
import { generateToken, getToken, refreshToken } from "../../module/token";
import {
  USER_NOT_FOUND,
  USER_USING_EMAIL,
  USER_USING_NICKNAME,
  USER_MISMATCH_TOKEN,
  USER_CREATE_ERROR,
  EMAIL_SEND_ERROR
} from "../../config/message/user";
import { WRONG_AUTH } from "../../config";
import { sendMail } from "../../module/mail";

// 플랫폼 ID
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
        SELECT u.id, u.nickname, u.avatar, u.PlatformId, u.link, pl.storageUrl,
        (SELECT COUNT(*) FROM Posts WHERE UserId = u.id AND deletedAt is NULL) postCount
        FROM Users AS u
        JOIN Posts AS p 
        ON p.UserId = u.id
        JOIN Platforms AS pl
        ON u.PlatformId = pl.id
        GROUP BY u.id
        HAVING postCount > 0 and u.PlatformId = ${FRISKLOG_PLATFORM_ID}
        ORDER BY postCount DESC
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
    /**
     * 팔로워 검색
     *
     * @param {number?} args.cursor 커서
     * @param {number}  args.limit  요청 목록의 수
     * @param {string}  args.userId 사용자 ID
     */
    followers: async (_, args, { db }) => {
      const { cursor = "0", limit, userId } = args;

      const intCursor = parseInt(cursor, 10);

      if (cursor > 0) {
        where["id"] = {
          [db.Sequelize.Op.lt]: intCursor
        };
      }

      const user = await db.User.findByPk(userId);

      if (user === null) {
        frisklogGraphQLError(USER_NOT_FOUND, {
          status: 403
        });
      }

      const followers = await user.getFollowers({
        where,
        include: [
          {
            model: db.Platform
          }
        ],
        order: [["id", "DESC"]],
        limit
      });

      return followers;
    },
    /**
     * 팔로잉 검색
     *
     * @param {number?} args.cursor 커서
     * @param {number}  args.limit  요청 목록의 수
     * @param {string}  args.userId 사용자 ID
     */
    followings: async (_, args, { db }) => {
      const { cursor = "0", limit, userId } = args;

      const intCursor = parseInt(cursor, 10);

      if (cursor > 0) {
        where["id"] = {
          [db.Sequelize.Op.lt]: intCursor
        };
      }

      const user = await db.User.findByPk(userId);

      if (user === null) {
        frisklogGraphQLError(USER_NOT_FOUND, {
          status: 403
        });
      }

      const followings = await user.getFollowings({
        where,
        include: [
          {
            model: db.Platform
          }
        ],
        order: [["id", "DESC"]],
        limit
      });

      return followings;
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

      const user = await db.User.findOne({
        where: { email, PlatformId: FRISKLOG_PLATFORM_ID }
      });

      if (user === null) {
        frisklogGraphQLError(USER_NOT_FOUND, {
          status: 403
        });
      }

      const token = Math.floor(Math.random() * 9000 + 1000);

      try {
        await sendMail({ email, token });

        await user.update({ token });
      } catch (e) {
        frisklogGraphQLError(EMAIL_SEND_ERROR, {
          status: 403
        });
      }

      return true;
    },
    /**
     * 인증
     *
     * @param {string} args.email 이메일
     * @param {string} args.token 인증코드
     */
    verifyToken: async (_, args, { db }) => {
      const { email, token } = args;

      const user = await db.User.findOne({
        where: { email, token, PlatformId: FRISKLOG_PLATFORM_ID }
      });

      if (user === null) {
        frisklogGraphQLError(USER_MISMATCH_TOKEN, {
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
     */
    addUser: async (_, args, { db }) => {
      const { email, nickname, avatar } = args;

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

      const createdUser = await db.User.create({
        email,
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
     * @param {string?}  args.nickname 별명
     * @param {string?}  args.avatar   프로필사진 경로
     */
    updateUser: async (_, args, { request, isAuthenticated, db }) => {
      const { nickname, avatar } = args;

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
