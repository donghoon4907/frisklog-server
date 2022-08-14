class OffsetPaginate {
  constructor({ offset, limit }) {
    this.offset = offset;

    this.limit = limit;
  }

  getCurrentPage() {
    const { offset, limit } = this;

    let page = 1;
    if (offset > 0) {
      page = Math.ceil(offset / limit);
    }

    return page;
  }

  getLastPage(total) {
    const { limit } = this;

    return Math.ceil(total / limit);
  }

  response(instances, totalCount) {
    const { limit } = this;

    const pageInfo = {
      currentPage: this.getCurrentPage(),
      lastPage: this.getLastPage(totalCount),
      pageSize: limit,
      nodeCount: instances.length,
      totalCount
    };

    return {
      nodes: instances,
      pageInfo
    };
  }
}

export default OffsetPaginate;
