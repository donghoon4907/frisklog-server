import { frisklogGraphQLError } from "./http";
import { decodeToken, getToken } from "../module/token";
import db from "../models";
import { WRONG_AUTH, EXPIRED_AUTH } from "../config/message";

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
    const token = getToken(request);

    try {
      id = decodeToken(token).id;

      if (id === null) {
        throw new Exception();
      }
    } catch (_) {
      frisklogGraphQLError(WRONG_AUTH, {
        status: 401
      });
    }
  }

  const user = await db.User.findByPk(id);

  if (user === null) {
    frisklogGraphQLError(EXPIRED_AUTH, {
      status: 401
    });
  }

  return user;
};
