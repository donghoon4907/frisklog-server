import { error } from "../../module/http";
import { generateToken } from "../../module/token";

export default {
  Query: {
    /**
     * 사용자 검색
     *
     * @param {number?} args.lastId 마지막으로 검색된 사용자 ID
     * @param {number} args.limit 검색결과 개수
     * @param {string?} args.order 정렬조건
     */
    users: async (_, args, { db }) => {
      const { offset = 0, limit, order = "createdAt_DESC" } = args;

      return db.User.findAll({
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
     * 사용자 상세 조회
     *
     * @param {number} args.id 사용자 ID
     */
    user: async (_, args, { db }) => {
      const { id } = args;

      const user = db.User.findOne({
        where: { id },
        include: [
          {
            model: db.Post,
            as: "Posts"
          }
        ]
      });

      if (!user) {
        error({
          message: "존재하지 않는 사용자입니다.",
          status: 403
        });
      }

      return user;
    },
    me: async (_, __, { request, isAuthenticated, db }) => {
      await isAuthenticated({ request });

      const {
        user: { id }
      } = request;

      return db.User.findOne({
        where: { id },
        include: [
          {
            model: db.Post,
            as: "Posts"
          }
        ]
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

      if (!user) {
        error({
          message: "등록되지 않은 이메일입니다.",
          status: 403
        });
      }

      const jsonUser = user.toJSON();

      jsonUser["token"] = generateToken({ id: jsonUser.id });

      return jsonUser;
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

      const isExistUser = await db.User.findOne({
        where: {
          [db.Sequelize.Op.or]: [{ email }, { nickname }]
        }
      });

      if (isExistUser) {
        if (isExistUser.email === email) {
          error({
            message: "이미 사용중인 이메일입니다.",
            status: 403
          });
        } else if (isExistUser.nickname === nickname) {
          error({
            message: "이미 사용중인 닉네임입니다.",
            status: 403
          });
        }
      }

      await db.User.create({
        email,
        nickname,
        avatar
      });

      // if (file) {
      //   const newAvatar = await db.Avatar.create({ url: file });

      //   await newUser.setAvatar(newAvatar);
      // }

      return true;
    },
    /**
     * 내 정보 수정
     *
     * @param {string?} args.nickname 별명
     * @param {string?} args.file 썸네일 경로
     */
    updateUser: async (_, args, { request, isAuthenticated, db }) => {
      await isAuthenticated({ request });

      const {
        user: { id }
      } = request;

      const { nickname, avatar } = args;

      const me = await db.User.findOne({ where: { id } });

      if (!me) {
        error({
          message: "존재하지 않는 사용자입니다.",
          status: 403
        });
      }

      if (nickname) {
        // 수정할 별명이 현재 별명과 다른 경우
        if (nickname !== me.nickname) {
          const isExistNickname = await db.User.findOne({
            where: { nickname }
          });

          if (isExistNickname) {
            error({
              message: "이미 존재하는 닉네임입니다.",
              status: 403
            });
          }
        }
      }

      await db.User.update({ nickname, avatar }, { where: { id } });

      return true;
    }
  }
};
