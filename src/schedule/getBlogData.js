import schedule from "node-schedule";

import { withTimezone } from "../module/moment";
import { workVelogPostCrawling } from "../module/velog";

// 매일 4시에 실행
const getBlogDataJob = schedule.scheduleJob("* * 4 * * *", async function() {
  console.log(`getBlogDataJob Start at ${withTimezone(new Date())}`);

  const velogWorkSuccess = await workVelogPostCrawling();

  console.log(
    `getBlogDataJob velog success: ${velogWorkSuccess} at ${withTimezone(
      new Date()
    )}`
  );

  console.log(`getBlogDataJob Complete at ${withTimezone(new Date())}`);
});
