import { error } from "./http";

export const isAuthenticated = async ({ request: { user } }) => {
  if (!user) {
    error({
      message: "세션이 만료되었습니다. 로그인 페이지로 이동합니다.",
      status: 401
    });
  }
};
