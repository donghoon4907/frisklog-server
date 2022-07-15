import "../module/env";
import db from "../models";
import { createPost } from "../module/backup";

(async () => {
  console.log(`Execute createBackupPostJob(DB => file) Start at ${new Date()}`);

  const posts = await db.Post.findAll({
    where: { hasBackup: { [db.Sequelize.Op.or]: ["N", ""] } },
    include: [
      {
        model: db.User
      }
    ]
  });

  posts.forEach(async post => {
    const { User, ...meta } = post;

    createPost(User.email, meta);

    await post.update({ hasBackup: "Y" });
  });
})();
