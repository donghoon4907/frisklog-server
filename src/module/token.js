import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;

const tokenConfig = {
  expiresIn: "1h"
};

export const generateToken = ({ id, nickname, avatar, email, isMaster }) =>
  jwt.sign({ id, nickname, avatar, email, isMaster }, jwtSecret, tokenConfig);

export const getToken = req => {
  const authorization = req.headers.get("authorization");

  let token;

  try {
    token = authorization.split(" ")[1];
  } catch (e) {
    token = null;
  }

  return token;
};

export const refreshToken = (
  prevToken,
  { id, nickname, avatar, email, isMaster }
) => {
  const isValid = decodeToken(prevToken);

  let nextToken;
  if (isValid === null) {
    nextToken = null;
  } else {
    nextToken = generateToken({ id, nickname, avatar, email, isMaster });
  }

  return nextToken;
};

export const decodeToken = token => {
  let decoded;

  try {
    decoded = jwt.verify(token, jwtSecret);
  } catch (e) {
    decoded = null;
  }

  return decoded;
};
