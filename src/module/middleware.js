import { error } from "./http";
import { decodeToken } from "../module/token";
import db from "../models";

/**
 * 인증 세션 체크
 *
 * @param {object} obj.request 요청 객체
 * @param {boolean?} isDev 개발 여부
 */
export const isAuthenticated = async ({ request }, isDev) => {
  let id;

  if (isDev) {
    id = 1;
  } else {
    const authorization = request.headers.get("authorization");

    const token = authorization.split(" ")[1];

    id = decodeToken(token);

    if (id === null) {
      error({
        message: "인증 오류가 발생했습니다. 로그인 페이지로 이동합니다.",
        status: 401
      });
    }
  }

  const user = await db.User.findByPk(id);

  if (user === null) {
    error({
      message: "세션이 만료되었습니다. 로그인 페이지로 이동합니다.",
      status: 401
    });
  }

  return user;
};
