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
