import schedule from "node-schedule";
import fs from "fs";
import path from "path";

import db from "../../models";
import { withTimezone } from "../moment";

// Job:Backup post 매시 정각에 실행
const backupPostJob = schedule.scheduleJob("0 * * * *", async function() {
  console.log(`Execute backupPostJob ${withTimezone(new Date())}`);

  const queues = await db.BackupQueue.findAll();

  queues.forEach(async queue => {
    // backup 포스트 정보 로드
    const post = await db.Post.findOne({
      where: { id: queue.postId },
      include: [
        {
          model: db.User
        }
      ]
    });

    const { nickname, email, avatar, createdAt } = post.User;
    // backup 파일이 저장될 위치
    const backupFilePath = path.join(__dirname, `../backup/${email}.json`);
    // backup 파일에 저장될 데이터
    let backupData;

    try {
      // backup 파일 존재 체크
      const isExistBackup = fs.readFileSync(backupFilePath, "utf-8");
      // 파일 내용 로드
      backupData = JSON.parse(isExistBackup);
      // backup 파일이 없는 경우
    } catch {
      backupData = {
        nickname,
        avatar,
        createdAt,
        posts: []
      };
    }
    // 백업에 추가될 포스트 정보
    const backupPost = {
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    };

    if (queue.task === "create" || backupData.posts.length === 0) {
      backupData.posts = [...backupData.posts, backupPost];
    } else if (queue.task === "update") {
      backupData.posts.some((post, index) => {
        if (post.id === backupPost.id) {
          backupData.posts.splice(index, 1, backupPost);

          return true;
        }
        return false;
      });
    }

    try {
      fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, "\t"));
      // queue에서 제거
      await queue.destroy();
      // post 업데이트
      if (post.isBackup === "N") {
        await post.update({
          isBackup: "Y"
        });
      }
    } catch (e) {
      console.log(e);
    }
  });
});
