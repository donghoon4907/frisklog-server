import moment from "moment-timezone";

const DEFAULT_TIMEZONE = "Asia/Seoul";

const DEFAULT_FORMAT = "YYYY-MM-DD HH:mm:ss";

export const setTimeZone = date =>
  moment(date)
    .tz(DEFAULT_TIMEZONE)
    .format(DEFAULT_FORMAT);
/*
- replace setTimeZone 

date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
*/
