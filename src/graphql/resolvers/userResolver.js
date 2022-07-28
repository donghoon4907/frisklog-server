import { literal, Op } from "sequelize";
import axios from "axios";

import { frisklogGraphQLError } from "../../module/http";
import { generateToken, getToken, refreshToken } from "../../module/token";
import {
  USER_NOT_FOUND,
  USER_USING_EMAIL,
  USER_USING_NICKNAME,
  USER_MISMATCH_TOKEN,
  EMAIL_SEND_ERROR
} from "../../config/message/user";
import { WRONG_AUTH } from "../../config";
import { sendMail } from "../../module/mail";
import { HOME_PLATFORM_ID, GITHUB_PLATFORM_ID } from "../../module/constants";

export default {
  Query: {
    /**
     * 사용자 검색
     *
     * @param {string?} args.cursor 커서
     * @param {number}  args.limit  요청 목록의 수
     */
    users: async (_, args, { db }) => {
      const { cursor = "0", limit } = args;

      const where = {
        PlatformId: HOME_PLATFORM_ID
      };

      const intCursor = parseInt(cursor, 10);

      if (intCursor > 0) {
        where["id"] = {
          [db.Sequelize.Op.lt]: intCursor
        };
      }

      const users = await db.User.findAll({
        where,
        include: [
          {
            model: db.Post,
            as: "Posts"
          }
        ],
        order: [["id", "DESC"]],
        limit
      });

      return users;
    },
    /**
     * 추천 사용자 검색
     *
     * @param {string?} args.cursor 커서
     * @param {number}  args.limit  요청 목록의 수
     */
    recommenders: async (_, args, { db }) => {
      const { cursor = "0", limit } = args;

      const where = {};

      const intCursor = parseInt(cursor, 10);

      if (intCursor > 0) {
        where["id"] = {
          [Op.lt]: intCursor
        };
      }

      const recommenders = await db.User.findAll({
        where,
        attributes: {
          include: [
            [
              literal(
                "(SELECT COUNT(*) FROM Posts WHERE UserId = User.id AND deletedAt is NULL)"
              ),
              "postCount"
            ]
          ]
        },
        include: [
          {
            model: db.Platform,
            as: "Platform"
          },
          {
            model: db.User,
            as: "Followers"
          }
        ],
        order: [[literal("postCount"), "DESC"]],
        limit
        // raw: true
        // nest: true
      });

      return recommenders.map(recommender => recommender.toJSON());
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
          },
          {
            model: db.User,
            as: "Followers"
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

      const where = {};

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

      const where = {};

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
        where: { email, PlatformId: HOME_PLATFORM_ID }
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
        where: { email, token, PlatformId: HOME_PLATFORM_ID }
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
     * Github 로그인
     *
     * @param {string} args.code
     */
    logInWithGithub: async (_, args, { db }) => {
      const { code } = args;

      try {
        const { data } = await axios.post(
          "https://github.com/login/oauth/access_token",
          {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code
          }
        );

        const fullStrToken = data.split("&")[0];

        const accessToken = fullStrToken.split("=")[1];

        const userInfo = await axios.get("https://api.github.com/user", {
          headers: {
            authorization: `token ${accessToken}`
          }
        });

        const { login, avatar_url } = userInfo.data;

        const [user] = await db.User.findOrCreate({
          where: {
            nickname: login,
            PlatformId: GITHUB_PLATFORM_ID
          },
          defaults: {
            avatar: avatar_url
          }
        });

        user["token"] = generateToken(user);

        return user;
      } catch (e) {
        console.log(e);
      }
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
          PlatformId: HOME_PLATFORM_ID
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
        avatar,
        PlatformId: HOME_PLATFORM_ID
      });

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
            where: { nickname, PlatformId: HOME_PLATFORM_ID }
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
    },
    /**
     * 팔로우
     *
     * @param {string} args.id 사용자 ID
     */
    follow: async (_, args, { request, isAuthenticated, db }) => {
      const { id } = args;

      const me = await isAuthenticated({ request });

      const user = await db.User.findByPk(id);

      if (user === null) {
        frisklogGraphQLError(USER_NOT_FOUND, {
          status: 403
        });
      } else {
        await me.addFollowings(user.id);
      }

      return true;
    },
    /**
     * 언팔로우
     *
     * @param {string} args.id 사용자 ID
     */
    unfollow: async (_, args, { request, isAuthenticated, db }) => {
      const { id } = args;

      const me = await isAuthenticated({ request });

      const user = await db.User.findByPk(id);

      if (user === null) {
        frisklogGraphQLError(USER_NOT_FOUND, {
          status: 403
        });
      } else {
        await me.removeFollowings(user.id);
      }

      return true;
    }
  }
};
