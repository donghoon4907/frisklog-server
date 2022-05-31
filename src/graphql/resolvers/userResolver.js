import db from "../../models";

export default {
  Query: {
    users: async (_, args) => {
      return db.User.findAll();
    }
  },
  Mutation: {
    addUser: async (_, args) => {}
  }
};
