import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;

export const generateToken = ({ id, nickname, avatar, email, isMaster }) => {
  return jwt.sign({ id, nickname, email, avatar, isMaster }, jwtSecret, {
    expiresIn: "1h"
  });
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
