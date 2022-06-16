import { GraphQLYogaError } from "@graphql-yoga/node";

export const error = ({ message, status }) => {
  throw new Error(
    JSON.stringify({
      message,
      status
    })
  );
};

export const frisklogGraphQLError = (message, extensions) => {
  throw new GraphQLYogaError(message, extensions);
};

export const getIp = req => {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  if (!ip) {
    throw new Error("ip not found");
  }

  return ip;
};
