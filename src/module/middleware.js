import { error } from "./http";

/**
 * 인증 세션 체크
 *
 * @param {object} request 요청 객체
 * @param {boolean?} isDev 개발 여부
 */
export const isAuthenticated = ({ request: { user } }, isDev) => {
  let id;
  if (isDev) {
    id = 1;
  } else {
    if (!user) {
      error({
        message: "세션이 만료되었습니다. 로그인 페이지로 이동합니다.",
        status: 401
      });
    }
    id = user.id;
  }

  return id;
};
