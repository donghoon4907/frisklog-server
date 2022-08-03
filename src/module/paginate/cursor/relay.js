import { Op } from "sequelize";

class RelayStyleCursorPagination {
  constructor({ before, after, order, where }) {
    this.before = before;

    this.after = after;

    this.order = this.normalizeOrder(order);
    if (before) {
      this.order = this.reverseOrder(this.order);
    }

    this.cursor = null;
    if (before) {
      this.cursor = this.parseCursor(before);
    } else if (after) {
      this.cursor = this.parseCursor(after);
    }

    let query = null;
    if (this.cursor !== null) {
      query = this.getPaginationQuery(this.cursor);
    }

    this.where = where;
    if (query !== null) {
      this.where = { [Op.and]: [query, where] };
    }
  }

  builder(instances, cursorCount, totalCount) {
    if (this.before) {
      instances.reverse();
    }

    const remaining = cursorCount - instances.length;

    const hasNextPage =
      (!this.before && remaining > 0) ||
      (Boolean(this.before) && totalCount - cursorCount > 0);

    const hasPreviousPage =
      (Boolean(this.before) && remaining > 0) ||
      (!this.before && totalCount - cursorCount > 0);

    const edges = instances.map(node => ({
      node,
      cursor: this.createCursor(node)
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
  }

  normalizeOrder(order) {
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

    return this.ensurePrimaryKeyInOrder(normalized);
  }

  ensurePrimaryKeyInOrder(order) {
    return [...order, ["id", "ASC"]];
  }

  reverseOrder(order) {
    return order.map(([field, direction]) => [
      field,
      direction.toLowerCase() === "desc" ? "ASC" : "DESC"
    ]);
  }

  serializeCursor(payload) {
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  }

  createCursor(instance) {
    const payload = this.order.map(([field]) => instance.get(field));

    return this.serializeCursor(payload);
  }

  parseCursor(cursor) {
    if (!cursor) {
      return null;
    }

    try {
      return JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
    } catch (e) {
      return null;
    }
  }

  isValidCursor(cursor) {
    return cursor.length === this.order.length;
  }

  recursivelyGetPaginationQuery(cursor, order) {
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
            ...this.recursivelyGetPaginationQuery(
              cursor.slice(1),
              order.slice(1)
            )
          }
        ]
      };
    }
  }

  getPaginationQuery(cursor) {
    if (!this.isValidCursor(cursor)) {
      return null;
    }

    return this.recursivelyGetPaginationQuery(cursor, this.order);
  }
}

export default RelayStyleCursorPagination;
