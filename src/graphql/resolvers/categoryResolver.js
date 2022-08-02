import { QueryTypes } from "sequelize";

export default {
  Query: {
    /**
     * 추천 카테고리 검색
     *
     * @param {number}  args.limit  검색결과 개수
     */
    recommendCategories: async (_, args, { db }) => {
      const { limit } = args;

      return db.sequelize.query(
        `
        SELECT c.id, c.content, COUNT(*) as useCount
        FROM Categories AS c
        JOIN PostCategories AS p 
        ON c.id = p.CategoryId
        GROUP BY c.id
        HAVING useCount > 0 
        ORDER BY useCount DESC
        LIMIT ${limit}
        `,
        {
          type: QueryTypes.SELECT
        }
      );
    }
  }
};
