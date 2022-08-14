import moment from "moment-timezone";

const DEFAULT_TIMEZONE = "Asia/Seoul";

const DEFAULT_FORMAT = "YYYY-MM-DD HH:mm:ss";

export const setTimeZone = (date, format = DEFAULT_FORMAT) =>
  moment(date)
    .tz(DEFAULT_TIMEZONE)
    .format(format);
/*
- replace setTimeZone 

date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
*/
