import moment from "moment-timezone";

export const withTimezone = date =>
  moment(date)
    .tz("Asia/Seoul")
    .format("YYYY-MM-DD HH:mm:ss");
