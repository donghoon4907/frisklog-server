import { withTimezone } from "../module/moment";
import { workVelogPostCrawling } from "../module/velog";

(async () => {
  console.log(`Execute getVelogData Start at ${withTimezone(new Date())}`);

  const workSuccess = await workVelogPostCrawling();

  console.log(
    `Execute getVelogData Success: ${workSuccess} at ${withTimezone(
      new Date()
    )}`
  );
})();
