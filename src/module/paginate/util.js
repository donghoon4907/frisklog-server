import { Op } from "sequelize";

/**
 * primary key 정렬을 추가
 *
 * @param {*} order
 */
const ensurePrimaryKeyInOrder = order => [...order, ["id", "ASC"]];

/**
 * order 정규화
 *
 * @param {*} order
 */
export const normalizeOrder = order => {
  let normalized = [];

  if (Array.isArray(order)) {
    normalized = order.map(o => {
      if (typeof o === "string") {
        return [o, "ASC"];
      }

      if (Array.isArray(o)) {
        const [field, direction] = o;

        return [field, direction || "ASC"];
      }

      return o;
    });
  }

  return ensurePrimaryKeyInOrder(normalized);
};

export const reverseOrder = order =>
  order.map(([field, direction]) => [
    field,
    direction.toLowerCase() === "desc" ? "ASC" : "DESC"
  ]);

export const parseCursor = cursor => {
  if (!cursor) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
  } catch (e) {
    return null;
  }
};

const serializeCursor = payload =>
  Buffer.from(JSON.stringify(payload)).toString("base64");

export const createCursor = (instance, order) => {
  const payload = order.map(([field]) => instance.get(field));

  return serializeCursor(payload);
};

const isValidCursor = (cursor, order) => {
  return cursor.length === order.length;
};

const recursivelyGetPaginationQuery = (cursor, order) => {
  const op = order[0][1].toLowerCase() === "desc" ? Op.lt : Op.gt;

  if (order.length === 1) {
    return {
      [order[0][0]]: {
        [op]: cursor[0]
      }
    };
  } else {
    return {
      [Op.or]: [
        {
          [order[0][0]]: {
            [op]: cursor[0]
          }
        },
        {
          [order[0][0]]: cursor[0],
          ...recursivelyGetPaginationQuery(cursor.slice(1), order.slice(1))
        }
      ]
    };
  }
};

export const getPaginationQuery = (cursor, order) => {
  if (!isValidCursor(cursor, order)) {
    return null;
  }

  return recursivelyGetPaginationQuery(cursor, order);
};
