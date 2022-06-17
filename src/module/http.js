import { GraphQLYogaError } from "@graphql-yoga/node";
import axios from "axios";

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

export const getIpClient = async () => {
  try {
    const { data } = await axios.get("https://api.ipify.org?format=json");

    return data.ip;
  } catch (e) {
    throw new Error(e);
  }
};
