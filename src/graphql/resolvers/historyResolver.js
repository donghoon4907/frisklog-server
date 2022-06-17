import { QueryTypes, literal } from "sequelize";

export default {
  Query: {
    /**
     * 추천 카테고리 검색
     *
     * @param {number?} args.offset 건너뛸 개수
     * @param {number}  args.limit  검색결과 개수
     */
    recommendCategories: async (_, args, { db }) => {
      const { offset = 0, limit } = args;

      // db.sequelize.query(
      //   `
      //   SELECT category, COUNT(*) as count
      //   FROM Histories
      //   GROUP BY category
      //   HAVING COUNT(*) > 0
      //   LIMIT ${limit} OFFSET ${offset}
      //   `,
      //   {
      //     type: QueryTypes.SELECT
      //   }
      // );

      return db.History.findAll({
        attributes: [
          "category",
          [db.Sequelize.fn("COUNT", "*"), "searchCount"]
        ],
        group: "category",
        having: literal(`COUNT(*) > 0`),
        order: literal(`searchCount DESC`),
        limit,
        offset,
        raw: true
      });
    }
  },
  Mutation: {}
};
