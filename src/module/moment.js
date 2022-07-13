import moment from "moment-timezone";

const DEFAULT_TIMEZONE = "Asia/Seoul";

const DEFAULT_FORMAT = "YYYY-MM-DD HH:mm:ss";

export const withTimezone = date =>
  moment(date)
    .tz(DEFAULT_TIMEZONE)
    .format(DEFAULT_FORMAT);
