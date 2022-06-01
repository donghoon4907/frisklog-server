export const error = ({ message, status }) => {
  throw Error(
    JSON.stringify({
      message,
      status
    })
  );
};
