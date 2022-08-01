import { Op } from "sequelize";

import {
  normalizeOrder,
  reverseOrder,
  parseCursor,
  createCursor,
  getPaginationQuery
} from "./util";

export const connectCursorPaginate = model => {
  const paginate = async args => {
    const { before, after, limit, order, where, scope, ...other } = args;

    let normalizedOrder = normalizeOrder(order);

    if (before) {
      normalizedOrder = reverseOrder(normalizedOrder);
    }

    let cursor = null;
    if (before) {
      cursor = parseCursor(before);
    } else if (after) {
      cursor = parseCursor(after);
    }

    let query = null;
    if (cursor !== null) {
      query = getPaginationQuery(cursor, normalizedOrder);
    }

    let queryWhere = where;
    if (query !== null) {
      queryWhere = { [Op.and]: [query, where] };
    }

    const queryOptions = {
      where: queryWhere,
      limit,
      order: normalizedOrder,
      ...other
    };

    const totalCountQueryOptions = {
      where
    };

    const cursorCountQueryOptions = {
      where: queryWhere,
      ...order
    };

    const [instances, totalCount, cursorCount] = await Promise.all([
      model.scope(scope).findAll(queryOptions),
      model.count(totalCountQueryOptions),
      model.count(cursorCountQueryOptions)
    ]);

    if (before) {
      instances.reverse();
    }

    const remaining = cursorCount - instances.length;

    const hasNextPage =
      (!before && remaining > 0) ||
      (Boolean(before) && totalCount - cursorCount > 0);

    const hasPreviousPage =
      (Boolean(before) && remaining > 0) ||
      (!before && totalCount - cursorCount > 0);

    const edges = instances.map(node => ({
      node,
      cursor: createCursor(node, normalizedOrder)
    }));

    const pageInfo = {
      hasNextPage,
      hasPreviousPage,
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
    };

    return {
      totalCount,
      edges,
      pageInfo
    };
  };

  return paginate;
};
