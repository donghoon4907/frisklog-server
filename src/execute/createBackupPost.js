import fs from "fs";
import path from "path";

import "../module/env";
import db from "../models";

const BACKUP_PATH = path.join(__dirname, "../backup");

// Execute create backup post(DB => file)
(async () => {
  console.log(`Execute restorePostJob Start at ${new Date()}`);

  const notBackup = await db.Post.findAll({
    where: { hasBackup: { [db.Sequelize.Op.or]: ["N", null] } }
  });

  console.log(notBackup);

  try {
    // 백업 폴더 하위 파일명 목록
    const files = fs.readdirSync(BACKUP_PATH);

    files.forEach(async file => {
      const fileArr = file.split(".");

      const email = fileArr
        .filter((_, index) => index !== fileArr.length - 1)
        .join(".");

      const user = await db.User.findOne({ where: { email } });

      if (user === null) {
        return;
      }

      const json = fs.readFileSync(`${BACKUP_PATH}/${file}`, "utf-8");

      const { posts } = JSON.parse(json);

      posts.forEach(async ({ id, ...meta }) => {
        await db.Post.create({ ...meta, UserId: user.id });

        console.log(`${file} - post id: ${id} created.`);
      });
    });
  } catch (e) {
    console.log(e);
  }
})();
