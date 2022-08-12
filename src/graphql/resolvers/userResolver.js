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
import CursorPaginate from "../../module/paginate/cursor";

export default {
  Query: {
    /**
     * 추천 사용자 검색
     *
     * @param {number}  args.limit  요청 목록의 수
     */
    recommenders: async (_, args, { db }) => {
      const { limit } = args;

      const recommenders = await db.User.findAll({
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
        order: [[literal("postCount"), "DESC"]],
        limit
        // raw: true
        // nest: true
      });

      return recommenders.map(r => r.toJSON());
    },
    /**
     * 사용자 상세 조회
     *
     * @param {string} args.id 사용자 ID
     */
    user: async (_, args, { db }) => {
      const { id } = args;

      const user = await db.User.scope(["posts", "followers"]).findOne({
        where: { id }
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
     * @param {number?} args.offset 목록 시작 인덱스
     * @param {number}  args.limit  요청 목록의 수
     * @param {number}  args.order  정렬
     * @param {string}  args.userId 사용자 ID
     */
    followers: async (_, args, { db }) => {
      const { offset = 0, limit, order, userId } = args;

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
        order,
        limit,
        offset
      });

      return followers;
    },
    /**
     * 팔로잉 검색
     *
     * @param {number}  args.limit    요청 목록의 수
     * @param {number?} args.nickname 닉네임
     *
     * @param {string?} args.before   커서기준 이전컨텐츠 요청
     * @param {string?} args.after    커서기준 다음컨텐츠 요청
     * @param {string?} args.order    정렬
     */
    followings: async (_, args, { db, request, isAuthenticated }) => {
      const { limit, nickname, ...other } = args;

      const me = await isAuthenticated({ request });

      const where = {};

      if (nickname) {
        where["nickname"] = {
          [db.Sequelize.Op.like]: `%${nickname}%`
        };
      }

      const helper = new CursorPaginate({ ...other, where });

      const [total, cursors, followings] = await Promise.all([
        me.getFollowings({ where }),
        me.getFollowings({ where: helper.where }),
        me.getFollowings({
          where: helper.where,
          limit,
          order: helper.order,
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
        })
      ]);

      return helper.response(followings, cursors.length, total.length);
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
      const { email, token, keep } = args;

      const user = await db.User.findOne({
        where: { email, token, PlatformId: HOME_PLATFORM_ID }
      });

      if (user === null) {
        frisklogGraphQLError(USER_MISMATCH_TOKEN, {
          status: 403
        });
      }

      user.status = "online";

      await user.save();

      user["token"] = generateToken(user, keep ? null : "3h");

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
     * @param {string?}  args.status   상태
     */
    updateUser: async (_, args, { request, isAuthenticated, db }) => {
      const { nickname, avatar, status } = args;

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

      if (status) {
        param["status"] = status;
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
